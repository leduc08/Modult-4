import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { PROVINCES, ALL_TIPS, searchAllPOIs, searchAllFoods } from './src/data/vietnamData.ts';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

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

// Helper: Build RAG context for prompt grounding
function buildRAGContext(query: string, provinceName?: string): string {
  let context = `BỐI CẢNH TRI THỨC DU LỊCH VIỆT NAM (VIETGO AI KNOWLEDGE BASE):\n`;

  // Search relevant provinces
  const targetProvinces = provinceName 
    ? PROVINCES.filter(p => p.name.toLowerCase().includes(provinceName.toLowerCase()))
    : PROVINCES.slice(0, 7);

  targetProvinces.forEach(p => {
    context += `\n--- [TỈNH/THÀNH]: ${p.name} (${p.region}) ---\n`;
    context += `Đặc trưng: ${p.tagline}\n`;
    context += `Mùa đẹp nhất: ${p.bestMonths} | Thời tiết: ${p.weatherSummary}\n`;
    context += `Văn hóa & Kiêng kỵ: ${p.culturalTaboos.join('; ')}\n`;
    context += `Di chuyển: Đến bằng ${p.transportation.arrival.join(', ')}. Thuê xe máy: ${p.transportation.avgBikeRental}\n`;
    context += `Điểm tham quan tiêu biểu:\n`;
    p.pois.forEach(poi => {
      context += ` - ${poi.name} (${poi.category}): Giá vé ${poi.ticketPrice.toLocaleString()}đ, Giờ mở cửa: ${poi.openingHours}. Mẹo: ${poi.localTips}\n`;
    });
    context += `Ẩm thực đặc sản chuẩn vị:\n`;
    p.foods.forEach(f => {
      context += ` - ${f.dishName} (${f.name}): Giá ${f.priceRange} (${f.address}). Đặc trưng: ${f.description}\n`;
    });
  });

  // Include top tips
  context += `\n--- MẸO DU LỊCH & QUY ĐỊNH HÀNG KHÔNG (400+ TIPS) ---\n`;
  ALL_TIPS.forEach(t => {
    context += `* [${t.category.toUpperCase()}] ${t.title}: ${t.content}\n`;
  });

  return context;
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', hasGeminiKey: !!apiKey });
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
      const systemInstruction = `Bạn là VietGo AI — Trợ lý du lịch thông minh số 1 tại Việt Nam.
Nhiệm vụ của bạn là tư vấn du lịch Việt Nam chuẩn xác, thân thiện, am hiểu văn hóa, không chém gió hay bịa đặt (No Hallucination).
Hãy luôn dựa vào TRI THỨC ĐƯỢC CUNG CẤP (RAG Context) để trả lời:
- Luôn nêu rõ tên địa điểm, địa chỉ thật, giá cả tham khảo chính xác bằng VNĐ.
- Đưa ra lời khuyên thực chiến (tips tránh chặt chém, giờ đẹp tránh đông, quy tắc văn hóa).
- Giọng điệu hào hứng, mến khách, hiếu khách đúng tinh thần du lịch Việt Nam.
- Ngôn ngữ phản hồi: ${language === 'vi' ? 'Tiếng Việt' : language === 'en' ? 'English' : language === 'ko' ? '한국어' : language === 'ja' ? '日本語' : '中文'}.
- Định dạng câu trả lời rõ ràng với bullet points, in đậm tên quán/địa điểm, giá tiền.`;

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
      const prompt = `Hãy lập lịch trình du lịch chi tiết ${numDays} ngày tại ${province.name}, Việt Nam.
Thông tin chuyến đi:
- Số ngày: ${numDays} ngày
- Ngân sách tổng: ${totalBudget.toLocaleString()} VNĐ cho ${count} người (${companions})
- Phong cách du lịch: ${style}
- Cơ sở dữ liệu địa điểm gợi ý: ${province.pois.map(p => `${p.name} (Giá vé: ${p.ticketPrice}đ)`).join(', ')}
- Quán ăn gợi ý: ${province.foods.map(f => `${f.dishName} tại ${f.name} (Giá: ${f.priceRange})`).join(', ')}

Yêu cầu output dạng JSON chính xác theo Schema:
Tạo danh sách ${numDays} ngày (Day 1 đến Day ${numDays}), mỗi ngày có 4 mốc thời gian:
1. "Sáng (07:30 - 11:30)"
2. "Trưa (11:30 - 13:30)"
3. "Chiều (14:00 - 17:30)"
4. "Tối (18:00 - 22:00)"
Tối ưu cung đường không bị đi vòng ngược chiều, cân đối chi phí ăn uống và vé vào cửa hợp lý.`;

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
      const prompt = `Bạn là VietGo AI Travel Solver. Người dùng muốn chỉnh sửa lịch trình du lịch hiện tại:
Yêu cầu chỉnh sửa: "${modificationRequest}"
Lịch trình hiện tại: ${JSON.stringify(currentPlan.days)}

Hãy trả về phiên bản days mới đã cập nhật theo đúng yêu cầu (ví dụ: đổi món ăn, thay địa điểm, tăng giảm thời gian nghỉ ngơi) nhưng vẫn giữ cấu trúc JSON tương thích.`;

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

// Vite Middleware & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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
