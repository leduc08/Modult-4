import fs from 'fs/promises';
import path from 'path';
import type { GoogleGenAI } from '@google/genai';

const cities: Record<string, string> = { 'ha-noi': 'Hà Nội', 'da-nang': 'Đà Nẵng', 'hoi-an': 'Hội An', hue: 'Huế', 'ninh-binh': 'Ninh Bình', 'da-lat': 'Đà Lạt', 'sa-pa': 'Sa Pa', 'phu-quoc': 'Phú Quốc', 'nha-trang': 'Nha Trang', 'tp-hcm': 'TP. Hồ Chí Minh' };
type Place = { id: string; name: string; address: string; coordinates: { lat: number; lng: number }; categoryGroup: string; categoryLabel: string; dataSource: string; openingHours: string | null; needsReview: boolean; imageUrl: string | null; isPlaceholderImage: boolean };

export async function createVerifiedPlan(body: any, ai: GoogleGenAI | null) {
  const cityId = cities[body.destination] ? body.destination : Object.keys(cities).find(id => cities[id].toLocaleLowerCase('vi') === String(body.destination || '').toLocaleLowerCase('vi'));
  if (!cityId) return { error: 'Khu vực chưa được hỗ trợ. Hãy chọn một thành phố có dữ liệu.', status: 422 };
  const days = Math.max(1, Math.min(7, Math.trunc(Number(body.days) || 3)));
  const guests = Math.max(1, Math.trunc(Number(body.peopleCount) || 2));
  let data: { fetchedAt: string; places: Place[] };
  try { data = JSON.parse(await fs.readFile(path.join(process.cwd(), 'frontend', 'src', 'data', 'places', `${cityId}.json`), 'utf8')); }
  catch { return { error: 'Chưa có dữ liệu địa điểm cho khu vực này.', status: 422 }; }
  const useful = data.places.filter(p => !p.needsReview && p.name?.trim() && p.address?.trim() && Number.isFinite(p.coordinates?.lat) && Number.isFinite(p.coordinates?.lng) && !/^\d+\s|^(unnamed|không tên|restaurant|cafe|coffee)$/i.test(p.name.trim()));
  const sights = useful.filter(p => ['sightseeing', 'culture'].includes(p.categoryGroup));
  const foods = useful.filter(p => ['food', 'cafe'].includes(p.categoryGroup));
  if (sights.length < days || foods.length < days) return { error: `Dữ liệu ${cities[cityId]} chưa đủ cho ${days} ngày. Hãy giảm số ngày hoặc đổi khu vực.`, status: 422 };
  const rank = (a: Place, b: Place) => Number(b.dataSource !== 'osm') - Number(a.dataSource !== 'osm') || Number(Boolean(b.openingHours)) - Number(Boolean(a.openingHours)) || a.name.localeCompare(b.name, 'vi');
  sights.sort(rank); foods.sort(rank);
  const candidateSights = sights.slice(0, Math.max(days * 4, 16));
  const candidateFoods = foods.slice(0, Math.max(days * 4, 16));
  let selectedIds: Array<{ sightId: string; foodId: string }> = [];
  let aiSelected = false;
  if (ai) {
    try {
      const candidates = [...candidateSights, ...candidateFoods].map(p => ({ id: p.id, name: p.name, category: p.categoryGroup }));
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Chọn ${days} cặp địa điểm cho chuyến đi ${cities[cityId]}. Chỉ trả về JSON {"days":[{"sightId":"...","foodId":"..."}]}. Mỗi ID phải lấy chính xác từ danh sách sau, không tự tạo ID hay tên: ${JSON.stringify(candidates)}`,
        config: { responseMimeType: 'application/json' },
      });
      const parsed = JSON.parse(response.text || '{}');
      const rows = Array.isArray(parsed.days) ? parsed.days : [];
      const sightIds = new Set(candidateSights.map(p => p.id));
      const foodIds = new Set(candidateFoods.map(p => p.id));
      if (rows.length === days && rows.every((r: any) => sightIds.has(r.sightId) && foodIds.has(r.foodId)) && new Set(rows.flatMap((r: any) => [r.sightId, r.foodId])).size === days * 2) {
        selectedIds = rows;
        aiSelected = true;
      }
    } catch { /* Use the validated deterministic selection below. */ }
  }
  if (!selectedIds.length) selectedIds = Array.from({ length: days }, (_, index) => ({ sightId: sights[index].id, foodId: foods[index].id }));
  const byId = new Map(useful.map(p => [p.id, p]));
  const dayPlans = selectedIds.map((ids, index) => {
    const selected = [byId.get(ids.sightId)!, byId.get(ids.foodId)!];
    return { dayNumber: index + 1, theme: `Ngày ${index + 1} tại ${cities[cityId]}`, dayCostEstimated: null, items: selected.map((place, stopIndex) => ({
      id: place.id, placeId: place.id, timeSlot: stopIndex === 0 ? 'Buổi sáng' : 'Bữa trưa / chiều',
      title: place.name, activityType: place.categoryLabel, locationName: place.name,
      address: place.address, coordinates: place.coordinates, estimatedCost: null,
      duration: 'Chưa có dữ liệu', notes: place.openingHours ? `Giờ mở cửa tham khảo: ${place.openingHours}` : 'Chưa có giờ mở cửa — cần kiểm tra trước khi đi.',
      source: place.dataSource, fetchedAt: data.fetchedAt, imageUrl: place.isPlaceholderImage ? null : place.imageUrl,
    })) };
  });
  return { status: 200, plan: { id: `trip-${Date.now()}`, title: `Lịch trình ${cities[cityId]} ${days} ngày`, destination: cities[cityId], provinceId: cityId,
    durationDays: days, peopleCount: guests, totalBudget: body.budget == null ? null : Number(body.budget),
    travelStyle: body.style || 'Đa dạng', companion: body.companions || '', days: dayPlans,
    summaryAI: aiSelected ? 'Địa điểm được AI chọn bằng ID từ dữ liệu VietGo.' : 'Địa điểm được chọn từ dữ liệu VietGo.',
    safetyAlerts: ['Kiểm tra giờ mở cửa, giá và thời gian di chuyển trước khi đi.'], createdAt: new Date().toISOString(), sourceUpdatedAt: data.fetchedAt } };
}
