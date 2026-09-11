import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  MapPin, 
  UtensilsCrossed, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Compass, 
  CornerDownLeft, 
  RotateCcw,
  Volume2,
  BookmarkPlus,
  Share2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { ChatMessage, POI, FoodSpot, TravelTip } from '@db/types';

interface AIChatbotProps {
  onNavigateTab: (tab: string, extraData?: any) => void;
  onOpenBooking: (item: { name: string; type: 'table' | 'ticket'; price?: number }) => void;
}

export const AIChatbot: React.FC<AIChatbotProps> = ({
  onNavigateTab,
  onOpenBooking
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `Xin chào! Tôi là **VietGo AI** — Trợ lý du lịch thông minh toàn diện của bạn tại Việt Nam 🇻🇳.

Tôi có thể giúp bạn:
• **Khám phá ẩm thực bản địa** chuẩn vị, giá niêm yết rõ ràng (tránh bẫy du lịch)
• **Tư vấn lịch trình cá nhân hóa** theo số ngày, ngân sách và thành viên
• **Giải thích văn hóa, phong tục di tích** & 400+ mẹo sinh tồn thực chiến
• **Chỉ đường, tìm điểm quanh bạn** và hỗ trợ đặt bàn / đặt vé trực tiếp.

Bạn đang có kế hoạch vi vu đến đâu tại Việt Nam?`,
      timestamp: 'Vừa xong',
      suggestedActions: [
        { label: '🍲 Quán lẩu ấm cúng Đà Lạt dưới 150k', action: 'ask_dalat_hotpot' },
        { label: '📅 Lịch trình Hà Giang 3N2Đ cho nhóm bạn', action: 'ask_hagiang_plan' },
        { label: '✈️ Mẹo mang nước mắm Phú Quốc lên máy bay', action: 'ask_fish_sauce' },
        { label: '🦀 Ăn hải sản Đà Nẵng không lo bị chém', action: 'ask_danang_seafood' }
      ]
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const promptSuggestions = [
    '🍲 Tìm quán lẩu ấm cúng ở Đà Lạt dưới 150k/người',
    '🗺️ Lập lịch trình 3N2Đ tại Hội An & Đà Nẵng',
    '✈️ Quy định xách tay nước mắm Phú Quốc lên máy bay',
    '⭐ Quán phở gia truyền ngon chuẩn vị người Hà Nội',
    '🛡️ Hotline cứu hộ và mẹo tránh bẫy taxi sân bay'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          conversationHistory: messages.slice(-4),
        })
      });

      if (!res.ok) {
        throw new Error('Lỗi máy chủ kết nối AI');
      }

      const data = await res.json();

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        richData: data.richData,
        suggestedActions: data.suggestedActions
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: `Rất tiếc, đã có gián đoạn kết nối tạm thời. Bạn có thể thử lại câu hỏi hoặc chuyển sang tab **Lập lịch trình** hay **Bản đồ số** để tra cứu dữ liệu đã lưu sẵn.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#•_`]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'vi-VN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Chat Container Card */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col h-[760px] overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 bg-stone-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-stone-900 text-sm">VietGo AI Copilot</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">RAG Grounded</span>
              </div>
              <p className="text-xs text-stone-500">Truy xuất trực tiếp từ Bách khoa du lịch 34+ Tỉnh thành</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMessages([messages[0]])}
              title="Làm mới cuộc trò chuyện"
              className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                    VG
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[78%] space-y-3`}>
                  {/* Speech Bubble */}
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-red-600 text-white rounded-tr-xs shadow-xs'
                        : 'bg-stone-100/90 text-stone-800 rounded-tl-xs border border-stone-200/60'
                    }`}
                  >
                    <div className="whitespace-pre-wrap space-y-2">
                      {msg.text.split('\n').map((line, idx) => {
                        if (line.startsWith('• ') || line.startsWith('- ')) {
                          return (
                            <div key={idx} className="flex items-start gap-1.5 pl-1">
                              <span className="text-red-500 font-bold mt-0.5">•</span>
                              <span>{line.replace(/^[•-]\s*/, '')}</span>
                            </div>
                          );
                        }
                        if (line.startsWith('**') && line.endsWith('**')) {
                          return <div key={idx} className="font-bold text-stone-900 pt-1">{line.replace(/\*\*/g, '')}</div>;
                        }
                        return <p key={idx}>{line}</p>;
                      })}
                    </div>

                    {/* Speech Audio Button for AI */}
                    {!isUser && (
                      <div className="mt-3 pt-2 border-t border-stone-200/60 flex items-center justify-between text-xs text-stone-500">
                        <span>{msg.timestamp}</span>
                        <button
                          onClick={() => handleSpeakMessage(msg.text)}
                          className="hover:text-stone-800 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Đọc văn bản"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Đọc</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Rich Data Cards (POI / Foods / Tips) */}
                  {!isUser && msg.richData && (
                    <div className="space-y-3 pt-1">
                      {/* POI Cards */}
                      {msg.richData.pois && msg.richData.pois.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                            <span>Địa điểm gợi ý trong khu vực</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {msg.richData.pois.map((poi) => (
                              <div
                                key={poi.id}
                                className="bg-white border border-stone-200 rounded-xl p-3 hover:border-red-300 transition-all hover:shadow-xs group"
                              >
                                <div className="flex gap-3">
                                  <img
                                    src={poi.imageUrl}
                                    alt={poi.name}
                                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-xs text-stone-900 truncate group-hover:text-red-600 transition-colors">
                                      {poi.name}
                                    </h4>
                                    <p className="text-[11px] text-stone-500 truncate">{poi.address}</p>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] text-stone-600">
                                      <span className="px-1.5 py-0.5 rounded-md bg-stone-100 font-semibold">
                                        {poi.ticketPrice === 0 ? 'Miễn phí' : `${poi.ticketPrice.toLocaleString()}đ`}
                                      </span>
                                      <span>★ {poi.rating}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                                  <button
                                    onClick={() => onNavigateTab('map', { poiId: poi.id, lat: poi.coordinates.lat, lng: poi.coordinates.lng })}
                                    className="text-[11px] text-red-600 font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                                  >
                                    <span>Xem bản đồ</span>
                                    <ChevronRight className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => onOpenBooking({ name: poi.name, type: 'ticket', price: poi.ticketPrice })}
                                    className="text-[11px] bg-stone-900 hover:bg-stone-800 text-white px-2 py-1 rounded-md font-medium cursor-pointer transition-colors"
                                  >
                                    Đặt vé
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Food Cards */}
                      {msg.richData.foods && msg.richData.foods.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
                            <span>Quán ăn bản địa chuẩn vị</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {msg.richData.foods.map((food) => (
                              <div
                                key={food.id}
                                className="bg-white border border-stone-200 rounded-xl p-3 hover:border-amber-300 transition-all hover:shadow-xs"
                              >
                                <div className="flex gap-3">
                                  <img
                                    src={food.imageUrl}
                                    alt={food.name}
                                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                      <h4 className="font-bold text-xs text-stone-900 truncate">{food.dishName}</h4>
                                      {food.isLocalFavorite && (
                                        <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded-sm font-semibold">Bản địa</span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-stone-600 truncate font-medium">{food.name}</p>
                                    <p className="text-[10px] text-amber-700 font-bold mt-0.5">{food.priceRange}</p>
                                  </div>
                                </div>
                                <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                                  <button
                                    onClick={() => onNavigateTab('food', { foodId: food.id })}
                                    className="text-[11px] text-stone-600 hover:text-stone-900 font-medium cursor-pointer"
                                  >
                                    Chi tiết món
                                  </button>
                                  <button
                                    onClick={() => onOpenBooking({ name: `${food.name} - ${food.dishName}`, type: 'table' })}
                                    className="text-[11px] bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors"
                                  >
                                    Đặt bàn giữ chỗ
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Travel Tips Box */}
                      {msg.richData.tips && msg.richData.tips.length > 0 && (
                        <div className="space-y-1.5">
                          {msg.richData.tips.map((tip) => (
                            <div
                              key={tip.id}
                              className="bg-amber-50/80 border border-amber-200/70 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5"
                            >
                              <ShieldCheck className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-bold text-amber-950">{tip.title}: </span>
                                <span>{tip.content}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suggested Action Chips */}
                  {msg.suggestedActions && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedActions.map((action, aIdx) => (
                        <button
                          key={aIdx}
                          onClick={() => {
                            if (action.action === 'open_map') onNavigateTab('map');
                            else if (action.action === 'open_planner') onNavigateTab('planner');
                            else if (action.action === 'open_food') onNavigateTab('food');
                            else handleSendMessage(action.label);
                          }}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 shadow-2xs hover:border-red-300 transition-all cursor-pointer"
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-stone-800 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                    Bạn
                  </div>
                )}
              </div>
            );
          })}

          {/* AI Thinking Animation */}
          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white text-xs font-bold animate-pulse">
                VG
              </div>
              <div className="p-4 rounded-2xl bg-stone-100 text-stone-500 text-xs rounded-tl-xs border border-stone-200 flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span>VietGo AI đang truy xuất RAG & đối chiếu bách khoa 34+ tỉnh thành...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-4 py-2 border-t border-stone-100 bg-stone-50/50 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] text-stone-400 font-medium whitespace-nowrap">Gợi ý nhanh:</span>
          {promptSuggestions.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="text-xs bg-white hover:bg-red-50 text-stone-700 hover:text-red-700 px-3 py-1 rounded-lg border border-stone-200/80 whitespace-nowrap cursor-pointer transition-colors shadow-2xs font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-stone-200/80 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              id="ai-chat-input"
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Hỏi bất kỳ điều gì: quán ăn, lịch trình, giá vé, mẹo du lịch..."
              className="flex-1 px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white transition-all text-stone-900"
              disabled={isLoading}
            />
            <button
              id="send-chat-btn"
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="p-3 bg-red-600 hover:bg-red-700 disabled:bg-stone-300 text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs hover:scale-105 active:scale-95 disabled:hover:scale-100 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
