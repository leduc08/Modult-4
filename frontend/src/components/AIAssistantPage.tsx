import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  Sparkles, 
  Compass, 
  Utensils, 
  ShieldAlert, 
  Calendar, 
  ChevronRight, 
  PanelLeftClose, 
  PanelLeft, 
  PlusCircle, 
  Star, 
  MapPin, 
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Plus
} from 'lucide-react';
import { POI, FoodSpot, TravelTip } from '../types';
import { DetailItem } from './ItemDetailModal';

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  richData?: {
    pois?: POI[];
    foods?: FoodSpot[];
    tips?: TravelTip[];
    extractedTrip?: {
      destination: string;
      days: number;
      guests: number;
      style?: string;
    };
  };
  suggestedActions?: {
    label: string;
    action: string;
    payload?: any;
  }[];
}

interface AIAssistantPageProps {
  initialQuery?: string;
  onSelectItem: (item: DetailItem) => void;
  onAddToItinerary: (item: DetailItem) => void;
  onProceedToItinerary: (params: { destination: string; days: number; guests: number; style?: string }) => void;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({
  initialQuery,
  onSelectItem,
  onAddToItinerary,
  onProceedToItinerary,
}) => {
  // Chat sidebar toggle on desktop
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Chat sessions
  const [sessions, setSessions] = useState([
    { id: 'session-1', title: 'Tư vấn du lịch Việt Nam', time: 'Hôm nay' }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('session-1');

  // Messages state
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome-msg',
      sender: 'ai',
      text: `Xin chào! Tôi có thể gợi ý nơi tham quan và ăn uống từ dữ liệu địa điểm VietGo đã lưu. Hãy cho tôi biết thành phố bạn muốn tìm hiểu.`,
      timestamp: 'Bây giờ',
      suggestedActions: [
        { label: '🍲 Quán ăn tại Hà Nội', action: 'ask_hanoi_food' },
        { label: '🏛️ Điểm tham quan tại Huế', action: 'ask_hue_sights' },
        { label: '📅 Tạo lịch trình Đà Nẵng', action: 'plan_danang' }
      ]
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // If initialQuery provided, send it automatically
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSendMessage(initialQuery);
    }
  }, [initialQuery]);

  // Topic prompt chips for quick discovery
  const topicChips = [
    { label: '🏛️ Văn hóa & Danh thắng', prompt: 'Gợi ý địa điểm văn hóa trong dữ liệu VietGo tại Huế' },
    { label: '🍲 Ăn uống', prompt: 'Gợi ý quán ăn trong dữ liệu VietGo tại Đà Nẵng' },
    { label: '🌿 Tham quan', prompt: 'Gợi ý điểm tham quan trong dữ liệu VietGo tại Ninh Bình' },
    { label: '☕ Cà phê', prompt: 'Gợi ý quán cà phê trong dữ liệu VietGo tại Hà Nội' }
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessageItem = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: messages.map(m => ({ sender: m.sender, text: m.text }))
        })
      });

      if (!response.ok) {
        throw new Error('Không thể kết nối máy chủ');
      }

      const data = await response.json();

      // Check if user is asking to plan a trip
      const lower = textToSend.toLowerCase();
      let extractedTrip: any = undefined;
      if (lower.includes('lịch trình') || lower.includes('lên kế hoạch') || lower.includes('ngày') || lower.includes('tour')) {
        let dest = '';
        if (lower.includes('đà nẵng')) dest = 'Đà Nẵng';
        if (lower.includes('hà nội')) dest = 'Hà Nội';
        else if (lower.includes('đà lạt')) dest = 'Đà Lạt';
        else if (lower.includes('phú quốc')) dest = 'Phú Quốc';
        else if (lower.includes('sa pa') || lower.includes('sapa')) dest = 'Sa Pa';
        else if (lower.includes('hội an')) dest = 'Hội An';
        else if (lower.includes('ninh bình')) dest = 'Ninh Bình';
        else if (lower.includes('huế')) dest = 'Huế';
        else if (lower.includes('nha trang')) dest = 'Nha Trang';
        else if (lower.includes('hồ chí minh') || lower.includes('tp.hcm') || lower.includes('sài gòn')) dest = 'TP. Hồ Chí Minh';

        let days = 3;
        const daysMatch = lower.match(/(\d+)\s*ngày/);
        if (daysMatch) days = Math.min(Math.max(parseInt(daysMatch[1]), 1), 7);

        let guests = 2;
        const guestsMatch = lower.match(/(\d+)\s*(người|khách)/);
        if (guestsMatch) guests = parseInt(guestsMatch[1]);

        if (dest) extractedTrip = {
          destination: dest,
          days,
          guests,
          style: lower.includes('nghỉ dưỡng') ? 'Nghỉ dưỡng & Chill' : lower.includes('ẩm thực') ? 'Foodie & Ẩm thực' : 'Khám phá văn hóa'
        };
      }

      const aiMsg: ChatMessageItem = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.text || 'VietGo AI sẵn sàng hỗ trợ bạn!',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        richData: {
          pois: data.richData?.pois || [],
          foods: data.richData?.foods || [],
          tips: data.richData?.tips || [],
          extractedTrip
        },
        suggestedActions: data.suggestedActions || []
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const fallbackMsg: ChatMessageItem = {
        id: `ai-err-${Date.now()}`,
        sender: 'ai',
        text: `Chào bạn! Cảm ơn bạn đã hỏi. Tôi đã tra cứu dữ liệu du lịch Việt Nam: Đối với các thắc mắc về điểm đến, di chuyển và ẩm thực, bạn cũng có thể duyệt trực tiếp ở trang Khám phá hoặc dùng công cụ Lập lịch trình.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    const newId = `session-${Date.now()}`;
    setSessions(prev => [{ id: newId, title: 'Cuộc trò chuyện mới', time: 'Vừa xong' }, ...prev]);
    setActiveSessionId(newId);
    setMessages([
      {
        id: 'welcome-new',
        sender: 'ai',
        text: `Xin chào! Bạn đang muốn tìm hiểu về địa điểm, ẩm thực hay cần lập lịch trình cho chuyến đi nào tại Việt Nam?`,
        timestamp: 'Bây giờ'
      }
    ]);
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white text-[#222222] overflow-hidden">
      {/* 1. Desktop Collapsible Sidebar (Chat History) */}
      <aside 
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } hidden md:flex flex-col border-r border-[#E5E5E5] bg-[#F7F7F7] transition-all duration-300 overflow-hidden shrink-0`}
      >
        <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-[#E5E5E5] hover:border-[#222222] text-xs font-bold text-[#222222] transition-colors shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FF385C]" />
            <span>Đoạn chat mới</span>
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <div className="text-[11px] font-bold text-[#717171] px-3 py-2 uppercase tracking-wider">
            Lịch sử trò chuyện
          </div>
          {sessions.map((sess) => (
            <button
              key={sess.id}
              onClick={() => setActiveSessionId(sess.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer truncate ${
                activeSessionId === sess.id 
                  ? 'bg-white text-[#222222] shadow-2xs font-bold border border-[#E5E5E5]'
                  : 'text-[#717171] hover:bg-white/60 hover:text-[#222222]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#FF385C] shrink-0" />
              <span className="truncate">{sess.title}</span>
            </button>
          ))}
        </div>

        {/* Info footnote */}
        <div className="p-3 border-t border-[#E5E5E5] text-[11px] text-[#717171] text-center">
          VietGo AI • Trợ lý du lịch số 1 Việt Nam
        </div>
      </aside>

      {/* 2. Main Chat Canvas */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
        {/* Top Chat Header */}
        <div className="h-14 px-4 sm:px-6 border-b border-[#E5E5E5] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden md:flex p-1.5 rounded-lg hover:bg-[#F7F7F7] text-[#717171] hover:text-[#222222] cursor-pointer"
              title={sidebarOpen ? 'Thu gọn sidebar' : 'Mở sidebar'}
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
            </button>
            <div className="w-7 h-7 rounded-full bg-[#FF385C] text-white flex items-center justify-center font-black text-xs shadow-xs">
              AI
            </div>
            <div>
              <div className="text-xs font-extrabold text-[#222222] flex items-center gap-1.5">
                <span>Trợ lý Du lịch VietGo AI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              </div>
              <div className="text-[10px] text-[#717171]">Am hiểu văn hóa & Tri thức 34+ tỉnh thành</div>
            </div>
          </div>

          <button
            onClick={handleNewChat}
            className="md:hidden flex items-center gap-1 text-xs font-bold text-[#FF385C]"
          >
            <Plus className="w-4 h-4" />
            <span>Chat mới</span>
          </button>
        </div>

        {/* Chat Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
          {/* Topic suggestion chips if only initial messages */}
          {messages.length <= 2 && (
            <div className="space-y-2.5 pt-2 pb-4">
              <div className="text-xs font-bold text-[#717171]">Gợi ý câu hỏi phổ biến:</div>
              <div className="flex flex-wrap gap-2">
                {topicChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(chip.prompt)}
                    className="text-xs font-medium bg-[#F7F7F7] hover:bg-[#E5E5E5] text-[#222222] border border-[#E5E5E5] rounded-full px-3.5 py-1.5 transition-all cursor-pointer text-left"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages rendering */}
          {messages.map((msg) => {
            const isAi = msg.sender === 'ai';
            return (
              <div 
                key={msg.id} 
                className={`flex gap-3 ${isAi ? 'items-start' : 'items-start flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                  isAi ? 'bg-[#FF385C] text-white' : 'bg-[#222222] text-white'
                }`}>
                  {isAi ? 'AI' : 'Bạn'}
                </div>

                {/* Message Bubble */}
                <div className={`max-w-[85%] sm:max-w-[78%] space-y-3 ${
                  isAi ? 'text-[#222222]' : 'text-right'
                }`}>
                  <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line inline-block text-left ${
                    isAi 
                      ? 'bg-[#F7F7F7] border border-[#E5E5E5] text-[#222222]' 
                      : 'bg-[#222222] text-white shadow-xs'
                  }`}>
                    {msg.text}
                  </div>

                  {/* Trip Planning Detected Card: "Tiếp tục ở Lịch trình" */}
                  {msg.richData?.extractedTrip && (
                    <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/60 space-y-2.5 text-left">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#FF385C]" />
                        <span className="text-xs font-bold text-rose-950">
                          Đã trích xuất thông tin chuyến đi:
                        </span>
                      </div>
                      <div className="text-xs text-stone-800 space-y-1">
                        <div><strong>Điểm đến:</strong> {msg.richData.extractedTrip.destination}</div>
                        <div><strong>Thời lượng:</strong> {msg.richData.extractedTrip.days} ngày ({msg.richData.extractedTrip.guests} khách)</div>
                        {msg.richData.extractedTrip.style && (
                          <div><strong>Phong cách:</strong> {msg.richData.extractedTrip.style}</div>
                        )}
                      </div>
                      <button
                        onClick={() => onProceedToItinerary(msg.richData!.extractedTrip!)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#FF385C] hover:bg-[#E00B41] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Tiếp tục ở Lịch trình &rarr;</span>
                      </button>
                    </div>
                  )}

                  {/* Rich Cards (POIs & Foods) inside chat */}
                  {msg.richData?.pois && msg.richData.pois.length > 0 && (
                    <div className="space-y-2 pt-1 text-left">
                      <div className="text-[11px] font-bold text-[#717171] uppercase tracking-wider">
                        Địa điểm gợi ý:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {msg.richData.pois.map((poi) => (
                          <div
                            key={poi.id}
                            className="bg-white p-3 rounded-2xl border border-[#E5E5E5] shadow-2xs hover:shadow-xs transition-shadow flex gap-3"
                          >
                            <img
                              src={poi.imageUrl}
                              alt={poi.name}
                              className="w-16 h-16 rounded-xl object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <h4 className="text-xs font-bold text-[#222222] truncate">{poi.name}</h4>
                              <div className="text-[11px] text-[#717171] truncate">{poi.address}</div>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => onSelectItem({ itemType: 'poi', ...poi })}
                                  className="text-[11px] font-bold text-[#FF385C] hover:underline cursor-pointer"
                                >
                                  Chi tiết
                                </button>
                                <span className="text-stone-300">•</span>
                                <button
                                  onClick={() => onAddToItinerary({ itemType: 'poi', ...poi })}
                                  className="text-[11px] font-bold text-[#222222] hover:underline cursor-pointer"
                                >
                                  + Thêm vào lịch trình
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rich Foods */}
                  {msg.richData?.foods && msg.richData.foods.length > 0 && (
                    <div className="space-y-2 pt-1 text-left">
                      <div className="text-[11px] font-bold text-[#717171] uppercase tracking-wider">
                        Quán ăn đặc sản:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {msg.richData.foods.map((food) => (
                          <div
                            key={food.id}
                            className="bg-white p-3 rounded-2xl border border-[#E5E5E5] shadow-2xs hover:shadow-xs transition-shadow flex gap-3"
                          >
                            <img
                              src={food.imageUrl}
                              alt={food.dishName}
                              className="w-16 h-16 rounded-xl object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0 space-y-1">
                              <h4 className="text-xs font-bold text-[#222222] truncate">{food.dishName}</h4>
                              <div className="text-[11px] text-[#717171] truncate">{food.name} • {food.priceRange}</div>
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => onSelectItem({ itemType: 'food', ...food })}
                                  className="text-[11px] font-bold text-[#FF385C] hover:underline cursor-pointer"
                                >
                                  Xem quán
                                </button>
                                <span className="text-stone-300">•</span>
                                <button
                                  onClick={() => onAddToItinerary({ itemType: 'food', ...food })}
                                  className="text-[11px] font-bold text-[#222222] hover:underline cursor-pointer"
                                >
                                  + Thêm món
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Suggested Quick Actions */}
                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedActions.map((act, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (act.action === 'ask_hanoi_food') {
                              handleSendMessage('Gợi ý quán ăn trong dữ liệu VietGo tại Hà Nội');
                            } else if (act.action === 'ask_hue_sights') {
                              handleSendMessage('Gợi ý điểm tham quan trong dữ liệu VietGo tại Huế');
                            } else if (act.action === 'plan_danang') {
                              onProceedToItinerary({ destination: 'Đà Nẵng', days: 3, guests: 2, style: 'Cặp đôi & Chill' });
                            } else if (act.action === 'open_planner') {
                              onProceedToItinerary({ destination: '', days: 3, guests: 2 });
                            } else {
                              handleSendMessage(act.label);
                            }
                          }}
                          className="px-3 py-1 rounded-full bg-white hover:bg-[#F7F7F7] border border-[#E5E5E5] text-xs font-semibold text-[#222222] cursor-pointer transition-colors shadow-2xs"
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF385C] text-white flex items-center justify-center text-xs font-bold animate-pulse">
                AI
              </div>
              <div className="bg-[#F7F7F7] border border-[#E5E5E5] rounded-2xl px-4 py-2.5 text-xs text-[#717171] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FF385C] animate-ping"></div>
                <span>Đang tìm trong dữ liệu địa điểm VietGo...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 3. Fixed Bottom Chat Input Bar */}
        <div className="p-4 border-t border-[#E5E5E5] bg-white shrink-0">
          <div className="max-w-4xl mx-auto flex items-end gap-2">
            <div className="flex-1 bg-[#F7F7F7] border border-[#E5E5E5] focus-within:border-[#222222] focus-within:bg-white rounded-2xl p-2.5 transition-all">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => {
                  setInputMessage(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={handleKeyDown}
                placeholder="Hỏi về điểm tham quan, ẩm thực bản địa, quy định hàng không hoặc yêu cầu lập lịch trình..."
                rows={1}
                className="w-full bg-transparent text-xs sm:text-sm text-[#222222] placeholder:text-[#717171] resize-none focus:outline-hidden max-h-28"
              />
            </div>

            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputMessage.trim()}
              className="p-3 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-2xl cursor-pointer transition-colors disabled:opacity-40 shrink-0 shadow-sm"
              title="Gửi câu hỏi"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="max-w-4xl mx-auto text-center pt-2 text-[10px] text-[#717171]">
            VietGo AI tư vấn dựa trên cơ sở dữ liệu bản xứ chuẩn hóa. Hãy luôn kiểm tra lại giờ mở cửa thực tế.
          </div>
        </div>
      </div>
    </div>
  );
};
