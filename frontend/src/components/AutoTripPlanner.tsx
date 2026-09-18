import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Compass, 
  CheckCircle2, 
  RotateCcw, 
  Share2, 
  Download, 
  ChevronRight, 
  UtensilsCrossed, 
  Camera, 
  BedDouble, 
  Car, 
  Ticket, 
  Flame,
  PlusCircle,
  MessageSquare,
  Send,
  CornerDownLeft,
  Volume2,
  ExternalLink,
  SlidersHorizontal,
  BookmarkPlus,
  Lightbulb,
  AlertTriangle,
  Search,
  Plane,
  Layers,
  HelpCircle,
  ShieldAlert,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TripPlan, TravelStyle, CompanionType, ChatMessage, POI, FoodSpot, TravelTip } from '../types';
import { PROVINCES, ALL_TIPS } from '../data/vietnamData';

interface AutoTripPlannerProps {
  onNavigateTab: (tab: string, extraData?: any) => void;
  onOpenBooking: (item: { name: string; type: 'table' | 'ticket'; price?: number }) => void;
  initialMode?: 'planner' | 'chat' | 'tips';
}

export const AutoTripPlanner: React.FC<AutoTripPlannerProps> = ({
  onNavigateTab,
  onOpenBooking,
  initialMode = 'planner'
}) => {
  // Mode switcher: 'planner' (Interactive Itinerary), 'tips' (Destination Survival Tips & 400+ Tips), or 'chat' (AI Copilot Chat)
  const [plannerMode, setPlannerMode] = useState<'planner' | 'tips' | 'chat'>(initialMode);

  // Wizard Input State
  const [destination, setDestination] = useState('Đà Nẵng');
  const [days, setDays] = useState(3);
  const [budget, setBudget] = useState(5000000);
  const [peopleCount, setPeopleCount] = useState(2);
  const [companion, setCompanion] = useState<CompanionType>('Cặp đôi (Couple)');
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('Foodie & Ẩm thực');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<TripPlan | null>(null);
  const [activeDayTab, setActiveDayTab] = useState(1);

  // Interactive Live Modification input
  const [modifyPrompt, setModifyPrompt] = useState('');
  const [isModifying, setIsModifying] = useState(false);

  // Tips Search and Category Filtering
  const [tipSearchQuery, setTipSearchQuery] = useState('');
  const [selectedTipCategory, setSelectedTipCategory] = useState<string>('destination');

  // Destination resolution
  const currentDestination = generatedPlan ? generatedPlan.destination : destination;

  const targetProvince = useMemo(() => {
    return PROVINCES.find(p => 
      p.name.toLowerCase().includes(currentDestination.toLowerCase()) || 
      currentDestination.toLowerCase().includes(p.name.toLowerCase())
    ) || PROVINCES[0];
  }, [currentDestination]);

  // Destination-specific tips matching
  const destinationSpecificTips = useMemo(() => {
    const destName = currentDestination.toLowerCase();
    const matched = ALL_TIPS.filter(t => {
      return (
        t.tags.some(tag => tag.toLowerCase().includes(destName) || destName.includes(tag.toLowerCase())) ||
        t.title.toLowerCase().includes(destName) ||
        t.content.toLowerCase().includes(destName)
      );
    });
    const provTips = targetProvince?.tips || [];
    const combined = [...provTips, ...matched];
    const seen = new Set<string>();
    return combined.filter(item => {
      if (seen.has(item.title)) return false;
      seen.add(item.title);
      return true;
    });
  }, [currentDestination, targetProvince]);

  const tipCategories = [
    { id: 'destination', label: `🌟 Mẹo ${currentDestination}` },
    { id: 'all', label: 'Tất cả 400+ Tips' },
    { id: 'safety', label: '🛡️ An toàn & Chống lừa đảo' },
    { id: 'finance', label: '💵 Giá chuẩn & Tránh chặt chém' },
    { id: 'hang_khong', label: '✈️ Quy định Hàng không' },
    { id: 'thoi_tiet', label: '⛅ Mùa & Thời tiết' },
    { id: 'am_thuc', label: '🍲 Thưởng thức Ẩm thực' },
    { id: 'culture', label: '🏛️ Văn hóa & Kiêng kỵ' }
  ];

  const displayedTips = useMemo(() => {
    let list: TravelTip[] = [];
    if (selectedTipCategory === 'destination') {
      list = destinationSpecificTips.length > 0 
        ? destinationSpecificTips 
        : ALL_TIPS.filter(t => t.importance === 'Khẩn cấp' || t.importance === 'Cao').slice(0, 10);
    } else if (selectedTipCategory === 'all') {
      list = ALL_TIPS;
    } else {
      list = ALL_TIPS.filter(t => t.category === selectedTipCategory);
    }

    if (tipSearchQuery.trim()) {
      const q = tipSearchQuery.toLowerCase();
      return list.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedTipCategory, destinationSpecificTips, tipSearchQuery]);

  // AI Chat Copilot State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: `Xin chào! Tôi là **VietGo AI Copilot** — Trợ lý du lịch thông minh toàn diện của bạn 🇻🇳.

Tôi được tích hợp trực tiếp vào bộ lập lịch trình tự động:
• **Tự động thiết kế lịch trình** theo ngày, ngân sách chuẩn Tỷ lệ Vàng
• **Gợi ý quán ăn bản địa** tránh bẫy chặt chém du lịch
• **Giải đáp thắc mắc** văn hóa, quy định máy bay, cách di chuyển tiết kiệm
• **Cập nhật trực tiếp vào lịch trình** của bạn theo yêu cầu!

Bạn muốn lên kế hoạch đi đâu hay cần hỏi gì về chuyến đi sắp tới?`,
      timestamp: 'Vừa xong',
      suggestedActions: [
        { label: '📅 Tạo lịch trình 3N2Đ Đà Nẵng - Hội An', action: 'plan_danang_hoian' },
        { label: '🍲 Quán lẩu ấm cúng Đà Lạt dưới 150k/người', action: 'ask_dalat_hotpot' },
        { label: '✈️ Mẹo mang nước mắm Phú Quốc lên máy bay', action: 'ask_fish_sauce' },
        { label: '🏍️ Phượt đèo Mã Pí Lèng Hà Giang an toàn', action: 'ask_hagiang_tips' }
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const styleOptions: { label: TravelStyle; desc: string; icon: any }[] = [
    { label: 'Foodie & Ẩm thực', desc: 'Săn quán ngon bản địa, tránh bẫy chặt chém', icon: UtensilsCrossed },
    { label: 'Nghỉ dưỡng & Chill', desc: 'Resort view biển/núi, cafe hoàng hôn thong thả', icon: BedDouble },
    { label: 'Phượt & Khám phá', desc: 'Cung đèo hiểm trở, hang động, thắng cảnh thiên nhiên', icon: Compass },
    { label: 'Văn hóa & Di sản', desc: 'Lăng tẩm, bảo tàng, làng nghề thủ công trăm năm', icon: ShieldCheck },
    { label: 'Sống ảo & Check-in', desc: 'Góc chụp triệu view, cánh đồng hoa, hoàng hôn', icon: Camera },
    { label: 'Gia đình & Trẻ nhỏ', desc: 'Di chuyển nhẹ nhàng, khu vui chơi, nghỉ ngơi hợp lý', icon: Users }
  ];

  const companionOptions: CompanionType[] = [
    'Một mình (Solo)',
    'Cặp đôi (Couple)',
    'Nhóm bạn (Friends)',
    'Gia đình có trẻ nhỏ/người lớn'
  ];

  // Auto-scroll chat
  useEffect(() => {
    if (plannerMode === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, plannerMode]);

  // Handle plan generation
  const handleGeneratePlan = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGenerating(true);

    try {
      const response = await fetch('/api/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          days,
          budget,
          peopleCount,
          travelStyle,
          companion
        })
      });

      if (!response.ok) {
        throw new Error('Lỗi tạo lịch trình');
      }

      const plan: TripPlan = await response.json();
      setGeneratedPlan(plan);
      setActiveDayTab(1);
      setPlannerMode('planner');

      // Confetti celebration
      confetti({
        particleCount: 55,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch (err) {
      console.error(err);
      // Fallback generator from curated data
      const province = PROVINCES.find(p => p.name.toLowerCase().includes(destination.toLowerCase())) || PROVINCES[1];
      const stay = Math.round(budget * 0.3);
      const food = Math.round(budget * 0.25);
      const transport = Math.round(budget * 0.2);
      const tickets = Math.round(budget * 0.15);
      const contingency = Math.round(budget * 0.1);

      const generatedDays = Array.from({ length: days }).map((_, idx) => {
        const dayNum = idx + 1;
        const pPoi = province.pois[idx % province.pois.length] || province.pois[0];
        const pFood1 = province.foods[(idx * 2) % province.foods.length] || province.foods[0];
        const pFood2 = province.foods[(idx * 2 + 1) % province.foods.length] || province.foods[1] || province.foods[0];

        return {
          dayNumber: dayNum,
          theme: `Ngày ${dayNum}: Khám phá tinh hoa ${province.name} & Ẩm thực địa phương`,
          dayCostEstimated: Math.round(budget / days),
          items: [
            {
              id: `item-${dayNum}-1`,
              timeSlot: '07:30 - 09:00',
              title: `Ăn sáng: ${pFood1?.dishName || 'Đặc sản địa phương'}`,
              activityType: 'food',
              locationName: pFood1?.name || 'Quán ăn bản địa',
              address: pFood1?.address || province.name,
              estimatedCost: pFood1?.avgPrice || 45000,
              duration: '1.5 giờ',
              notes: 'Nên đến sớm để có chỗ ngồi thoáng mát, nước dùng thơm ngọt nhất.',
              insiderTip: 'Hỏi giá trước và gọi kèm quẩy nóng hoặc trà đá.',
              foodId: pFood1?.id
            },
            {
              id: `item-${dayNum}-2`,
              timeSlot: '09:30 - 12:00',
              title: `Tham quan: ${pPoi?.name || 'Thắng cảnh nổi tiếng'}`,
              activityType: 'poi',
              locationName: pPoi?.name || province.name,
              address: pPoi?.address || province.name,
              estimatedCost: pPoi?.ticketPrice || 100000,
              duration: '2.5 giờ',
              notes: pPoi?.description || 'Điểm check-in nổi bật không thể bỏ qua.',
              insiderTip: pPoi?.localTips || 'Mang theo mũ nón, kem chống nắng và nước lọc.',
              poiId: pPoi?.id
            },
            {
              id: `item-${dayNum}-3`,
              timeSlot: '12:30 - 14:00',
              title: `Bữa trưa: ${pFood2?.dishName || 'Món ngon đậm vị'}`,
              activityType: 'food',
              locationName: pFood2?.name || 'Nhà hàng đặc sản',
              address: pFood2?.address || province.name,
              estimatedCost: (pFood2?.avgPrice || 60000) * 1.5,
              duration: '1.5 giờ',
              notes: 'Quán được người dân bản địa đánh giá cao, không gian sạch sẽ.',
              insiderTip: 'Yêu cầu phục vụ nhanh để nghỉ ngơi giữa ngày.',
              foodId: pFood2?.id
            },
            {
              id: `item-${dayNum}-4`,
              timeSlot: '15:30 - 18:00',
              title: 'Dạo mát, check-in hoàng hôn & Thưởng thức cafe view đẹp',
              activityType: 'poi',
              locationName: `Khu vực trung tâm ${province.name}`,
              address: province.name,
              estimatedCost: 60000,
              duration: '2.5 giờ',
              notes: 'Khoảng thời gian lý tưởng nhất trong ngày khi ánh sáng dịu nhẹ.',
              insiderTip: 'Chuẩn bị pin máy ảnh dự phòng.'
            },
            {
              id: `item-${dayNum}-5`,
              timeSlot: '18:30 - 21:00',
              title: 'Ăn tối hải sản / đặc sản & Khám phá chợ đêm sầm uất',
              activityType: 'food',
              locationName: `Chợ đêm & Phố ẩm thực ${province.name}`,
              address: province.name,
              estimatedCost: 180000,
              duration: '2.5 giờ',
              notes: 'Không khí nhộn nhịp, nhiều món ăn vặt phong phú.',
              insiderTip: 'Hỏi giá trước khi chọn món cân theo kg.'
            }
          ]
        };
      });

      const fallbackPlan: TripPlan = {
        id: `plan-${Date.now()}`,
        title: `Lịch trình ${days}N${days - 1}Đ khám phá ${province.name} theo phong cách ${travelStyle}`,
        destination: province.name,
        provinceId: province.id,
        durationDays: days,
        travelStyle,
        companion,
        totalBudget: budget,
        budgetPerPerson: Math.round(budget / peopleCount),
        peopleCount,
        budgetBreakdown: { stay, food, transport, tickets, contingency },
        days: generatedDays,
        summaryAI: `Lịch trình được cá nhân hóa cho ${peopleCount} người (${companion}), ưu tiên trải nghiệm chuẩn vị bản địa, tối ưu tuyến đường di chuyển ngắn nhất và kiểm soát chi tiêu theo Tỷ Lệ Vàng.`,
        safetyAlerts: [
          'Luôn hỏi giá và kiểm tra hóa đơn trước khi thanh toán.',
          'Chú ý tư trang cá nhân khi tham quan các khu chợ đông người.',
          'Uống đủ nước và chuẩn bị áo khoác mỏng cho buổi tối.'
        ],
        createdAt: new Date().toISOString()
      };

      setGeneratedPlan(fallbackPlan);
      setActiveDayTab(1);
      setPlannerMode('planner');
    } finally {
      setIsGenerating(false);
    }
  };

  // Modify active plan
  const handleModifyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modifyPrompt.trim() || !generatedPlan) return;
    setIsModifying(true);

    try {
      const res = await fetch('/api/modify-itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPlan: generatedPlan,
          modificationRequest: modifyPrompt
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setGeneratedPlan(updated);
        setModifyPrompt('');
      } else {
        // Simple local update simulation
        const currentDays = [...generatedPlan.days];
        const dayToUpdate = currentDays[activeDayTab - 1];
        if (dayToUpdate) {
          dayToUpdate.items.push({
            id: `item-mod-${Date.now()}`,
            timeSlot: '16:00 - 17:30',
            title: `[Yêu cầu thêm] ${modifyPrompt}`,
            activityType: 'poi',
            locationName: `${generatedPlan.destination}`,
            estimatedCost: 50000,
            duration: '1.5 giờ',
            notes: 'Mục mới được bổ sung theo yêu cầu tinh chỉnh của bạn.',
            insiderTip: 'Được thêm tự động bởi VietGo AI.'
          });
          setGeneratedPlan({ ...generatedPlan, days: currentDays });
          setModifyPrompt('');
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsModifying(false);
    }
  };

  // Send message in AI Copilot chat
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: 'Vừa xong'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
      });

      if (!response.ok) {
        throw new Error('Lỗi kết nối máy chủ AI');
      }

      const data = await response.json();
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Xin lỗi, tôi chưa thể xử lý yêu cầu lúc này.',
        timestamp: 'Vừa xong',
        richData: data.richData,
        suggestedActions: data.suggestedActions
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      // Helpful fallback response
      let fallbackText = `Tôi đã nhận được câu hỏi về **"${query}"**.\n\nTại Việt Nam, với lịch trình du lịch thông minh, bạn nên phân bổ chi phí theo **Tỷ Lệ Vàng**: 30% Lưu trú, 25% Ăn uống, 20% Di chuyển, 15% Vé tham quan, và 10% Quỹ dự phòng.`;
      if (query.toLowerCase().includes('đà nẵng') || query.toLowerCase().includes('hội an')) {
        fallbackText = `💡 **Gợi ý nhanh cho Đà Nẵng & Hội An:**\n• **Lịch trình chuẩn:** 3 Ngày 2 Đêm (Ngày 1: Bán đảo Sơn Trà & Biển Mỹ Khê; Ngày 2: Ngũ Hành Sơn & Phố cổ Hội An về đêm; Ngày 3: Cầu Vàng Bà Nà Hills).\n• **Món phải thử:** Mì Quảng Bà Mua (35k-45k), Bánh tráng cuốn thịt heo Đại Lộc (65k), Cao Lầu Hội An (40k).\n• **Mẹo:** Vào phố cổ Hội An sau 17:00 khi đèn lồng bắt đầu thắp sáng rất lung linh.`;
      } else if (query.toLowerCase().includes('máy bay') || query.toLowerCase().includes('nước mắm')) {
        fallbackText = `✈️ **Quy định hàng không với Nước mắm Phú Quốc:**\n• Nước mắm truyền thống Phú Quốc có độ đạm cao **BẮT BUỘC KÝ GỬI** trong thùng xốp chuyên dụng dán băng keo niêm phong tại sân bay (không mang xách tay).\n• Mỗi hành khách được ký gửi tối đa 3-4 lít tùy hãng (Vietnam Airlines/Vietjet).`;
      }

      const fallbackAiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: fallbackText,
        timestamp: 'Vừa xong',
        suggestedActions: [
          { label: '🚀 Tạo ngay lịch trình chi tiết này', action: 'generate_active_plan' }
        ]
      };
      setMessages(prev => [...prev, fallbackAiMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Airbnb-style Top Search Bar & Switcher */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-4 sm:p-6 transition-all">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#FF385C] text-white text-xs font-black">
                ✨
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                Lập Lịch Trình Tự Động & Trợ Lý AI Copilot
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Ứng dụng thuật toán phân bổ ngân sách Tỷ Lệ Vàng & dữ liệu bản địa chuẩn hóa 34+ Tỉnh thành Việt Nam.
            </p>
          </div>

          {/* Airbnb-style Sub-View Switcher Tabs */}
          <div className="inline-flex p-1.5 rounded-2xl bg-stone-100/90 border border-stone-200/80 shadow-inner self-stretch md:self-auto">
            <button
              id="tab-btn-planner"
              type="button"
              onClick={() => setPlannerMode('planner')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                plannerMode === 'planner'
                  ? 'bg-white text-[#FF385C] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Lịch Trình Chi Tiết</span>
              {generatedPlan && (
                <span className="w-2 h-2 rounded-full bg-[#FF385C]"></span>
              )}
            </button>

            <button
              id="tab-btn-tips"
              type="button"
              onClick={() => setPlannerMode('tips')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                plannerMode === 'tips'
                  ? 'bg-white text-[#FF385C] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Mẹo {currentDestination}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                400+ Tips
              </span>
            </button>

            <button
              id="tab-btn-chat"
              type="button"
              onClick={() => setPlannerMode('chat')}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                plannerMode === 'chat'
                  ? 'bg-white text-[#FF385C] shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Hỏi Đáp AI</span>
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Online
              </span>
            </button>
          </div>
        </div>

        {/* Airbnb-style Trip Setup Inputs Grid */}
        <form onSubmit={handleGeneratePlan} className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Destination */}
          <div className="bg-stone-50 hover:bg-stone-100/80 transition-colors p-3.5 rounded-2xl border border-stone-200/70">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
              1. Bạn muốn đi đâu?
            </label>
            <div className="flex items-center gap-2 mt-1">
              <MapPin className="w-4 h-4 text-[#FF385C] shrink-0" />
              <select
                id="select-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-transparent font-bold text-sm text-stone-900 focus:outline-hidden cursor-pointer"
              >
                {PROVINCES.map(p => (
                  <option key={p.id} value={p.name}>{p.name} ({p.region})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Days */}
          <div className="bg-stone-50 hover:bg-stone-100/80 transition-colors p-3.5 rounded-2xl border border-stone-200/70">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
              2. Thời gian
            </label>
            <div className="flex items-center gap-2 mt-1">
              <Clock className="w-4 h-4 text-[#FF385C] shrink-0" />
              <select
                id="select-days"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full bg-transparent font-bold text-sm text-stone-900 focus:outline-hidden cursor-pointer"
              >
                <option value={1}>1 Ngày (Đi về trong ngày)</option>
                <option value={2}>2 Ngày 1 Đêm (Cuối tuần)</option>
                <option value={3}>3 Ngày 2 Đêm (Lý tưởng)</option>
                <option value={4}>4 Ngày 3 Đêm (Trọn vẹn)</option>
                <option value={5}>5 Ngày 4 Đêm (Khám phá sâu)</option>
                <option value={7}>7 Ngày (Xuyên Việt ngắn)</option>
              </select>
            </div>
          </div>

          {/* Travelers */}
          <div className="bg-stone-50 hover:bg-stone-100/80 transition-colors p-3.5 rounded-2xl border border-stone-200/70">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
              3. Số khách & Đi cùng
            </label>
            <div className="flex items-center gap-2 mt-1">
              <Users className="w-4 h-4 text-[#FF385C] shrink-0" />
              <select
                id="select-companion"
                value={companion}
                onChange={(e) => {
                  setCompanion(e.target.value as CompanionType);
                  if (e.target.value.includes('Solo')) setPeopleCount(1);
                  else if (e.target.value.includes('Couple')) setPeopleCount(2);
                  else setPeopleCount(4);
                }}
                className="w-full bg-transparent font-bold text-sm text-stone-900 focus:outline-hidden cursor-pointer"
              >
                {companionOptions.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Budget */}
          <div className="bg-stone-50 hover:bg-stone-100/80 transition-colors p-3.5 rounded-2xl border border-stone-200/70">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-500">
              4. Ngân sách tổng (VND)
            </label>
            <div className="flex items-center gap-2 mt-1">
              <DollarSign className="w-4 h-4 text-[#FF385C] shrink-0" />
              <select
                id="select-budget"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full bg-transparent font-bold text-sm text-stone-900 focus:outline-hidden cursor-pointer"
              >
                <option value={2000000}>2.000.000 ₫ (Tiết kiệm)</option>
                <option value={5000000}>5.000.000 ₫ (Cân đối)</option>
                <option value={8000000}>8.000.000 ₫ (Thoải mái)</option>
                <option value={15000000}>15.000.000 ₫ (Nghỉ dưỡng VIP)</option>
                <option value={25000000}>25.000.000 ₫ (Cao cấp)</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-end">
            <button
              id="generate-plan-submit"
              type="submit"
              disabled={isGenerating}
              className="w-full h-full min-h-[52px] px-5 py-3 bg-gradient-to-r from-[#FF385C] via-[#E00B41] to-[#D70466] hover:opacity-95 text-white font-extrabold rounded-2xl shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95 disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'AI Đang Tính Toán...' : 'Tạo Lịch Trình 30s'}</span>
            </button>
          </div>
        </form>

        {/* Travel Style Pills Selection */}
        <div className="mt-4 pt-4 border-t border-stone-100 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-stone-400 whitespace-nowrap mr-1 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Gu du lịch:
          </span>
          {styleOptions.map((opt) => {
            const isSelected = travelStyle === opt.label;
            const Icon = opt.icon;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => setTravelStyle(opt.label)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100/90 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#FF385C]' : 'text-stone-500'}`} />
                <span>{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area based on plannerMode */}
      {plannerMode === 'planner' ? (
        <div className="space-y-6">
          {/* If no plan generated yet, show prompt banner */}
          {!generatedPlan && (
            <div className="bg-gradient-to-br from-rose-50 via-white to-amber-50/50 rounded-3xl p-8 sm:p-12 border border-rose-100/80 text-center space-y-4 shadow-xs">
              <div className="w-16 h-16 rounded-3xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center mx-auto text-2xl font-black">
                🗺️
              </div>
              <div className="max-w-xl mx-auto space-y-2">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                  Bạn đã sẵn sàng cho chuyến đi tuyệt vời tiếp theo?
                </h2>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Nhấp vào <strong>"Tạo Lịch Trình 30s"</strong> ở trên, hoặc hỏi trực tiếp <strong>Trợ Lý AI Copilot</strong> để nhận kế hoạch chi tiết từng buổi kèm bảng phân bổ ngân sách chuẩn Tỷ Lệ Vàng.
                </p>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => handleGeneratePlan()}
                  className="px-6 py-3 bg-[#FF385C] text-white rounded-2xl font-bold text-sm hover:bg-[#E00B41] transition-colors shadow-sm cursor-pointer"
                >
                  Tạo nhanh lịch trình {destination} ({days} ngày)
                </button>
                <button
                  onClick={() => setPlannerMode('chat')}
                  className="px-6 py-3 bg-white text-stone-800 border border-stone-200 rounded-2xl font-bold text-sm hover:bg-stone-50 transition-colors shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-[#FF385C]" />
                  <span>Trò chuyện cùng AI Copilot</span>
                </button>
              </div>
            </div>
          )}

          {/* Generated Plan View */}
          {generatedPlan && (
            <div className="space-y-6">
              {/* Plan Header Card */}
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 text-[#FF385C] text-xs font-black">
                        {generatedPlan.durationDays} Ngày {generatedPlan.durationDays - 1} Đêm
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-bold">
                        {generatedPlan.travelStyle}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-700 text-xs font-bold">
                        {generatedPlan.peopleCount} người ({generatedPlan.companion})
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-stone-900 mt-2">
                      {generatedPlan.title}
                    </h2>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onNavigateTab('map', { provinceName: generatedPlan.destination })}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#FF385C]" />
                      <span>Xem Bản Đồ</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        alert('Đã sao chép liên kết lịch trình!');
                      }}
                      className="p-2 text-stone-500 hover:text-stone-800 bg-stone-50 hover:bg-stone-100 rounded-xl border border-stone-200 transition-colors cursor-pointer"
                      title="Chia sẻ"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {generatedPlan.summaryAI}
                </p>

                {/* Golden Ratio Budget Meter */}
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-stone-700">
                    <span className="flex items-center gap-1.5 text-stone-900">
                      <DollarSign className="w-4 h-4 text-[#FF385C]" />
                      Ngân sách Tỷ Lệ Vàng: {generatedPlan.totalBudget.toLocaleString('vi-VN')} ₫
                      <span className="text-stone-400 font-normal">
                        (~{generatedPlan.budgetPerPerson.toLocaleString('vi-VN')} ₫ / người)
                      </span>
                    </span>
                    <span className="text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md text-[11px]">
                      Tối ưu chi phí thực tế
                    </span>
                  </div>

                  {/* Visual Segments */}
                  <div className="h-3 rounded-full overflow-hidden flex bg-stone-200 shadow-inner">
                    <div className="bg-blue-500 h-full" style={{ width: '30%' }} title="Lưu trú 30%"></div>
                    <div className="bg-amber-500 h-full" style={{ width: '25%' }} title="Ẩm thực 25%"></div>
                    <div className="bg-emerald-500 h-full" style={{ width: '20%' }} title="Di chuyển 20%"></div>
                    <div className="bg-purple-500 h-full" style={{ width: '15%' }} title="Vé tham quan 15%"></div>
                    <div className="bg-stone-400 h-full" style={{ width: '10%' }} title="Dự phòng 10%"></div>
                  </div>

                  {/* Legend */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] text-stone-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0"></span>
                      <span>Ở: {generatedPlan.budgetBreakdown.stay.toLocaleString('vi-VN')} ₫ (30%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0"></span>
                      <span>Ăn: {generatedPlan.budgetBreakdown.food.toLocaleString('vi-VN')} ₫ (25%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span>Đi lại: {generatedPlan.budgetBreakdown.transport.toLocaleString('vi-VN')} ₫ (20%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0"></span>
                      <span>Vé: {generatedPlan.budgetBreakdown.tickets.toLocaleString('vi-VN')} ₫ (15%)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-stone-400 shrink-0"></span>
                      <span>Dự phòng: {generatedPlan.budgetBreakdown.contingency.toLocaleString('vi-VN')} ₫ (10%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Day Tabs & Timeline */}
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
                {/* Day selector tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200 scrollbar-none">
                  {generatedPlan.days.map((day) => (
                    <button
                      key={day.dayNumber}
                      onClick={() => setActiveDayTab(day.dayNumber)}
                      className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold whitespace-nowrap transition-all cursor-pointer ${
                        activeDayTab === day.dayNumber
                          ? 'bg-stone-900 text-white shadow-md'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      Ngày {day.dayNumber}
                    </button>
                  ))}
                </div>

                {/* Active Day Content */}
                {(() => {
                  const currentDay = generatedPlan.days.find(d => d.dayNumber === activeDayTab) || generatedPlan.days[0];
                  if (!currentDay) return null;

                  return (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-base sm:text-lg text-stone-900">
                          {currentDay.theme}
                        </h3>
                        <span className="text-xs text-stone-500 font-bold bg-stone-50 px-3 py-1 rounded-full border border-stone-200">
                          Chi phí ước tính: {currentDay.dayCostEstimated.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>

                      {/* Timeline Items */}
                      <div className="space-y-4 relative before:absolute before:inset-0 before:left-4 sm:before:left-6 before:w-0.5 before:bg-stone-200">
                        {currentDay.items.map((item, idx) => {
                          const isFood = item.activityType === 'food';
                          return (
                            <div key={item.id || idx} className="relative flex items-start gap-4 sm:gap-6 group">
                              {/* Node Circle */}
                              <div className={`w-8 sm:w-12 h-8 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 text-white text-xs sm:text-sm font-bold shadow-sm transition-transform group-hover:scale-105 z-10 ${
                                isFood ? 'bg-amber-500' : 'bg-[#FF385C]'
                              }`}>
                                {isFood ? <UtensilsCrossed className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                              </div>

                              {/* Card Content */}
                              <div className="flex-1 bg-stone-50 hover:bg-white transition-all rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-xs space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="px-2.5 py-0.5 rounded-md bg-stone-200/70 text-stone-700 text-[11px] font-bold">
                                    {item.timeSlot} ({item.duration})
                                  </span>
                                  <span className="text-xs font-black text-stone-800">
                                    {item.estimatedCost > 0 ? `${item.estimatedCost.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}
                                  </span>
                                </div>

                                <h4 className="font-extrabold text-sm sm:text-base text-stone-900">
                                  {item.title}
                                </h4>

                                <p className="text-xs text-stone-600 leading-relaxed">
                                  {item.notes}
                                </p>

                                {item.insiderTip && (
                                  <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
                                    <span className="font-bold shrink-0">💡 Mẹo bản địa:</span>
                                    <span>{item.insiderTip}</span>
                                  </div>
                                )}

                                {/* Card Actions */}
                                <div className="pt-2 flex items-center gap-2 border-t border-stone-200/50">
                                  {isFood ? (
                                    <button
                                      onClick={() => onOpenBooking({
                                        name: item.locationName,
                                        type: 'table',
                                        price: item.estimatedCost
                                      })}
                                      className="px-3 py-1.5 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                                    >
                                      Đặt bàn quán này
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => onOpenBooking({
                                        name: item.locationName,
                                        type: 'ticket',
                                        price: item.estimatedCost
                                      })}
                                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                                    >
                                      Đặt vé tham quan
                                    </button>
                                  )}
                                  <button
                                    onClick={() => onNavigateTab('map', { provinceName: generatedPlan.destination })}
                                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
                                  >
                                    Chỉ đường
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* AI Interactive Modification Prompt */}
                <div className="pt-4 border-t border-stone-200">
                  <form onSubmit={handleModifyPlan} className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-stone-700">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF385C]" />
                      <span>Tinh chỉnh lịch trình bằng câu lệnh tự nhiên:</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={modifyPrompt}
                        onChange={(e) => setModifyPrompt(e.target.value)}
                        placeholder="VD: 'Thêm quán cafe ngắm hoàng hôn vào Ngày 2', 'Đổi bữa tối sang đồ chay'..."
                        className="flex-1 bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-xs text-stone-900 focus:outline-hidden focus:border-[#FF385C]"
                      />
                      <button
                        type="submit"
                        disabled={isModifying || !modifyPrompt.trim()}
                        className="px-4 py-2 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {isModifying ? 'Đang chỉnh...' : 'Cập nhật'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Embedded Destination Tips Card in Plan View */}
                <div className="pt-6 border-t border-stone-200/80 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-sm shadow-xs">
                        💡
                      </div>
                      <div>
                        <h4 className="font-extrabold text-stone-900 text-base">
                          Mẹo Thực Chiến & Kinh Nghiệm Bản Xứ Cho Chuyến Đi {generatedPlan.destination}
                        </h4>
                        <p className="text-xs text-stone-500">
                          Kinh nghiệm tránh bẫy chặt chém, an toàn sông nước/đèo dốc & quy tắc văn hóa
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlannerMode('tips')}
                      className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                    >
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                      <span>Xem toàn bộ 400+ Mẹo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Destination Info Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/70 space-y-1">
                      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-600" />
                        <span>Mùa Vàng Du Lịch</span>
                      </div>
                      <div className="text-xs font-extrabold text-stone-800">
                        {targetProvince.bestMonths}
                      </div>
                      <p className="text-[11px] text-stone-500 leading-snug">
                        {targetProvince.weatherSummary}
                      </p>
                    </div>

                    <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/70 space-y-1">
                      <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                        <Car className="w-3 h-3 text-stone-600" />
                        <span>Di Chuyển & Thuê Xe</span>
                      </div>
                      <div className="text-xs font-extrabold text-stone-800">
                        Thuê xe: {targetProvince.transportation.avgBikeRental}
                      </div>
                      <p className="text-[11px] text-stone-500 leading-snug">
                        Phương tiện: {targetProvince.transportation.localMove.join(', ')}
                      </p>
                    </div>

                    <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/70 space-y-1">
                      <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-500" />
                        <span>Kiêng Kỵ Văn Hóa</span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-snug">
                        {targetProvince.culturalTaboos[0] || 'Tôn trọng phong tục bản địa, ăn mặc trang nghiêm khi vào di tích đền chùa.'}
                      </p>
                    </div>
                  </div>

                  {/* Curated Destination Tips Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    {destinationSpecificTips.slice(0, 4).map((tip, idx) => (
                      <div
                        key={tip.id || idx}
                        className={`rounded-2xl p-3.5 border transition-all ${
                          tip.importance === 'Khẩn cấp' || tip.importance === 'Cao'
                            ? 'bg-rose-50/60 border-rose-200/80 text-rose-950'
                            : 'bg-white border-stone-200/80 text-stone-800 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                            {tip.category === 'safety' ? '🛡️ An toàn' : tip.category === 'finance' ? '💵 Giá chuẩn' : '💡 Mẹo hữu ích'}
                          </span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            tip.importance === 'Khẩn cấp' 
                              ? 'bg-rose-500 text-white' 
                              : tip.importance === 'Cao' 
                                ? 'bg-amber-500 text-white' 
                                : 'bg-stone-200 text-stone-700'
                          }`}>
                            {tip.importance}
                          </span>
                        </div>
                        <h5 className="font-extrabold text-xs text-stone-900 mb-1">
                          {tip.title}
                        </h5>
                        <p className="text-[11.5px] text-stone-600 leading-relaxed">
                          {tip.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : plannerMode === 'tips' ? (
        /* Dedicated Destination & 400+ Tips Survival Guide View */
        <div className="space-y-6">
          {/* Destination Survival Banner */}
          <div className="bg-gradient-to-br from-amber-50 via-white to-stone-50 rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🌟</span>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                    Cẩm Nang Thực Chiến Bản Xứ
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                  Mẹo Du Lịch & Kinh Nghiệm: {currentDestination}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600">
                  Kho dữ liệu 400+ mẹo sinh tồn, chống lừa đảo, quy định bay & bảo tồn di sản đã được chuẩn hóa.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPlannerMode('planner')}
                  className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-[#FF385C]" />
                  <span>Xem Lịch Trình</span>
                </button>
              </div>
            </div>

            {/* Destination Highlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="bg-white/80 rounded-2xl p-4 border border-stone-200/70 space-y-1">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-stone-600" />
                  <span>Thời Tiết & Mùa Vàng</span>
                </div>
                <div className="text-xs font-black text-stone-900">
                  {targetProvince.bestMonths}
                </div>
                <p className="text-xs text-stone-600 leading-snug">
                  {targetProvince.weatherSummary}
                </p>
              </div>

              <div className="bg-white/80 rounded-2xl p-4 border border-stone-200/70 space-y-1">
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                  <Car className="w-3.5 h-3.5 text-stone-600" />
                  <span>Di Chuyển & Giá Xe</span>
                </div>
                <div className="text-xs font-black text-stone-900">
                  {targetProvince.transportation.avgBikeRental}
                </div>
                <p className="text-xs text-stone-600 leading-snug">
                  {targetProvince.transportation.localMove.join(', ')}
                </p>
              </div>

              <div className="bg-white/80 rounded-2xl p-4 border border-stone-200/70 space-y-1">
                <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>Kiêng Kỵ Văn Hóa</span>
                </div>
                <ul className="text-xs text-stone-700 space-y-1 list-disc list-inside">
                  {targetProvince.culturalTaboos.slice(0, 2).map((taboo, idx) => (
                    <li key={idx} className="leading-snug">{taboo}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Flight Rules Banner */}
            <div className="bg-sky-50/80 rounded-2xl p-4 border border-sky-200/80 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-sky-100 text-sky-800 shrink-0">
                <Plane className="w-4 h-4" />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-extrabold text-sky-950">
                  ✈️ Quy định Hàng không & Ký gửi hành lý khi du lịch Việt Nam:
                </div>
                <p className="text-sky-900/90 leading-relaxed">
                  <strong>Nước mắm:</strong> Tối đa 3–5L, phải đóng thùng xốp dán kín theo quy định VNA/Vietjet, cấm xách tay. • <strong>Sầu riêng/Hải sản tươi:</strong> Bắt buộc hút chân không đóng hộp kín, không tỏa mùi. • <strong>Pin sạc dự phòng:</strong> Bắt buộc mang xách tay (dưới 100Wh/20.000mAh), cấm ký gửi dưới mọi hình thức.
                </p>
              </div>
            </div>
          </div>

          {/* Tips Search & Category Filter Controls */}
          <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs p-4 sm:p-5 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tipSearchQuery}
                onChange={(e) => setTipSearchQuery(e.target.value)}
                placeholder={`Tìm kiếm trong 400+ mẹo (VD: 'taxi', 'nước mắm', 'say xe', 'chặt chém', '${currentDestination}')...`}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:border-[#FF385C]"
              />
              {tipSearchQuery && (
                <button
                  onClick={() => setTipSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400 hover:text-stone-600"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {tipCategories.map(cat => {
                const isActive = selectedTipCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedTipCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-stone-400 pt-1 flex items-center justify-between">
              <span>Hiển thị <strong>{displayedTips.length}</strong> mẹo thực chiến</span>
              <span className="text-[11px] text-stone-500">
                Lọc theo: {selectedTipCategory === 'destination' ? currentDestination : selectedTipCategory}
              </span>
            </div>
          </div>

          {/* Tips Cards Grid */}
          {displayedTips.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedTips.map(tip => {
                const isEmergency = tip.importance === 'Khẩn cấp';
                const isHigh = tip.importance === 'Cao';

                return (
                  <div
                    key={tip.id}
                    className={`rounded-3xl p-5 border transition-all flex flex-col justify-between ${
                      isEmergency
                        ? 'bg-rose-50/80 border-rose-200 text-rose-950 shadow-xs'
                        : isHigh
                          ? 'bg-amber-50/50 border-amber-200/80 text-stone-900 shadow-2xs'
                          : 'bg-white border-stone-200 text-stone-800 shadow-xs'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 uppercase tracking-wider">
                          {tip.category === 'safety' 
                            ? '🛡️ An toàn' 
                            : tip.category === 'finance' 
                              ? '💵 Giá chuẩn' 
                              : tip.category === 'food' 
                                ? '🍲 Ẩm thực' 
                                : tip.category === 'hang_khong' 
                                  ? '✈️ Hàng không'
                                  : '💡 Cẩm nang'}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          isEmergency 
                            ? 'bg-rose-500 text-white' 
                            : isHigh 
                              ? 'bg-amber-500 text-white' 
                              : 'bg-stone-200 text-stone-700'
                        }`}>
                          {tip.importance}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-sm text-stone-900 leading-snug">
                        {tip.title}
                      </h4>

                      <p className="text-xs text-stone-600 leading-relaxed">
                        {tip.content}
                      </p>
                    </div>

                    <div className="pt-4 mt-3 border-t border-stone-100/80 flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {tip.tags.slice(0, 3).map((t, idx) => (
                          <span key={idx} className="text-[10px] text-stone-400 font-medium">
                            #{t}
                          </span>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setInputMessage(`Cho tôi biết thêm chi tiết và kinh nghiệm thực tế về: "${tip.title}"`);
                          setPlannerMode('chat');
                        }}
                        className="text-[11px] font-bold text-[#FF385C] hover:underline cursor-pointer"
                      >
                        Hỏi AI &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-3">
              <div className="text-2xl">🔍</div>
              <h4 className="font-bold text-stone-800 text-sm">
                Không tìm thấy mẹo nào phù hợp với từ khóa "{tipSearchQuery}"
              </h4>
              <button
                type="button"
                onClick={() => {
                  setTipSearchQuery('');
                  setSelectedTipCategory('all');
                }}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Hiển thị tất cả 400+ mẹo
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Copilot AI Chat View */
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-[700px]">
          {/* Chat Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div key={msg.id} className={`flex gap-3 ${isAi ? 'items-start' : 'items-start flex-row-reverse'}`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-xs ${
                    isAi ? 'bg-[#FF385C] text-white' : 'bg-stone-800 text-white'
                  }`}>
                    {isAi ? 'AI' : 'Bạn'}
                  </div>

                  {/* Message Bubble */}
                  <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                    isAi
                      ? 'bg-stone-50 text-stone-900 border border-stone-200/80'
                      : 'bg-stone-900 text-white shadow-xs'
                  }`}>
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* Suggested Actions if available */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-stone-200/60 flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((act, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (act.action === 'generate_active_plan') {
                                handleGeneratePlan();
                              } else {
                                handleSendMessage(act.label);
                              }
                            }}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-semibold cursor-pointer transition-colors shadow-2xs"
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

            {isChatLoading && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF385C] text-white text-xs font-bold flex items-center justify-center animate-pulse">
                  AI
                </div>
                <div className="bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 text-xs text-stone-500 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF385C] animate-ping"></div>
                  <span>VietGo AI đang tra cứu dữ liệu bản địa...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-stone-200 bg-stone-50/80 flex items-center gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSendMessage();
              }}
              placeholder="Hỏi về điểm tham quan, ẩm thực bản địa, quy định hàng không..."
              className="flex-1 bg-white border border-stone-300 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:border-[#FF385C]"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isChatLoading || !inputMessage.trim()}
              className="p-3 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-2xl cursor-pointer transition-colors disabled:opacity-50 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
