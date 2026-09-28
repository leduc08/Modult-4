import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { PROVINCES, ALL_TIPS, searchAllPOIs, searchAllFoods } from '../database/vietnamData.ts';
import { buildRAGContext } from '../ai/ragContext.ts';
import { getChatSystemInstruction, getTripPlannerPrompt, getModifyItineraryPrompt } from '../ai/systemPrompt.ts';

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

// 2. Chatbot with RAG & Agentic Tooling
app.post('/api/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [], language = 'vi', provinceId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Match relevant POIs and foods for rich UI cards
    const matchedPois = searchAllPOIs(message).slice(0, 3);
    const matchedFoods = searchAllFoods(message).slice(0, 3);
    const matchedTips = ALL_TIPS.filter(t => 
      message.toLowerCase().includes(t.title.toLowerCase()) ||
      t.tags.some(tag => message.toLowerCase().includes(tag))
    ).slice(0, 2);

    let aiResponseText = '';

    if (ai) {
      const ragContext = buildRAGContext(message);
      const systemInstruction = getChatSystemInstruction(language);

      const contents = [
        ...conversationHistory.map((m: any) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        })),
        {
          role: 'user',
          parts: [{ text: `${ragContext}\n\nCâu hỏi của người dùng: ${message}` }]
        }
      ];

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: contents as any,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      aiResponseText = response.text || 'Xin chào! VietGo AI luôn sẵn sàng đồng hành cùng bạn khám phá vẻ đẹp Việt Nam.';
    } else {
      // Fallback RAG response if API key is not configured
      aiResponseText = `Chào bạn! Dưới đây là thông tin tư vấn từ Cơ sở dữ liệu VietGo AI:\n\n` +
        `• Nếu bạn cần tìm kiếm địa điểm du lịch, ẩm thực chuẩn vị hay lập lịch trình tiết kiệm, VietGo AI đã tích hợp sẵn kho tri thức bách khoa 34+ tỉnh thành.\n` +
        `• Tham khảo ngay các thẻ địa điểm và món ăn gợi ý bên dưới để xem tọa độ bản đồ chi tiết!`;
    }

    res.json({
      text: aiResponseText,
      richData: {
        pois: matchedPois,
        foods: matchedFoods,
        tips: matchedTips
      },
      suggestedActions: [
        { label: '🗺️ Mở trên Bản đồ số', action: 'open_map' },
        { label: '📅 Tạo lịch trình chi tiết', action: 'open_planner' },
        { label: '🍲 Xem quán ăn bản địa', action: 'open_food' }
      ]
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Lỗi xử lý AI Chatbot' });
  }
});

// 3. AI Trip & Budget Planner Engine
app.post('/api/plan-trip', async (req, res) => {
  try {
    const { destination, days = 3, budget = 5000000, companions = 'Cặp đôi (Couple)', style = 'Foodie & Ẩm thực', peopleCount = 2 } = req.body;

    const totalBudget = Number(budget) || 5000000;
    const count = Number(peopleCount) || 2;
    const numDays = Math.min(Math.max(Number(days) || 3, 1), 7);

    // Calculate Golden Ratio Budget Breakdown
    const stayBudget = Math.round(totalBudget * 0.30);
    const foodBudget = Math.round(totalBudget * 0.25);
    const transportBudget = Math.round(totalBudget * 0.20);
    const ticketsBudget = Math.round(totalBudget * 0.15);
    const contingencyBudget = Math.round(totalBudget * 0.10);

    const province = PROVINCES.find(p => 
      p.name.toLowerCase().includes((destination || '').toLowerCase()) ||
      (destination || '').toLowerCase().includes(p.name.toLowerCase())
    ) || PROVINCES[1]; // Default Da Nang

    let generatedDays: any[] = [];
    let summaryAI = '';

    if (ai) {
      const prompt = getTripPlannerPrompt({
        numDays,
        provinceName: province.name,
        totalBudget,
        count,
        companions,
        style,
        poisInfo: province.pois.map(p => `${p.name} (Giá vé: ${p.ticketPrice}đ)`).join(', '),
        foodsInfo: province.foods.map(f => `${f.dishName} tại ${f.name} (Giá: ${f.priceRange})`).join(', '),
      });

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summaryAI: { type: Type.STRING },
                safetyAlerts: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING } 
                },
                days: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dayNumber: { type: Type.INTEGER },
                      theme: { type: Type.STRING },
                      dayCostEstimated: { type: Type.NUMBER },
                      items: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            timeSlot: { type: Type.STRING },
                            title: { type: Type.STRING },
                            activityType: { type: Type.STRING },
                            locationName: { type: Type.STRING },
                            address: { type: Type.STRING },
                            estimatedCost: { type: Type.NUMBER },
                            duration: { type: Type.STRING },
                            notes: { type: Type.STRING },
                            insiderTip: { type: Type.STRING }
                          },
                          required: ['timeSlot', 'title', 'locationName', 'estimatedCost', 'notes']
                        }
                      }
                    },
                    required: ['dayNumber', 'theme', 'items', 'dayCostEstimated']
                  }
                }
              },
              required: ['summaryAI', 'safetyAlerts', 'days']
            }
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        generatedDays = parsed.days || [];
        summaryAI = parsed.summaryAI || `Lịch trình khám phá ${province.name} được tối ưu hóa cho ${companions} theo phong cách ${style}.`;
      } catch (err) {
        console.error('Gemini JSON schema failed, using deterministic template:', err);
      }
    }

    // Fallback template if AI call was unavailable or had parse issue
    if (!generatedDays || generatedDays.length === 0) {
      summaryAI = `Lịch trình ${numDays} ngày ${numDays - 1} đêm tại ${province.name} được tối ưu hóa chuẩn xác theo ngân sách ${totalBudget.toLocaleString()}đ và phong cách ${style}.`;
      for (let d = 1; d <= numDays; d++) {
        const poi1 = province.pois[(d - 1) % province.pois.length];
        const poi2 = province.pois[d % province.pois.length];
        const food1 = province.foods[(d - 1) % province.foods.length];
        const food2 = province.foods[d % province.foods.length];

        generatedDays.push({
          dayNumber: d,
          theme: d === 1 ? `Khởi hành & Khám phá biểu tượng ${province.name}` : d === 2 ? `Trải nghiệm văn hóa & ẩm thực đặc sản` : `Thư giãn, săn ảnh đẹp & mua quà OCOP`,
          dayCostEstimated: Math.round(totalBudget / numDays),
          items: [
            {
              id: `item-${d}-1`,
              timeSlot: 'Sáng (07:30 - 11:30)',
              title: `Ăn sáng & Tham quan ${poi1.name}`,
              activityType: 'tham_quan',
              locationName: poi1.name,
              address: poi1.address,
              estimatedCost: poi1.ticketPrice + 45000,
              duration: '3.5 giờ',
              notes: poi1.description,
              insiderTip: poi1.localTips
            },
            {
              id: `item-${d}-2`,
              timeSlot: 'Trưa (11:30 - 13:30)',
              title: `Thưởng thức ${food1.dishName}`,
              activityType: 'an_uong',
              locationName: food1.name,
              address: food1.address,
              estimatedCost: food1.avgPrice,
              duration: '1.5 giờ',
              notes: food1.description,
              insiderTip: 'Nên đặt bàn trước hoặc đi sớm 15 phút để tránh đông khách vào giờ cao điểm.'
            },
            {
              id: `item-${d}-3`,
              timeSlot: 'Chiều (14:00 - 17:30)',
              title: `Check-in ${poi2.name} & Thưởng thức cà phê`,
              activityType: 'check_in',
              locationName: poi2.name,
              address: poi2.address,
              estimatedCost: poi2.ticketPrice + 40000,
              duration: '3.5 giờ',
              notes: poi2.description,
              insiderTip: poi2.localTips
            },
            {
              id: `item-${d}-4`,
              timeSlot: 'Tối (18:00 - 22:00)',
              title: `Bữa tối ${food2.dishName} & Dạo phố đêm`,
              activityType: 'an_uong',
              locationName: food2.name,
              address: food2.address,
              estimatedCost: food2.avgPrice + 50000,
              duration: '4 giờ',
              notes: `Thưởng thức ẩm thực đêm và dạo quanh các khu phố đi bộ lung linh.`,
              insiderTip: 'Trả giá mua quà lưu niệm khoảng 70% giá báo đầu.'
            }
          ]
        });
      }
    }

    const tripPlan = {
      id: `trip-${Date.now()}`,
      title: `Chuyến du ngoạn ${province.name} ${numDays}N${numDays > 1 ? numDays - 1 : 0}Đ (${style})`,
      destination: province.name,
      provinceId: province.id,
      durationDays: numDays,
      travelStyle: style,
      companion: companions,
      totalBudget: totalBudget,
      budgetPerPerson: Math.round(totalBudget / count),
      peopleCount: count,
      budgetBreakdown: {
        stay: stayBudget,
        food: foodBudget,
        transport: transportBudget,
        tickets: ticketsBudget,
        contingency: contingencyBudget
      },
      days: generatedDays,
      summaryAI: summaryAI,
      safetyAlerts: [
        'Luôn giữ tư trang cẩn thận tại các điểm tham quan đông đúc.',
        'Hỏi rõ giá trước khi sử dụng dịch vụ hoặc gọi món phụ thu.',
        `Hotline cứu hộ du lịch khẩn cấp: 112 (Cứu nạn) | 113 (Công an).`
      ],
      createdAt: new Date().toISOString()
    };

    res.json(tripPlan);
  } catch (error: any) {
    console.error('Plan trip error:', error);
    res.status(500).json({ error: error.message || 'Lỗi lập lịch trình' });
  }
});

// 4. Interactive Live Itinerary Modification ("AI hỏi ngược & chỉnh sửa tức thì")
app.post('/api/modify-itinerary', async (req, res) => {
  try {
    const { currentPlan, modificationRequest } = req.body;

    if (!currentPlan || !modificationRequest) {
      return res.status(400).json({ error: 'Missing currentPlan or modificationRequest' });
    }

    if (ai) {
      const prompt = getModifyItineraryPrompt(modificationRequest, JSON.stringify(currentPlan.days));

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              updatedDays: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayNumber: { type: Type.INTEGER },
                    theme: { type: Type.STRING },
                    dayCostEstimated: { type: Type.NUMBER },
                    items: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          timeSlot: { type: Type.STRING },
                          title: { type: Type.STRING },
                          activityType: { type: Type.STRING },
                          locationName: { type: Type.STRING },
                          address: { type: Type.STRING },
                          estimatedCost: { type: Type.NUMBER },
                          duration: { type: Type.STRING },
                          notes: { type: Type.STRING },
                          insiderTip: { type: Type.STRING }
                        },
                        required: ['timeSlot', 'title', 'locationName', 'estimatedCost', 'notes']
                      }
                    }
                  },
                  required: ['dayNumber', 'theme', 'items', 'dayCostEstimated']
                }
              },
              changeSummary: { type: Type.STRING }
            },
            required: ['updatedDays', 'changeSummary']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.updatedDays && parsed.updatedDays.length > 0) {
        currentPlan.days = parsed.updatedDays;
        currentPlan.summaryAI = `${currentPlan.summaryAI} (Đã cập nhật: ${parsed.changeSummary})`;
      }
    }

    res.json(currentPlan);
  } catch (error: any) {
    console.error('Modify itinerary error:', error);
    res.status(500).json({ error: error.message || 'Lỗi chỉnh sửa lịch trình' });
  }
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
