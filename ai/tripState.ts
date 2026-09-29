import { PROVINCES } from '../database/vietnamData.ts';
import { AI_SUPPORTED_CITIES, resolveAIPlannerCity } from './plannerDestination.ts';
import { extractChatBudget } from './chatBudget.ts';

export const normalizeTripText = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
export const tripIntent = /lich trinh|ke hoach|len lich|muon di|du lich|chuyen di|plan (?:a |my )?trip|itinerary/;
export interface TripState {
  destination?: string; provinceId?: string; cityId?: string;
  days?: number; guests?: number; budget?: number;
  budgetScope?: 'group' | 'person'; budgetRange?: boolean;
  issues: string[]; complete: boolean;
}

/** One source of explicit customer parameters for both buttons and action execution. */
export function extractTripState(messages: Array<{sender: string; text: string}>): TripState {
  const state: TripState = { issues: [], complete: false };
  let rawBudget: number | undefined;
  let adultsCount: number | undefined;
  let childrenCount = 0;
  let infantsCount = 0;
  for (const message of messages.filter(m => m.sender === 'user')) {
    const text = normalizeTripText(message.text).trim();
    const cityId = resolveAIPlannerCity('', text, AI_SUPPORTED_CITIES);
    const province = PROVINCES.find(p => [p.name, ...p.name.split(/[()]/).filter(Boolean)]
      .some(name => ` ${text.replace(/[^a-z0-9]+/g, ' ')} `.includes(` ${normalizeTripText(name.trim())} `)));
    const unknown = text.match(/(?:muon di|du lich|di den|doi sang|chuyen sang|(?:len |lap |tao )?lich trinh(?: cho)?|\bdi)\s+([a-z][a-z ]*?)(?=\s+\d|\s+(?:trong|voi|cho|ngan sach)|[,.!?]|$)/)?.[1]?.trim();
    if (cityId || province) {
      state.destination = province?.name || AI_SUPPORTED_CITIES[cityId!];
      state.provinceId = province?.id || cityId;
      state.cityId = cityId || resolveAIPlannerCity('', state.destination, AI_SUPPORTED_CITIES);
    } else if (unknown && !/^(cung|mot minh|cap doi|solo)|nguoi|khach|gia dinh|may bay|taxi/.test(unknown)) {
      state.destination = message.text.slice(text.indexOf(unknown), text.indexOf(unknown) + unknown.length).trim();
      state.provinceId = undefined; state.cityId = undefined;
    }
    const days = [...text.matchAll(/(-?\d+)\s*(?:ngay|days?)\b/g)].at(-1);
    if (days) state.days = Number(days[1]);
    const adults = text.match(/(\d+)\s*(?:nguoi lon|adults?)\b/);
    const children = text.match(/(\d+)\s*(?:tre em|tre|be|children|kids?)\b/);
    const infants = text.match(/(\d+)\s*(?:em be|so sinh|infants?)\b/);
    if (adults || children || infants) {
      if (adults) adultsCount = Number(adults[1]);
      if (children) childrenCount = Number(children[1]);
      if (infants) infantsCount = Number(infants[1]);
      state.guests = (adultsCount || 0) + childrenCount + infantsCount;
    } else {
      const guests = [...text.matchAll(/(-?\d+)\s*(?:nguoi|khach|people|guests?)\b|cap doi|mot minh|solo/g)].at(-1);
      if (guests) {
        state.guests = guests[1] ? Number(guests[1]) : /cap doi/.test(guests[0]) ? 2 : 1;
        adultsCount = state.guests; childrenCount = 0; infantsCount = 0;
      }
    }
    const budgetLabel = text.match(/ngan sach|chi phi|budget/);
    const moneyOnly = /^\d[\d.,]*\s*(?:trieu|tr|nghin|ngan|k|vnd|vnd|dong|d)[.!\s]*$/.test(text);
    const nonTripPrice = /mon|quan|ve|gia phong|gia tien|hoa don/.test(text);
    if (budgetLabel || moneyOnly || tripIntent.test(text) && !nonTripPrice) {
      const budgetText = budgetLabel ? message.text.slice(budgetLabel.index) : message.text;
      const normalizedBudget = normalizeTripText(budgetText);
      const amount = extractChatBudget([budgetText]);
      const range = /\d[\d.,]*\s*(?:trieu|tr|nghin|ngan|k)?\s*(?:-|den|toi|–)\s*\d[\d.,]*\s*(?:trieu|tr|nghin|ngan|k|vnd|dong|d)\b/.test(normalizedBudget);
      if (amount !== undefined || range) {
        rawBudget = amount; state.budgetRange = range;
        state.budgetScope = /moi (?:nguoi|khach)|mot nguoi|\/\s*nguoi|per person/.test(normalizedBudget) ? 'person' : 'group';
      }
    }
  }
  state.budget = state.budgetScope === 'person' ? (rawBudget && state.guests ? rawBudget * state.guests : undefined) : rawBudget;
  if (state.destination && !state.cityId) state.issues.push(`Chưa có dữ liệu lập lịch trình cho ${state.destination}. Hãy chọn một thành phố có dữ liệu.`);
  if (state.days !== undefined && (state.days < 1 || state.days > 7)) state.issues.push('Lịch trình hiện hỗ trợ từ 1 đến 7 ngày. Bạn muốn chọn bao nhiêu ngày trong giới hạn này?');
  if (state.guests !== undefined && (state.guests < 1 || state.guests > 50)) state.issues.push('Số người phải từ 1 đến 50, gồm người lớn và trẻ em.');
  if (state.budgetRange) state.issues.push('Bạn muốn chốt ngân sách cụ thể bao nhiêu trong khoảng đã nêu?');
  if (state.budget !== undefined && (!Number.isSafeInteger(state.budget) || state.budget <= 0)) state.issues.push('Ngân sách chuyến đi chưa hợp lệ.');
  state.complete = Boolean(state.cityId && state.days && state.guests && state.budget && !state.issues.length);
  return state;
}
