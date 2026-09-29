import { extractTripState } from './tripState.ts';
import type { ChatActionName } from '../database/chatActionTypes.ts';

interface Message {
  sender: string; text: string; id?: string; actionsUnavailable?: boolean;
  suggestedActions?: unknown; verifiedActions?: string[];
  richData?: { tripPreview?: unknown };
}
const labels: Record<ChatActionName, string> = {
  open_map: '🗺️ Mở trên Bản đồ số', open_planner: '📅 Tạo lịch trình chi tiết', open_food: '🍲 Xem quán ăn bản địa',
};

// DeepSeek proposes intent. This function only validates supported capabilities
// and customer-supplied parameters; it never invents a proposal from keywords.
export function getSuggestedChatActions(previous: Message[], reply: Message): Array<{ action: ChatActionName; label: string }> {
  if (reply.sender !== 'ai' || reply.actionsUnavailable || reply.richData?.tripPreview
    || /^(welcome-|ai-err-|ai-image-|trip-preview-)/.test(reply.id || '')
    || !Array.isArray(reply.suggestedActions)) return [];
  const trip = extractTripState(previous.filter(m => m.sender === 'user'));
  const seen = new Set<ChatActionName>();
  for (const proposal of reply.suggestedActions) {
    const action = typeof proposal === 'string' ? proposal : proposal?.action;
    if (action !== 'open_map' && action !== 'open_planner' && action !== 'open_food') continue;
    if (action === 'open_planner' ? !trip.complete : !reply.verifiedActions?.includes(action)) continue;
    if (trip.destination && !trip.cityId) continue;
    seen.add(action);
  }
  return [...seen].map(action => ({ action, label: labels[action] }));
}
