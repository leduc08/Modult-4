import fs from 'fs/promises';
import path from 'path';
import type { GoogleGenAI } from '@google/genai';

const CITIES: Record<string, string> = {
  'ha-noi': 'Hà Nội', 'da-nang': 'Đà Nẵng', 'hoi-an': 'Hội An', hue: 'Huế',
  'ninh-binh': 'Ninh Bình', 'da-lat': 'Đà Lạt', 'sa-pa': 'Sa Pa', 'phu-quoc': 'Phú Quốc',
  'nha-trang': 'Nha Trang', 'tp-hcm': 'TP. Hồ Chí Minh',
};

type ChatPlace = { id: string; name: string; address: string; categoryGroup: string; dataSource: string; openingHours: string | null; needsReview: boolean; coordinates: { lat: number; lng: number } };

export async function answerWithVerifiedPlaces(message: string, history: Array<{ text?: string }> = [], ai: GoogleGenAI | null) {
  const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  const aliases: Record<string, string[]> = { 'tp-hcm': ['sài gòn', 'hồ chí minh', 'tp.hcm'], 'sa-pa': ['sapa', 'sa pa'] };
  const detectCity = (value: string) => Object.keys(CITIES).find(id => [CITIES[id], ...(aliases[id] || [])].some(name => normalize(value).includes(normalize(name))));
  const cityId = detectCity(message) || history.slice(-4).reverse().map(entry => detectCity(entry.text || '')).find(Boolean);
  if (!cityId) return { text: `Bạn muốn tìm hiểu khu vực nào? VietGo hiện có dữ liệu địa điểm cho ${Object.values(CITIES).join(', ')}.`, richData: { pois: [], foods: [], tips: [] }, suggestedActions: [{ label: '📅 Tạo lịch trình', action: 'open_planner' }] };
  let data: { fetchedAt: string; places: ChatPlace[] };
  try { data = JSON.parse(await fs.readFile(path.join(process.cwd(), 'frontend', 'src', 'data', 'places', `${cityId}.json`), 'utf8')); }
  catch { return { text: `Chưa tải được dữ liệu ${CITIES[cityId]}. Hãy chọn một khu vực khác.`, richData: { pois: [], foods: [], tips: [] } }; }
  const wantsFood = /ăn|món|quán|ẩm thực|cà phê|cafe|coffee|food/i.test(message);
  const categorySet = wantsFood ? new Set(['food', 'cafe']) : new Set(['sightseeing', 'culture']);
  const places = data.places.filter(p => categorySet.has(p.categoryGroup) && !p.needsReview && p.name?.trim() && p.address?.trim() && Number.isFinite(p.coordinates?.lat) && Number.isFinite(p.coordinates?.lng) && !/^\d+\s|^(unnamed|restaurant|cafe|coffee)$/i.test(p.name.trim()))
    .sort((a, b) => Number(b.dataSource !== 'osm') - Number(a.dataSource !== 'osm') || a.name.localeCompare(b.name, 'vi'));
  if (!places.length) return { text: `Chưa đủ dữ liệu địa điểm phù hợp ở ${CITIES[cityId]}. Hãy thử khu vực khác.`, richData: { pois: [], foods: [], tips: [] } };
  const candidates = places.slice(0, 35);
  let ids: string[] = [];
  if (ai) {
    try {
      const response = await ai.models.generateContent({ model: 'gemini-3.7-flash',
        contents: `Câu hỏi: ${message}. Chỉ chọn tối đa 3 ID phù hợp từ danh sách JSON này. Trả về duy nhất {"placeIds":["id"]}. Không viết tên hoặc tự tạo địa điểm. ${JSON.stringify(candidates.map(p => ({ id: p.id, name: p.name, category: p.categoryGroup })))}`,
        config: { responseMimeType: 'application/json' } });
      const parsed = JSON.parse(response.text || '{}');
      const valid = new Set(candidates.map(p => p.id));
      if (Array.isArray(parsed.placeIds) && parsed.placeIds.every((id: unknown) => typeof id === 'string' && valid.has(id))) ids = [...new Set<string>(parsed.placeIds as string[])].slice(0, 3);
    } catch { /* Fall back to stored candidate IDs. */ }
  }
  if (!ids.length) ids = candidates.slice(0, 3).map(p => p.id);
  const byId = new Map(candidates.map(p => [p.id, p]));
  const lines = ids.map(id => byId.get(id)!).filter(Boolean).map(p => `• ${p.name} — ${p.address} (ID: ${p.id}; nguồn: ${p.dataSource}; giờ mở cửa: ${p.openingHours || 'chưa có'})`);
  return { text: `Địa điểm có trong dữ liệu VietGo tại ${CITIES[cityId]} (cập nhật ${new Date(data.fetchedAt).toLocaleDateString('vi-VN')}):\n${lines.join('\n')}\nGiá chưa có trong nguồn dữ liệu; hãy kiểm tra trước chuyến đi.`, richData: { pois: [], foods: [], tips: [] }, suggestedActions: [{ label: '📅 Tạo lịch trình', action: 'open_planner' }] };
}
