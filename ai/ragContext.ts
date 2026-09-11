import { PROVINCES, ALL_TIPS } from '../database/vietnamData';
import type { Province } from '../database/types';

/**
 * Xây dựng RAG context từ kho tri thức du lịch Việt Nam.
 * Dùng để grounding prompt gửi cho Gemini AI.
 */
export function buildRAGContext(query: string, provinceName?: string): string {
  let context = `BỐI CẢNH TRI THỨC DU LỊCH VIỆT NAM (VIETGO AI KNOWLEDGE BASE):\n`;

  // Search relevant provinces
  const targetProvinces = provinceName
    ? PROVINCES.filter((p: Province) => p.name.toLowerCase().includes(provinceName.toLowerCase()))
    : PROVINCES.slice(0, 7);

  targetProvinces.forEach((p: Province) => {
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
