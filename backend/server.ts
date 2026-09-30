import express from 'express';
import path from 'path';
import { createHmac, timingSafeEqual } from 'node:crypto';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { answerWithVerifiedPlaces } from './verifiedChat.ts';
import { createVerifiedPlan } from './verifiedPlanRoute.ts';
import { DeepSeekClient } from '../ai/deepseekClient.ts';
import { validateAssistantImage, analyzeAssistantImage } from '../ai/imageAnalysis.ts';
import { getImageRecommendations } from '../ai/imageRecommendations.ts';
import { resolveChatAction } from '../ai/chatActions.ts';
import { getSuggestedChatActions } from '../ai/suggestedChatActions.ts';
import { CITY_NAMES, findDuplicates, getAdminPlace, getCityPlaces, getImage, listAdminPlaces, listAudit, saveImage, saveManagedPlace, savePlace, setDeleted } from './placeStore.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// DeepSeek powers the travel assistant and verified planner. Gemini remains
// configured separately for the team's existing receipt scanner.
const deepSeekApiKey = process.env.DEEPSEEK_API_KEY?.trim();
const thinking = process.env.DEEPSEEK_THINKING === 'enabled' ? 'enabled' : 'disabled';
const ai = deepSeekApiKey ? new DeepSeekClient(deepSeekApiKey, process.env.DEEPSEEK_MODEL || 'deepseek-flash', thinking) : null;
const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
const plannerAI: GoogleGenAI | null = geminiApiKey ? new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  }) : null;

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', aiProvider: 'deepseek', hasDeepSeekKey: !!deepSeekApiKey,
    model: ai?.model || process.env.DEEPSEEK_MODEL || 'deepseek-flash', thinking: ai?.thinking || thinking,
    hasGeminiKey: !!geminiApiKey });
});

// 1.5. Real AI Receipt Scanner (Vision OCR)
// Không bao giờ trả dữ liệu hóa đơn giả: AI không chạy / không đọc được → báo lỗi để người dùng nhập tay.
const RECEIPT_MAX_BYTES = 8 * 1024 * 1024;
const RECEIPT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const RECEIPT_MAX_AMOUNT = 1_000_000_000;
const RECEIPT_CATEGORIES = ['food', 'stay', 'transport', 'other'];
const RECEIPT_PAYMENT_METHODS = ['cash', 'transfer', 'card'];

const cleanText = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.replace(/\s+/g, ' ').trim().slice(0, maxLength) : '';

app.post('/api/scan-receipt', async (req, res) => {
  try {
    const { imageBase64 } = req.body ?? {};
    if (typeof imageBase64 !== 'string' || !imageBase64) {
      return res.status(400).json({ error: 'Thiếu ảnh hóa đơn.', code: 'IMAGE_REQUIRED' });
    }

    const match = imageBase64.match(/^data:(image\/[a-z+.-]+);base64,(.+)$/i);
    const mimeType = (match?.[1] ?? 'image/jpeg').toLowerCase();
    const base64Data = match ? match[2] : imageBase64;
    if (!RECEIPT_MIME_TYPES.includes(mimeType)) {
      return res.status(415).json({ error: 'Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc HEIC.', code: 'UNSUPPORTED_TYPE' });
    }
    if (Math.floor((base64Data.length * 3) / 4) > RECEIPT_MAX_BYTES) {
      return res.status(413).json({ error: 'Ảnh quá lớn (tối đa 8MB).', code: 'IMAGE_TOO_LARGE' });
    }

    if (!plannerAI) {
      return res.status(503).json({
        error: 'Tính năng đọc hóa đơn bằng AI chưa được bật (thiếu GEMINI_API_KEY). Vui lòng nhập số tiền thủ công.',
        code: 'AI_UNAVAILABLE'
      });
    }

    let parsed: any;
    try {
      const response = await plannerAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          {
            role: 'user',
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              {
                text: `Bạn là trợ lý AI chuyên đọc và bóc tách dữ liệu hóa đơn du lịch, ẩm thực và mua sắm tại Việt Nam.
Hãy đọc ảnh hóa đơn này và trả về JSON thuần túy (không markdown, không bọc backtick) với cấu trúc:
{
  "store": "Tên cửa hàng, khách sạn hoặc dịch vụ",
  "address": "Địa chỉ nếu có trên hóa đơn",
  "invoiceNo": "Mã số hóa đơn nếu có",
  "date": "Ngày giờ trên hóa đơn hoặc hôm nay",
  "totalAmount": 123000,
  "category": "food",
  "paymentMethod": "transfer",
  "items": [{"name": "tên món/dịch vụ", "price": 50000}]
}
Lưu ý: totalAmount phải là số nguyên (VNĐ). category phải là 1 trong 4 giá trị: "food", "stay", "transport", "other". paymentMethod là "cash", "transfer" hoặc "card".`
              }
            ]
          }
        ]
      });
      const jsonMatch = (response.text || '').match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (aiErr) {
      console.warn('Gemini vision scan error:', aiErr);
      return res.status(502).json({ error: 'AI tạm thời không đọc được hóa đơn. Vui lòng thử lại hoặc nhập thủ công.', code: 'AI_FAILED' });
    }

    const totalAmount = Math.round(Number(parsed?.totalAmount));
    if (!parsed || !Number.isFinite(totalAmount) || totalAmount <= 0 || totalAmount > RECEIPT_MAX_AMOUNT) {
      return res.status(422).json({ error: 'Không đọc được tổng tiền trên ảnh. Hãy chụp rõ hơn hoặc nhập thủ công.', code: 'UNREADABLE' });
    }

    const items = Array.isArray(parsed.items)
      ? parsed.items
          .slice(0, 50)
          .map((item: any) => ({ name: cleanText(item?.name, 100), price: Math.round(Number(item?.price)) }))
          .filter((item: any) => item.name && Number.isFinite(item.price) && item.price >= 0)
      : [];

    res.json({
      success: true,
      source: 'gemini-ai',
      data: {
        store: cleanText(parsed.store, 100) || 'Khoản chi từ hóa đơn',
        address: cleanText(parsed.address, 200),
        invoiceNo: cleanText(parsed.invoiceNo, 50),
        date: cleanText(parsed.date, 50),
        totalAmount,
        category: RECEIPT_CATEGORIES.includes(parsed.category) ? parsed.category : 'other',
        paymentMethod: RECEIPT_PAYMENT_METHODS.includes(parsed.paymentMethod) ? parsed.paymentMethod : 'cash',
        items
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Lỗi xử lý hóa đơn' });
  }
});

// Verified trip APIs use the same stored place records as Explore and Nearby.
app.post('/api/chat', async (req, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const conversationHistory = Array.isArray(req.body?.conversationHistory) ? req.body.conversationHistory : [];
    const language = typeof req.body?.language === 'string' ? req.body.language : 'vi';
    const result = await answerWithVerifiedPlaces(message, conversationHistory, ai, '', language);
    const suggestedActions = getSuggestedChatActions([...conversationHistory, { sender: 'user', text: message }],
      { sender: 'ai', text: result.text, suggestedActions: result.suggestedActions, verifiedActions: result.verifiedActions, actionsUnavailable: !ai || result.actionsUnavailable === true });
    return res.json({ ...result, actionsUnavailable: !ai || result.actionsUnavailable === true, suggestedActions });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi xử lý AI Chatbot' });
  }
});

app.post('/api/ai/analyze-image', async (req, res) => {
  let imageDataUrl: string;
  try { imageDataUrl = validateAssistantImage(req.body?.imageDataUrl); }
  catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : 'Ảnh không hợp lệ.' }); }
  if (!ai) return res.status(503).json({ error: 'Chưa cấu hình DEEPSEEK_API_KEY để phân tích ảnh.' });
  try {
    const question = typeof req.body?.question === 'string' ? req.body.question : '';
    const analysis = await analyzeAssistantImage(imageDataUrl, question, ai);
    const recommendations = await getImageRecommendations(analysis);
    const note = recommendations.placeMatch === 'possible_landmark'
      ? '\n\nMình tìm được địa điểm cùng tên trong dữ liệu VietGo để bạn đối chiếu; điều này chưa xác nhận ảnh được chụp tại đó.'
      : recommendations.placeMatch === 'similar_places'
        ? '\n\nCác địa điểm bên dưới có đặc điểm tương tự ảnh, không khẳng định đây là nơi chụp.'
        : analysis.category === 'food' && recommendations.richData.foods.length
          ? '\n\nMình tìm được quán có món này trong dữ liệu VietGo.'
          : '';
    return res.json({ ...analysis, text: `${analysis.text}${note}`,
      richData: recommendations.richData, knowledgeSources: recommendations.knowledgeSources });
  } catch (error) { return res.status(502).json({ error: error instanceof Error ? error.message : 'Không thể phân tích ảnh.' }); }
});

app.post('/api/chat-action', async (req, res) => {
  try {
    const { action, messages } = req.body || {};
    if (!['open_map', 'open_planner', 'open_food'].includes(action) || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Yêu cầu thao tác chat không hợp lệ.' });
    }
    const context = await resolveChatAction(messages.filter((m: any) => m && typeof m.text === 'string'), ai, action);
    if (!context) return res.status(422).json({ error: 'Chưa xác định được điểm đến có dữ liệu bản đồ/lịch trình. Hãy ghi rõ điểm đến trong cuộc chat rồi thử lại.' });
    return res.json(context);
  } catch (error) { return res.status(422).json({ error: error instanceof Error ? error.message : 'Không thể thực hiện thao tác từ cuộc chat. Hãy thử lại.' }); }
});

app.post('/api/plan-trip', async (req, res) => {
  try {
    const result = await createVerifiedPlan(req.body, ai);
    if ('error' in result) return res.status(result.status).json({ error: result.error });
    return res.json(result.plan);
  } catch (error: any) {
    console.error('Plan trip error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi lập lịch trình' });
  }
});

app.post('/api/modify-itinerary', (_req, res) => {
  return res.status(410).json({ error: 'Hãy chỉnh sửa địa điểm trong trang Lịch trình để dùng các ID đã lưu.' });
});

// 5. Reservation Mock Engine (Table reservation & Festival Tickets)
app.post('/api/reserve', (req, res) => {
  const { type, itemName, date, time, guestCount, customerName, phone, note } = req.body;
  const bookingCode = `VG-${Math.floor(100000 + Math.random() * 900000)}`;

  res.json({
    success: true,
    bookingCode,
    type: type || 'table',
    itemName,
    date,
    time,
    guestCount: guestCount || 2,
    customerName,
    phone,
    status: 'Đã xác nhận thành công (Confirmed)',
    voucherNote: 'Xuất trình mã đặt chỗ này tại quầy để được ưu tiên vị trí đẹp và tặng kèm món tráng miệng theo chương trình Đối tác Bản địa VietGo AI.',
    timestamp: new Date().toISOString()
  });
});

// 6. Google Sign-In — frontend lấy Client ID từ đây, gửi ID token lên để server xác thực
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];
const ADMIN_GOOGLE_SUB = process.env.ADMIN_GOOGLE_SUB || '';
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || '';
const ADMIN_COOKIE = 'vietgo_admin_session';
const USER_COOKIE = 'vietgo_google_session';
const ADMIN_SESSION_MS = 8 * 60 * 60 * 1000;
const adminConfigured = Boolean(GOOGLE_CLIENT_ID && ADMIN_GOOGLE_SUB && ADMIN_SESSION_SECRET.length >= 32);

function googleSession(req: express.Request): string | null {
  if (ADMIN_SESSION_SECRET.length < 32) return null;
  const cookie = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith(`${USER_COOKIE}=`));
  const token = cookie?.slice(USER_COOKIE.length + 1);
  if (!token) return null;
  const [subject, expiry, signature] = token.split('.');
  if (!subject || !/^\d+$/.test(expiry || '') || Number(expiry) < Date.now() || !/^[a-f0-9]{64}$/.test(signature || '')) return null;
  const expected = createHmac('sha256', ADMIN_SESSION_SECRET).update(`user.${subject}.${expiry}`).digest('hex');
  const received = Buffer.from(signature, 'hex');
  return received.length === Buffer.byteLength(expected, 'hex') && timingSafeEqual(received, Buffer.from(expected, 'hex')) ? subject : null;
}

function adminSession(req: express.Request): boolean {
  if (!adminConfigured) return false;
  const cookie = req.headers.cookie?.split(';').map(value => value.trim()).find(value => value.startsWith(`${ADMIN_COOKIE}=`));
  const token = cookie?.slice(ADMIN_COOKIE.length + 1);
  if (!token) return false;
  const [subject, expiry, signature] = token.split('.');
  if (subject !== ADMIN_GOOGLE_SUB || !/^\d+$/.test(expiry || '') || Number(expiry) < Date.now() || !/^[a-f0-9]{64}$/.test(signature || '')) return false;
  const expected = createHmac('sha256', ADMIN_SESSION_SECRET).update(`${subject}.${expiry}`).digest('hex');
  const received = Buffer.from(signature, 'hex');
  return received.length === Buffer.byteLength(expected, 'hex') && timingSafeEqual(received, Buffer.from(expected, 'hex'));
}

function setAdminCookie(req: express.Request, res: express.Response, sub: string) {
  const expiry = String(Date.now() + ADMIN_SESSION_MS);
  const signature = createHmac('sha256', ADMIN_SESSION_SECRET).update(`${sub}.${expiry}`).digest('hex');
  res.cookie(ADMIN_COOKIE, `${sub}.${expiry}.${signature}`, {
    httpOnly: true, sameSite: 'strict', secure: req.secure || req.get('x-forwarded-proto') === 'https',
    path: '/', maxAge: ADMIN_SESSION_MS,
  });
}

function setGoogleCookie(req: express.Request, res: express.Response, sub: string) {
  if (ADMIN_SESSION_SECRET.length < 32) return;
  const expiry = String(Date.now() + ADMIN_SESSION_MS);
  const signature = createHmac('sha256', ADMIN_SESSION_SECRET).update(`user.${sub}.${expiry}`).digest('hex');
  res.cookie(USER_COOKIE, `${sub}.${expiry}.${signature}`, {
    httpOnly: true, sameSite: 'strict', secure: req.secure || req.get('x-forwarded-proto') === 'https',
    path: '/', maxAge: ADMIN_SESSION_MS,
  });
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!adminSession(req)) return res.status(403).json({ error: 'Chỉ tài khoản quản trị được phép thực hiện thao tác này.' });
  const origin = req.get('origin');
  try {
    if (origin && new URL(origin).host !== req.get('host')) return res.status(403).json({ error: 'Nguồn yêu cầu không hợp lệ.' });
  } catch {
    return res.status(403).json({ error: 'Nguồn yêu cầu không hợp lệ.' });
  }
  next();
}

app.get('/api/auth/google/config', (req, res) => {
  res.json({ clientId: GOOGLE_CLIENT_ID });
});

app.post('/api/auth/google', async (req, res) => {
  const { credential } = req.body ?? {};
  if (!GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: 'Máy chủ chưa cấu hình GOOGLE_CLIENT_ID.' });
  }
  if (typeof credential !== 'string' || credential.split('.').length !== 3) {
    return res.status(400).json({ error: 'Thiếu hoặc sai định dạng thông tin đăng nhập Google.' });
  }

  try {
    // tokeninfo kiểm tra chữ ký & hạn của ID token phía Google
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!response.ok) {
      return res.status(401).json({ error: 'Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn.' });
    }
    const info = await response.json();

    if (info.aud !== GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: 'Token Google không được cấp cho ứng dụng này.' });
    }
    if (!GOOGLE_ISSUERS.includes(info.iss)) {
      return res.status(401).json({ error: 'Nguồn phát hành token không hợp lệ.' });
    }
    if (Number(info.exp) * 1000 < Date.now()) {
      return res.status(401).json({ error: 'Phiên đăng nhập Google đã hết hạn. Vui lòng thử lại.' });
    }
    if (info.email_verified !== 'true' && info.email_verified !== true) {
      return res.status(403).json({ error: 'Email của tài khoản Google này chưa được xác minh.' });
    }

    const isAdmin = adminConfigured && info.sub === ADMIN_GOOGLE_SUB;
    setGoogleCookie(req, res, info.sub);
    if (isAdmin) setAdminCookie(req, res, info.sub);
    else res.clearCookie(ADMIN_COOKIE, { path: '/' });
    res.json({
      sub: info.sub,
      email: String(info.email).toLowerCase(),
      name: info.name || info.email.split('@')[0],
      picture: info.picture || null,
      isAdmin,
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(502).json({ error: 'Không kết nối được tới Google. Vui lòng thử lại.' });
  }
});

app.get('/api/admin/session', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json({ authenticated: Boolean(googleSession(req) || adminSession(req)), isAdmin: adminSession(req), configured: adminConfigured });
});

app.get('/api/admin/identity', (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const sub = googleSession(req);
  if (!sub) return res.status(401).json({ error: 'Hãy đăng nhập bằng Google trên website trước.' });
  res.json({ sub });
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie(ADMIN_COOKIE, { path: '/' });
  res.clearCookie(USER_COOKIE, { path: '/' });
  res.json({ ok: true });
});

app.get('/api/places/cities', (_req, res) => {
  res.json(Object.entries(CITY_NAMES).map(([id, name]) => ({ id, name })));
});

app.get('/api/places/:cityId', (req, res) => {
  const data = getCityPlaces(req.params.cityId);
  if (!data) return res.status(404).json({ error: 'Khu vực không tồn tại.' });
  res.setHeader('Cache-Control', 'no-store');
  res.json(data);
});

app.get('/api/place-images/:imageId', (req, res) => {
  const image = getImage(req.params.imageId);
  if (!image) return res.status(404).end();
  res.setHeader('Content-Type', image.mime);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.send(image.bytes);
});

app.get('/api/admin/place-records', requireAdmin, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(listAdminPlaces(req.query));
});
app.get('/api/admin/place-records/audit', requireAdmin, (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(listAudit(req.query));
});
app.get('/api/admin/place-records/duplicates', requireAdmin, (req, res) => {
  const cityId = String(req.query.cityId || '');
  if (!Object.hasOwn(CITY_NAMES, cityId)) return res.status(422).json({ error: 'Khu vực không hợp lệ.' });
  const lat = req.query.lat === '' ? null : Number(req.query.lat);
  const lng = req.query.lng === '' ? null : Number(req.query.lng);
  res.json({ items: findDuplicates(cityId, { name: req.query.name, address: req.query.address,
    coordinates: lat == null || lng == null ? null : { lat, lng } }, String(req.query.excludeId || '')) });
});
app.get('/api/admin/place-records/:cityId/:placeId', requireAdmin, (req, res) => {
  const place = getAdminPlace(req.params.cityId, req.params.placeId);
  if (!place) return res.status(404).json({ error: 'Không tìm thấy địa điểm.' });
  res.setHeader('Cache-Control', 'no-store');
  res.json(place);
});
app.post('/api/admin/place-records', requireAdmin, (req, res) => {
  const result = saveManagedPlace(req.body ?? {}, ADMIN_GOOGLE_SUB);
  if (result.error) return res.status(result.status || 500).json({ error: result.error });
  res.status(201).json(result);
});
app.put('/api/admin/place-records/:cityId/:placeId', requireAdmin, (req, res) => {
  const result = saveManagedPlace(req.body ?? {}, ADMIN_GOOGLE_SUB, req.params.cityId, req.params.placeId);
  if (result.error) return res.status(result.status || 500).json({ error: result.error });
  res.json(result);
});
app.delete('/api/admin/place-records/:cityId/:placeId', requireAdmin, (req, res) => {
  const result = setDeleted(req.params.cityId, req.params.placeId, Number(req.body?.version), true, ADMIN_GOOGLE_SUB);
  if (result.error) return res.status(result.status || 500).json({ error: result.error });
  res.json(result);
});
app.post('/api/admin/place-records/:cityId/:placeId/restore', requireAdmin, (req, res) => {
  const result = setDeleted(req.params.cityId, req.params.placeId, Number(req.body?.version), false, ADMIN_GOOGLE_SUB);
  if (result.error) return res.status(result.status || 500).json({ error: result.error });
  res.json(result);
});
app.post('/api/admin/place-images', requireAdmin, express.raw({ type: ['image/jpeg', 'image/png', 'image/webp'], limit: '5mb' }), (req, res) => {
  if (!Buffer.isBuffer(req.body)) return res.status(415).json({ error: 'Chỉ nhận ảnh JPEG, PNG hoặc WebP.' });
  const result = saveImage(req.body, req.get('content-type') || '', ADMIN_GOOGLE_SUB);
  if (result.error) return res.status(422).json({ error: result.error });
  res.status(201).json(result);
});
app.get('/api/admin/place-images/:imageId', requireAdmin, (req, res) => {
  const image = getImage(req.params.imageId, true);
  if (!image) return res.status(404).end();
  res.setHeader('Content-Type', image.mime);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.send(image.bytes);
});

app.post('/api/admin/places/:cityId', requireAdmin, (req, res) => {
  const result = savePlace(req.params.cityId, req.body ?? {}, undefined, ADMIN_GOOGLE_SUB);
  if (result.error) return res.status(result.status ?? 500).json({ error: result.error });
  res.status(201).json(result.place);
});

app.put('/api/admin/places/:cityId/:placeId', requireAdmin, (req, res) => {
  const result = savePlace(req.params.cityId, req.body ?? {}, req.params.placeId, ADMIN_GOOGLE_SUB);
  if (result.error) return res.status(result.status ?? 500).json({ error: result.error });
  res.json(result.place);
});

// Vite Middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: path.resolve(process.cwd(), 'frontend'),
      server: { middlewareMode: true, allowedHosts: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VietGo AI Server running at http://localhost:${PORT}`);
  });
}

startServer();
