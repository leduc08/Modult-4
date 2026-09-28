import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { answerWithVerifiedPlaces } from './verifiedChat.ts';
import { createVerifiedPlan } from './verifiedPlanRoute.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Initialize Google GenAI client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: !!apiKey });
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

    if (!ai) {
      return res.status(503).json({
        error: 'Tính năng đọc hóa đơn bằng AI chưa được bật (thiếu GEMINI_API_KEY). Vui lòng nhập số tiền thủ công.',
        code: 'AI_UNAVAILABLE'
      });
    }

    let parsed: any;
    try {
      const response = await ai.models.generateContent({
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
    const response = await answerWithVerifiedPlaces(message, req.body?.conversationHistory || [], ai);
    return res.json(response);
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({ error: error.message || 'Lỗi xử lý AI Chatbot' });
  }
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

    res.json({
      sub: info.sub,
      email: String(info.email).toLowerCase(),
      name: info.name || info.email.split('@')[0],
      picture: info.picture || null
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(502).json({ error: 'Không kết nối được tới Google. Vui lòng thử lại.' });
  }
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
