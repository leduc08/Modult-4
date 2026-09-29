import fs from 'node:fs/promises';
import path from 'node:path';
import { PROVINCES } from '../database/vietnamData.ts';
import { AI_SUPPORTED_CITIES, resolveAIPlannerCity } from './plannerDestination.ts';
import { normalizeTripText } from './tripState.ts';
import { getChatKnowledge, type ChatKnowledge } from './supabaseKnowledge.ts';
import type { ChatTool } from './deepseekClient.ts';

export interface VerifiedChatPlace {
  id: string; name: string; address: string; categoryGroup: string;
  cityId: string; cityName: string; openingHours?: string | null;
}

function argumentsObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid arguments');
  return value as Record<string, unknown>;
}
function shortText(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 240) throw new Error('Invalid text');
  return value.trim();
}

/** Tools have no write/SQL/URL capability. Credentials stay inside the retrieval service. */
export function createTravelTools(lookupKnowledge: (query: string) => Promise<ChatKnowledge> = getChatKnowledge) {
  const verifiedPlaces = new Map<string, VerifiedChatPlace>();
  const sources = new Map<string, ChatKnowledge['sources'][number]>();
  const tools: ChatTool[] = [
    {
      name: 'search_tourism_knowledge',
      description: 'Tra cứu tri thức du lịch: ưu tiên Supabase VietGo/Kaggle, nguồn dự phòng theo cấu hình. Dùng cho văn hóa, món ăn, mùa, mẹo, điểm đến ngoài danh mục planner. Query phải tự đủ nghĩa, gồm điểm đến từ ngữ cảnh nếu có. Chỉ đọc, không SQL/URL hay ghi dữ liệu.',
      parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'], additionalProperties: false },
      execute: async input => {
        const args = argumentsObject(input);
        const result = await lookupKnowledge(shortText(args.query));
        for (const source of result.sources.slice(0, 6)) sources.set(source.id, source);
        return { sourceKind: result.sourceKind, context: result.context.slice(0, 5000), sources: result.sources.slice(0, 6) };
      },
    },
    {
      name: 'search_place_catalog',
      description: `Tìm địa điểm đã xác minh để gợi ý tham quan/quán ăn và hiện nút bản đồ. Các thành phố: ${Object.values(AI_SUPPORTED_CITIES).join(', ')}. Chọn city từ ngữ cảnh hoặc hỏi khách khi chưa rõ; category food cho ăn uống, sightseeing cho tham quan, all cho cả hai. Không phải đặt chỗ hoặc dự báo thời tiết.`,
      parameters: { type: 'object', properties: { city: { type: 'string' }, query: { type: 'string' }, category: { type: 'string', enum: ['food','sightseeing','all'] } }, required: ['city','query','category'], additionalProperties: false },
      execute: async input => {
        const args = argumentsObject(input);
        const cityName = shortText(args.city);
        const query = shortText(args.query);
        if (!['food','sightseeing','all'].includes(String(args.category))) throw new Error('Invalid category');
        const cityId = resolveAIPlannerCity('', cityName, AI_SUPPORTED_CITIES);
        if (!cityId) return { places: [], note: 'Chưa có catalog bản đồ cho thành phố này. Có thể tra cứu tri thức khác; không gán ID/tọa độ.' };
        let data: { places: Array<VerifiedChatPlace & { needsReview?: boolean; coordinates?: {lat:number;lng:number}; dataSource?: string }> };
        try { data = JSON.parse(await fs.readFile(path.join(process.cwd(),'frontend','src','data','places',`${cityId}.json`),'utf8')); }
        catch { return { places: [], note: 'Catalog cục bộ chưa tải được. Hãy dùng nguồn khác hoặc nói rõ chưa xác minh.' }; }
        const terms = normalizeTripText(query).split(/[^a-z0-9]+/).filter(term => term.length >= 3);
        const score = (item: typeof data.places[number]) => terms.filter(term => normalizeTripText(`${item.name} ${item.address}`).includes(term)).length;
        const places = data.places.filter(item => !item.needsReview && item.name?.trim() && item.address?.trim()
          && Number.isFinite(item.coordinates?.lat) && Number.isFinite(item.coordinates?.lng)
          && (args.category === 'all' || (args.category === 'food' ? ['food','cafe'].includes(item.categoryGroup) : ['sightseeing','culture'].includes(item.categoryGroup)))
          && !/^\d+\s|^(unnamed|restaurant|cafe|coffee)$/i.test(item.name.trim()))
          .sort((a,b) => score(b)-score(a) || Number(b.dataSource !== 'osm')-Number(a.dataSource !== 'osm') || a.name.localeCompare(b.name,'vi'))
          .slice(0, 12).map(item => ({ id:item.id,name:item.name.slice(0,140),address:item.address.slice(0,200),categoryGroup:item.categoryGroup,
            cityId,cityName:AI_SUPPORTED_CITIES[cityId],openingHours:item.openingHours?.slice(0,100) || null }));
        for (const item of places) verifiedPlaces.set(item.id,item);
        return { places, note: 'Giá/giờ mở cửa thiếu không được tự suy đoán. ID chỉ dùng cho thao tác, không in vào answer.' };
      },
    },
    {
      name: 'get_seasonal_destinations',
      description: 'Đọc mùa đẹp và khí hậu tham khảo của các tỉnh trong database để so sánh/gợi ý đi đâu theo mùa hoặc tháng. Không cần thành phố trước, không phải thời tiết hiện tại hay cảnh báo mưa bão.',
      parameters: { type: 'object', properties: {}, additionalProperties: false },
      execute: async input => {
        argumentsObject(input);
        return { destinations: PROVINCES.map(province => ({ name:province.name,bestMonths:province.bestMonths,climate:province.weatherSummary })),
          note: 'Thông tin mùa/khí hậu tham khảo, không phải dự báo thực tế. Dùng tháng hiện tại được gửi trong ngữ cảnh, chỉ gợi ý điểm phù hợp dữ liệu, hỏi sở thích nếu cần.' };
      },
    },
  ];
  return { tools, verifiedPlaces, sources };
}
