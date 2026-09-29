import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Sparkles, 
  PlusCircle, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Bookmark, 
  Check, 
  Share2, 
  Map as MapIcon, 
  List, 
  Bot, 
  Lightbulb, 
  DollarSign, 
  Clock, 
  ShieldAlert, 
  ChevronRight,
  SlidersHorizontal,
  Layers,
  Utensils,
  Camera,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TripPlan, ItineraryDay, ItineraryItem, TravelStyle, CompanionType } from '../types';
import { PROVINCES, ALL_TIPS } from '../data/vietnamData';
import { DetailItem } from './ItemDetailModal';

interface ItineraryPageProps {
  initialGeneratedPlan?: TripPlan | null;
  initialPlanParams?: {
    destination: string;
    days: number;
    guests: number;
    style?: string;
  } | null;
  onSelectItem: (item: DetailItem) => void;
  onOpenBooking: (booking: { name: string; type: 'table' | 'ticket'; price?: number }) => void;
  onAskAIAboutTrip: (question: string) => void;
  pendingAddItem?: DetailItem | null;
  onClearPendingItem?: () => void;
}

export const ItineraryPage: React.FC<ItineraryPageProps> = ({
  initialGeneratedPlan,
  initialPlanParams,
  onSelectItem,
  onOpenBooking,
  onAskAIAboutTrip,
  pendingAddItem,
  onClearPendingItem
}) => {
  // Plan Parameters
  const [destination, setDestination] = useState(initialPlanParams?.destination || 'Đà Nẵng');
  const [daysCount, setDaysCount] = useState(initialPlanParams?.days || 3);
  const [guestsCount, setGuestsCount] = useState(initialPlanParams?.guests || 2);
  const [budgetTotal, setBudgetTotal] = useState(6000000);
  const [travelStyle, setTravelStyle] = useState<TravelStyle>('Foodie & Ẩm thực');

  // Active Day tab (1, 2, 3...)
  const [activeDay, setActiveDay] = useState(1);

  // View mode for mobile/desktop (Split screen or toggle)
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');

  // AI interactive modification prompt
  const [aiPrompt, setAiPrompt] = useState('');
  const [isModifyingWithAI, setIsModifyingWithAI] = useState(false);
  const [aiRefinementOpen, setAiRefinementOpen] = useState(false);

  // Save state
  const [isSaved, setIsSaved] = useState(false);

  // Tips drawer/tab toggle
  const [showTips, setShowTips] = useState(false);

  // Add stop modal
  const [isAddStopOpen, setIsAddStopOpen] = useState(false);
  const [newStopTitle, setNewStopTitle] = useState('');
  const [newStopTimeSlot, setNewStopTimeSlot] = useState('Sáng (08:30 - 11:30)');
  const [newStopCost, setNewStopCost] = useState(50000);
  const [newStopAddress, setNewStopAddress] = useState('');

  // Destination Province resolution
  const targetProvince = PROVINCES.find(p => 
    p.name.toLowerCase().includes(destination.toLowerCase()) ||
    destination.toLowerCase().includes(p.name.toLowerCase())
  ) || PROVINCES[1];

  // Helper to generate default days
  const generateDefaultPlan = (dest: string, days: number): TripPlan => {
    const prov = PROVINCES.find(p => 
      p.name.toLowerCase().includes(dest.toLowerCase()) || 
      dest.toLowerCase().includes(p.name.toLowerCase())
    ) || PROVINCES[1];

    const planDays: ItineraryDay[] = [];
    for (let d = 1; d <= days; d++) {
      const poi1 = prov.pois[(d * 2 - 2) % prov.pois.length];
      const poi2 = prov.pois[(d * 2 - 1) % prov.pois.length];
      const food1 = prov.foods[(d * 2 - 2) % prov.foods.length];
      const food2 = prov.foods[(d * 2 - 1) % prov.foods.length];

      planDays.push({
        dayNumber: d,
        theme: d === 1 ? `Chạm ngõ ${prov.name} & Thưởng thức ẩm thực biểu tượng` : d === 2 ? `Khám phá danh thắng & Trải nghiệm văn hóa` : `Nghỉ dưỡng, mua sắm đặc sản & Tạm biệt ${prov.name}`,
        dayCostEstimated: (food1?.avgPrice || 60000) + (food2?.avgPrice || 70000) + (poi1?.ticketPrice || 0) + (poi2?.ticketPrice || 0) + 150000,
        items: [
          {
            id: `item-${d}-1`,
            timeSlot: 'Sáng (08:00 - 11:30)',
            title: poi1 ? poi1.name : `Tham quan danh thắng ${prov.name}`,
            activityType: 'Tham quan',
            locationName: poi1 ? poi1.address : prov.name,
            address: poi1 ? poi1.address : prov.name,
            coordinates: poi1 ? poi1.coordinates : prov.coordinates,
            estimatedCost: poi1 ? poi1.ticketPrice : 0,
            duration: '2 - 3 giờ',
            notes: poi1 ? poi1.description : 'Khởi đầu ngày mới nhiều năng lượng.',
            insiderTip: poi1 ? poi1.localTips : 'Nên đến sớm để tránh đông đúc và chụp ảnh đẹp.',
            poiId: poi1?.id
          },
          {
            id: `item-${d}-2`,
            timeSlot: 'Trưa (12:00 - 13:30)',
            title: food1 ? `Ăn trưa: ${food1.dishName}` : 'Thưởng thức ẩm thực bản địa',
            activityType: 'Ăn uống',
            locationName: food1 ? food1.name : `Quán ngon ${prov.name}`,
            address: food1 ? food1.address : prov.name,
            coordinates: food1 ? food1.coordinates : prov.coordinates,
            estimatedCost: food1 ? food1.avgPrice : 65000,
            duration: '1.5 giờ',
            notes: food1 ? food1.description : 'Thưởng thức đặc sản vùng miền.',
            insiderTip: food1 ? `Món tủ nên gọi: ${food1.signatureDish}` : 'Hỏi giá trước khi gọi món đặc biệt.',
            foodId: food1?.id
          },
          {
            id: `item-${d}-3`,
            timeSlot: 'Chiều (14:30 - 17:30)',
            title: poi2 ? poi2.name : `Check-in danh lam thắng cảnh`,
            activityType: 'Check-in & Khám phá',
            locationName: poi2 ? poi2.address : prov.name,
            address: poi2 ? poi2.address : prov.name,
            coordinates: poi2 ? poi2.coordinates : prov.coordinates,
            estimatedCost: poi2 ? poi2.ticketPrice : 0,
            duration: '2 - 3 giờ',
            notes: poi2 ? poi2.description : 'Trải nghiệm không gian văn hóa bản xứ.',
            insiderTip: poi2 ? poi2.localTips : 'Nên mang theo mũ nón và nước uống.',
            poiId: poi2?.id
          },
          {
            id: `item-${d}-4`,
            timeSlot: 'Tối (18:30 - 21:30)',
            title: food2 ? `Ăn tối: ${food2.dishName} & Dạo chợ đêm` : 'Bữa tối đặc sản & Phố đi bộ',
            activityType: 'Ẩm thực & Nightlife',
            locationName: food2 ? food2.name : `Chợ đêm ${prov.name}`,
            address: food2 ? food2.address : prov.name,
            coordinates: food2 ? food2.coordinates : prov.coordinates,
            estimatedCost: food2 ? food2.avgPrice : 80000,
            duration: '2 giờ',
            notes: food2 ? food2.description : 'Khám phá cuộc sống về đêm của người dân địa phương.',
            insiderTip: food2 ? food2.bestTime : 'Thương lượng giá lịch sự khi mua sắm tại chợ đêm.',
            foodId: food2?.id
          }
        ]
      });
    }

    return {
      id: `plan-${Date.now()}`,
      title: `Lịch trình khám phá ${prov.name} ${days} ngày`,
      destination: prov.name,
      provinceId: prov.id,
      durationDays: days,
      travelStyle: travelStyle,
      companion: 'Cặp đôi (Couple)',
      totalBudget: budgetTotal,
      budgetPerPerson: Math.round(budgetTotal / guestsCount),
      peopleCount: guestsCount,
      budgetBreakdown: {
        stay: Math.round(budgetTotal * 0.3),
        food: Math.round(budgetTotal * 0.25),
        transport: Math.round(budgetTotal * 0.2),
        tickets: Math.round(budgetTotal * 0.15),
        contingency: Math.round(budgetTotal * 0.1),
      },
      days: planDays,
      summaryAI: `Lịch trình ${days} ngày tại ${prov.name} được tối ưu hóa cung đường di chuyển liền mạch và chuẩn vị ẩm thực địa phương.`,
      safetyAlerts: [
        `Lưu ý kiểm tra thời tiết ${prov.name} trước khi tham gia các hoạt động ngoài trời.`,
        'Hotline cứu nạn cứu hộ khẩn cấp: 112'
      ],
      createdAt: new Date().toISOString()
    };
  };

  // Plan State
  const [plan, setPlan] = useState<TripPlan>(() => initialGeneratedPlan || generateDefaultPlan(destination, daysCount));

  // Sync if initialPlanParams updates
  useEffect(() => {
    if (initialPlanParams) {
      setDestination(initialPlanParams.destination);
      setDaysCount(initialPlanParams.days);
      setGuestsCount(initialPlanParams.guests);
      if (initialPlanParams.style) {
        setTravelStyle(initialPlanParams.style as any);
      }
      setPlan(initialGeneratedPlan || generateDefaultPlan(initialPlanParams.destination, initialPlanParams.days));
      if (initialGeneratedPlan) setBudgetTotal(initialGeneratedPlan.totalBudget);
      setActiveDay(1);
    }
  }, [initialPlanParams, initialGeneratedPlan]);

  // If pendingAddItem passed from modal or chat, add it to current day!
  useEffect(() => {
    if (pendingAddItem) {
      const isFood = pendingAddItem.itemType === 'food';
      const title = 'dishName' in pendingAddItem ? `${pendingAddItem.dishName} (${pendingAddItem.name})` : pendingAddItem.name;
      const cost = 'ticketPrice' in pendingAddItem && typeof pendingAddItem.ticketPrice === 'number' 
        ? pendingAddItem.ticketPrice 
        : ('avgPrice' in pendingAddItem ? pendingAddItem.avgPrice : 50000);

      const newItem: ItineraryItem = {
        id: `custom-item-${Date.now()}`,
        timeSlot: isFood ? 'Ăn uống (Trưa/Tối)' : 'Khám phá & Check-in',
        title,
        activityType: isFood ? 'Ẩm thực' : 'Tham quan',
        locationName: 'address' in pendingAddItem ? pendingAddItem.address : destination,
        address: 'address' in pendingAddItem ? pendingAddItem.address : destination,
        coordinates: 'coordinates' in pendingAddItem ? pendingAddItem.coordinates : undefined,
        estimatedCost: cost,
        duration: '1.5 - 2 giờ',
        notes: pendingAddItem.description,
        insiderTip: 'localTips' in pendingAddItem ? (pendingAddItem.localTips as string) : 'Trải nghiệm tuyệt vời tại địa phương.',
        poiId: pendingAddItem.itemType === 'poi' ? pendingAddItem.id : undefined,
        foodId: pendingAddItem.itemType === 'food' ? pendingAddItem.id : undefined
      };

      setPlan(prevPlan => {
        const updatedDays = prevPlan.days.map(d => {
          if (d.dayNumber === activeDay) {
            return {
              ...d,
              items: [...d.items, newItem],
              dayCostEstimated: d.dayCostEstimated + cost
            };
          }
          return d;
        });
        return { ...prevPlan, days: updatedDays };
      });

      if (onClearPendingItem) onClearPendingItem();
    }
  }, [pendingAddItem]);

  // Leaflet map reference
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Initialize or update Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    const L = (window as any).L;
    if (!L) return;

    const currentDayPlan = plan.days.find(d => d.dayNumber === activeDay) || plan.days[0];
    const firstCoord = currentDayPlan?.items.find(it => it.coordinates)?.coordinates || targetProvince.coordinates;

    if (!mapRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([firstCoord.lat, firstCoord.lng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);
      mapRef.current = map;
    } else {
      mapRef.current.setView([firstCoord.lat, firstCoord.lng], 13);
    }

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Add markers for current day stops
    const bounds: any[] = [];
    currentDayPlan?.items.forEach((item, index) => {
      if (item.coordinates) {
        const marker = L.marker([item.coordinates.lat, item.coordinates.lng])
          .addTo(mapRef.current)
          .bindPopup(`
            <div style="font-family: 'Be Vietnam Pro', sans-serif; padding: 4px;">
              <strong style="color: #FF385C;">Điểm ${index + 1}: ${item.title}</strong>
              <div style="font-size: 11px; color: #717171; margin-top: 2px;">${item.timeSlot}</div>
              <div style="font-size: 11px; font-weight: bold; margin-top: 2px;">${item.estimatedCost.toLocaleString('vi-VN')} VNĐ</div>
            </div>
          `);
        markersRef.current.push(marker);
        bounds.push([item.coordinates.lat, item.coordinates.lng]);
      }
    });

    if (bounds.length > 1) {
      try {
        mapRef.current.fitBounds(bounds, { padding: [40, 40] });
      } catch (e) {}
    }
  }, [plan, activeDay, targetProvince]);

  // Operations: Move Up / Move Down
  const handleMoveStop = (dayNum: number, index: number, direction: 'up' | 'down') => {
    setPlan(prevPlan => {
      const updatedDays = prevPlan.days.map(d => {
        if (d.dayNumber !== dayNum) return d;
        const items = [...d.items];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= items.length) return d;
        
        // Swap
        const temp = items[index];
        items[index] = items[targetIndex];
        items[targetIndex] = temp;

        return { ...d, items };
      });
      return { ...prevPlan, days: updatedDays };
    });
  };

  // Delete Stop
  const handleDeleteStop = (dayNum: number, index: number) => {
    setPlan(prevPlan => {
      const updatedDays = prevPlan.days.map(d => {
        if (d.dayNumber !== dayNum) return d;
        const items = d.items.filter((_, idx) => idx !== index);
        const newCost = items.reduce((acc, it) => acc + (it.estimatedCost || 0), 0);
        return { ...d, items, dayCostEstimated: newCost };
      });
      return { ...prevPlan, days: updatedDays };
    });
  };

  // Add custom Stop
  const handleAddStopSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStopTitle.trim()) return;

    const newItem: ItineraryItem = {
      id: `custom-added-${Date.now()}`,
      timeSlot: newStopTimeSlot,
      title: newStopTitle,
      activityType: 'Tự chọn',
      locationName: newStopAddress || destination,
      address: newStopAddress || destination,
      coordinates: targetProvince.coordinates,
      estimatedCost: newStopCost,
      duration: '1.5 giờ',
      notes: 'Điểm dừng tự thêm bởi người dùng.',
      insiderTip: 'Kiểm tra giờ mở cửa trước khi tới.'
    };

    setPlan(prevPlan => {
      const updatedDays = prevPlan.days.map(d => {
        if (d.dayNumber === activeDay) {
          return {
            ...d,
            items: [...d.items, newItem],
            dayCostEstimated: d.dayCostEstimated + newStopCost
          };
        }
        return d;
      });
      return { ...prevPlan, days: updatedDays };
    });

    setNewStopTitle('');
    setNewStopAddress('');
    setIsAddStopOpen(false);
  };

  // Regenerate plan with parameters
  const handleRegenerate = () => {
    setPlan(generateDefaultPlan(destination, daysCount));
    setActiveDay(1);
    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch (e) {}
  };

  // AI Refinement logic
  const handleAiRefinement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsModifyingWithAI(true);
    try {
      // Simulate/call AI adjustment
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Tôi đang có lịch trình ${destination} ${daysCount} ngày. Hãy điều chỉnh theo yêu cầu: "${aiPrompt}". Hãy giữ lại các điểm khác và tinh chỉnh thông minh.`,
        })
      });

      if (response.ok) {
        // AI response received - refine plan items
        const lowerPrompt = aiPrompt.toLowerCase();
        setPlan(prevPlan => {
          const updatedDays = prevPlan.days.map(d => {
            if (d.dayNumber === activeDay) {
              const updatedItems = d.items.map(it => {
                if (lowerPrompt.includes('hải sản') && it.activityType.includes('Ăn')) {
                  return {
                    ...it,
                    title: `Thưởng thức hải sản tươi sống tại Năm Đảnh / Bé Mặn`,
                    notes: `Điều chỉnh theo yêu cầu: Bổ sung hải sản tươi sống cân tại bể.`,
                    insiderTip: `Nên hỏi giá trước và yêu cầu vẩy ráo nước khỏi rổ cân.`
                  };
                }
                if (lowerPrompt.includes('chill') || lowerPrompt.includes('cà phê')) {
                  if (it.timeSlot.includes('Chiều')) {
                    return {
                      ...it,
                      title: `Ngắm hoàng hôn & Thưởng thức cà phê view biển`,
                      notes: `Thư giãn, thưởng thức cà phê ngắm cảnh chiều tà.`
                    };
                  }
                }
                return it;
              });
              return { ...d, items: updatedItems };
            }
            return d;
          });
          return { ...prevPlan, days: updatedDays };
        });

        setAiPrompt('');
        setAiRefinementOpen(false);
        try {
          confetti({ particleCount: 40, spread: 50 });
        } catch (e) {}
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsModifyingWithAI(false);
    }
  };

  // Save Plan
  const handleSavePlan = () => {
    localStorage.setItem(`vietgo_plan_${plan.id}`, JSON.stringify(plan));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Get tips for current province
  const provinceTips = ALL_TIPS.filter(t => 
    t.tags.some(tag => destination.toLowerCase().includes(tag)) ||
    t.content.toLowerCase().includes(destination.toLowerCase())
  );

  const currentDayData = plan.days.find(d => d.dayNumber === activeDay) || plan.days[0];

  return (
    <div className="min-h-screen bg-white text-[#222222]">
      {/* 1. Header Toolbar with Trip Parameters */}
      <section className="bg-white border-b border-[#E5E5E5] px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Destination & Key Meta */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#F7F7F7] border border-[#E5E5E5] text-[11px] font-bold text-[#222222] uppercase tracking-wider">
                Lịch trình thông minh
              </span>
              <span className="text-xs text-[#717171]">• AI Tự Động Tối Ưu</span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#222222] tracking-tight">
                Hành trình {destination}
              </h1>
              <span className="text-sm font-semibold text-[#717171]">
                ({daysCount} ngày • {guestsCount} khách)
              </span>
            </div>
          </div>

          {/* Action Buttons: AI Edit, Regenerate, Save */}
          <div className="flex items-center flex-wrap gap-2">
            {/* AI Refine Button */}
            <button
              onClick={() => setAiRefinementOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-[#222222] hover:bg-[#F7F7F7] text-xs font-bold text-[#222222] cursor-pointer transition-colors shadow-2xs"
            >
              <Bot className="w-4 h-4 text-[#FF385C]" />
              <span>AI Tinh chỉnh</span>
            </button>

            {/* Destination Tips toggle */}
            <button
              onClick={() => setShowTips(!showTips)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-colors cursor-pointer ${
                showTips 
                  ? 'bg-[#222222] text-white border-[#222222]' 
                  : 'bg-[#F7F7F7] hover:bg-[#E5E5E5] text-[#222222] border-[#E5E5E5]'
              }`}
            >
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>Mẹo thực chiến ({provinceTips.length || 10})</span>
            </button>

            {/* Save Button */}
            <button
              onClick={handleSavePlan}
              className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#FF385C] hover:bg-[#E00B41] text-white text-xs font-bold cursor-pointer transition-all shadow-sm"
            >
              {isSaved ? <Check className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              <span>{isSaved ? 'Đã lưu!' : 'Lưu lịch trình'}</span>
            </button>
          </div>
        </div>

        {/* Quick Edit Bar */}
        <div className="max-w-7xl mx-auto pt-4 flex flex-wrap items-center gap-3 text-xs border-t border-[#E5E5E5] mt-4">
          <div className="flex items-center gap-1.5 bg-[#F7F7F7] px-3 py-1.5 rounded-xl border border-[#E5E5E5]">
            <MapPin className="w-3.5 h-3.5 text-[#FF385C]" />
            <span className="font-bold">Điểm đến:</span>
            <select
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setPlan(generateDefaultPlan(e.target.value, daysCount));
              }}
              className="bg-transparent font-semibold focus:outline-hidden cursor-pointer"
            >
              {PROVINCES.map(p => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F7F7F7] px-3 py-1.5 rounded-xl border border-[#E5E5E5]">
            <Calendar className="w-3.5 h-3.5 text-[#717171]" />
            <span className="font-bold">Số ngày:</span>
            <select
              value={daysCount}
              onChange={(e) => {
                const d = Number(e.target.value);
                setDaysCount(d);
                setPlan(generateDefaultPlan(destination, d));
              }}
              className="bg-transparent font-semibold focus:outline-hidden cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 7].map(n => (
                <option key={n} value={n}>{n} ngày</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-[#F7F7F7] px-3 py-1.5 rounded-xl border border-[#E5E5E5]">
            <Users className="w-3.5 h-3.5 text-[#717171]" />
            <span className="font-bold">Số khách:</span>
            <select
              value={guestsCount}
              onChange={(e) => setGuestsCount(Number(e.target.value))}
              className="bg-transparent font-semibold focus:outline-hidden cursor-pointer"
            >
              {[...new Set([1, 2, 4, 6, guestsCount])].sort((a, b) => a - b).map(n => (
                <option key={n} value={n}>{n} người</option>
              ))}
            </select>
          </div>

          {/* Mobile view toggle: List vs Map */}
          <div className="lg:hidden ml-auto flex items-center gap-1 bg-[#F7F7F7] p-1 rounded-xl border border-[#E5E5E5]">
            <button
              onClick={() => setMobileView('list')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                mobileView === 'list' ? 'bg-white shadow-2xs text-[#222222]' : 'text-[#717171]'
              }`}
            >
              Lịch trình
            </button>
            <button
              onClick={() => setMobileView('map')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                mobileView === 'map' ? 'bg-white shadow-2xs text-[#222222]' : 'text-[#717171]'
              }`}
            >
              Bản đồ
            </button>
          </div>
        </div>
      </section>

      {/* 2. Destination Survival Tips Accordion */}
      {showTips && (
        <section className="bg-amber-50/70 border-b border-amber-200/80 p-4 sm:px-6 lg:px-8 animate-in fade-in duration-200">
          <div className="max-w-7xl mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Mẹo thực chiến & Cảnh báo an toàn tại {destination}</span>
              </div>
              <button
                onClick={() => setShowTips(false)}
                className="text-xs font-bold text-amber-800 hover:underline"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
                <div className="font-bold text-[#222222]">🌤️ Thời tiết & Thời điểm</div>
                <p className="text-[#717171]">{targetProvince.weatherSummary}</p>
                <div className="text-[11px] text-amber-800 font-semibold pt-1">Mùa đẹp nhất: {targetProvince.bestMonths}</div>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
                <div className="font-bold text-[#222222]">🛵 Di chuyển & Thuê xe máy</div>
                <p className="text-[#717171]">Giá thuê trung bình: {targetProvince.transportation.avgBikeRental}</p>
                <p className="text-[#717171]">Taxi phổ biến: {targetProvince.transportation.avgTaxiRate}</p>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-amber-200 shadow-2xs space-y-1">
                <div className="font-bold text-[#222222]">⚠️ Điều cấm kỵ & Lưu ý văn hóa</div>
                <p className="text-[#717171]">{targetProvince.culturalTaboos[0] || 'Ăn mặc lịch sự khi vào đền chùa.'}</p>
                <div className="text-[11px] text-emerald-700 font-bold pt-1">Hotline CSKH: 1022 / Cứu nạn: 112</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 3. Main Split Screen Layout (Desktop: List 60%, Map 40%) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: Days Tabs & Stops List (lg:col-span-7) */}
          <div className={`lg:col-span-7 space-y-5 ${mobileView === 'map' ? 'hidden lg:block' : 'block'}`}>
            {/* Days Tabs (Day 1, Day 2, Day 3...) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {plan.days.map((day) => (
                <button
                  key={day.dayNumber}
                  onClick={() => setActiveDay(day.dayNumber)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    activeDay === day.dayNumber
                      ? 'bg-[#222222] text-white shadow-xs'
                      : 'bg-[#F7F7F7] hover:bg-[#E5E5E5] text-[#717171] border border-[#E5E5E5]'
                  }`}
                >
                  Ngày {day.dayNumber}
                </button>
              ))}

              <button
                onClick={() => setIsAddStopOpen(true)}
                className="flex items-center gap-1 px-3.5 py-2.5 rounded-2xl border border-dashed border-[#E5E5E5] hover:border-[#222222] text-xs font-bold text-[#717171] hover:text-[#222222] transition-colors shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#FF385C]" />
                <span>+ Thêm điểm dừng</span>
              </button>
            </div>

            {/* Day Theme & Cost Banner */}
            <div className="p-4 rounded-3xl bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold text-[#717171] uppercase tracking-wider">
                  Chủ đề Ngày {activeDay}
                </div>
                <h3 className="text-sm sm:text-base font-extrabold text-[#222222]">
                  {currentDayData?.theme}
                </h3>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] text-[#717171]">Chi phí ước tính</div>
                <div className="text-sm font-black text-[#FF385C]">
                  {currentDayData?.dayCostEstimated.toLocaleString('vi-VN')} VNĐ
                </div>
              </div>
            </div>

            {/* Stops Timeline */}
            <div className="space-y-3">
              {currentDayData?.items.map((stop, index) => (
                <div
                  key={stop.id}
                  className="bg-white rounded-3xl border border-[#E5E5E5] p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-3 group"
                >
                  {/* Top Stop Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Step index badge */}
                      <div className="w-7 h-7 rounded-full bg-[#222222] text-white flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        {index + 1}
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[#FF385C] uppercase tracking-wide">
                            {stop.timeSlot}
                          </span>
                          <span className="text-stone-300">•</span>
                          <span className="text-xs font-medium text-[#717171]">
                            {stop.activityType}
                          </span>
                        </div>
                        <h4 className="text-base font-extrabold text-[#222222] leading-tight">
                          {stop.title}
                        </h4>
                        <div className="text-xs text-[#717171] flex items-center gap-1 pt-0.5">
                          <MapPin className="w-3 h-3 text-[#FF385C] shrink-0" />
                          <span>{stop.locationName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Controls: Up, Down, Delete */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleMoveStop(activeDay, index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg hover:bg-[#F7F7F7] text-[#717171] hover:text-[#222222] disabled:opacity-30 cursor-pointer"
                        title="Di chuyển lên"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleMoveStop(activeDay, index, 'down')}
                        disabled={index === currentDayData.items.length - 1}
                        className="p-1.5 rounded-lg hover:bg-[#F7F7F7] text-[#717171] hover:text-[#222222] disabled:opacity-30 cursor-pointer"
                        title="Di chuyển xuống"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteStop(activeDay, index)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-[#717171] hover:text-rose-600 cursor-pointer ml-1"
                        title="Xóa điểm dừng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Notes & Local Tips */}
                  <p className="text-xs text-[#484848] pl-10 leading-relaxed">
                    {stop.notes}
                  </p>

                  {stop.insiderTip && (
                    <div className="ml-10 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950 flex items-start gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>Mẹo bản địa:</strong> {stop.insiderTip}
                      </div>
                    </div>
                  )}

                  {/* Stop Footer: Estimated cost & Action */}
                  <div className="ml-10 pt-2 border-t border-[#E5E5E5] flex items-center justify-between text-xs">
                    <div className="font-bold text-[#222222]">
                      Chi phí: {stop.estimatedCost > 0 ? `${stop.estimatedCost.toLocaleString('vi-VN')} VNĐ` : 'Miễn phí'}
                    </div>

                    <div className="flex items-center gap-2">
                      {stop.poiId && (
                        <button
                          onClick={() => {
                            const found = targetProvince.pois.find(p => p.id === stop.poiId);
                            if (found) onSelectItem({ itemType: 'poi', ...found });
                          }}
                          className="text-[11px] font-bold text-[#FF385C] hover:underline cursor-pointer"
                        >
                          Xem chi tiết
                        </button>
                      )}
                      {stop.foodId && (
                        <button
                          onClick={() => {
                            const found = targetProvince.foods.find(f => f.id === stop.foodId);
                            if (found) onSelectItem({ itemType: 'food', ...found });
                          }}
                          className="text-[11px] font-bold text-[#FF385C] hover:underline cursor-pointer"
                        >
                          Xem quán
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Leaflet Map (lg:col-span-5) */}
          <div className={`lg:col-span-5 ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
            <div className="sticky top-20 rounded-3xl border border-[#E5E5E5] overflow-hidden shadow-sm bg-white">
              {/* Map Header */}
              <div className="p-3.5 bg-white border-b border-[#E5E5E5] flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#222222]">
                  <MapIcon className="w-4 h-4 text-[#FF385C]" />
                  <span>Bản đồ lộ trình Ngày {activeDay} ({destination})</span>
                </div>
                <span className="text-[11px] text-[#717171]">
                  {currentDayData?.items.length || 0} điểm dừng
                </span>
              </div>

              {/* Map Container */}
              <div 
                ref={mapContainerRef} 
                className="w-full h-[450px] lg:h-[550px] bg-[#F7F7F7]"
              />

              {/* Map footnote */}
              <div className="p-3 bg-[#F7F7F7] text-[11px] text-[#717171] border-t border-[#E5E5E5] flex items-center justify-between">
                <span>Nhấn vào từng ghim để xem tên điểm và thời gian</span>
                <span className="font-bold text-[#222222]">{targetProvince.name}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Refinement Modal */}
      {aiRefinementOpen && (
        <div 
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setAiRefinementOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl border border-[#E5E5E5] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#FF385C]" />
                <h3 className="text-base font-extrabold text-[#222222]">AI Hỏi ngược & Tinh chỉnh lịch trình</h3>
              </div>
              <button 
                onClick={() => setAiRefinementOpen(false)}
                className="p-1 rounded-full text-[#717171] hover:text-[#222222]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#717171]">
              Nhập yêu cầu điều chỉnh bằng ngôn ngữ tự nhiên. AI sẽ tự động phân tích và cập nhật các điểm dừng mà vẫn giữ nguyên khung thời gian tối ưu.
            </p>

            <form onSubmit={handleAiRefinement} className="space-y-3">
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="VD: Đổi bữa tối sang quán hải sản tươi sống giá bình dân, hoặc thêm điểm ngắm hoàng hôn chill chill..."
                rows={3}
                className="w-full p-3 rounded-2xl border border-[#E5E5E5] text-xs sm:text-sm text-[#222222] focus:outline-hidden focus:border-[#222222]"
                autoFocus
              />

              <div className="flex flex-wrap gap-1.5 pt-1 text-xs">
                <span className="text-[#717171]">Gợi ý nhanh:</span>
                {[
                  'Thêm quán hải sản bình dân',
                  'Đổi điểm chiều sang quán cà phê view đẹp',
                  'Lịch trình nhẹ nhàng cho người lớn tuổi',
                  'Tập trung check-in sống ảo'
                ].map((s, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setAiPrompt(s)}
                    className="px-2.5 py-1 rounded-full bg-[#F7F7F7] border border-[#E5E5E5] text-[11px] font-medium text-[#222222] hover:bg-[#E5E5E5] cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAiRefinementOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#717171]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isModifyingWithAI || !aiPrompt.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#FF385C] hover:bg-[#E00B41] text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {isModifyingWithAI ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Đang tinh chỉnh...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Cập nhật lịch trình</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stop Modal */}
      {isAddStopOpen && (
        <div 
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsAddStopOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[#E5E5E5] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <h3 className="text-base font-extrabold text-[#222222]">Thêm điểm dừng mới vào Ngày {activeDay}</h3>
              <button 
                onClick={() => setIsAddStopOpen(false)}
                className="p-1 rounded-full text-[#717171] hover:text-[#222222]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStopSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#222222]">Tên địa điểm / Hoạt động</label>
                <input
                  type="text"
                  value={newStopTitle}
                  onChange={(e) => setNewStopTitle(e.target.value)}
                  placeholder="VD: Cầu Tình Yêu, Chợ Đêm Helio..."
                  className="w-full p-3 rounded-2xl border border-[#E5E5E5] text-xs font-semibold text-[#222222] focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#222222]">Khung giờ</label>
                  <select
                    value={newStopTimeSlot}
                    onChange={(e) => setNewStopTimeSlot(e.target.value)}
                    className="w-full p-2.5 rounded-2xl border border-[#E5E5E5] text-xs font-semibold text-[#222222] focus:outline-hidden"
                  >
                    <option value="Sáng (08:30 - 11:30)">Sáng (08:30 - 11:30)</option>
                    <option value="Trưa (12:00 - 13:30)">Trưa (12:00 - 13:30)</option>
                    <option value="Chiều (14:30 - 17:30)">Chiều (14:30 - 17:30)</option>
                    <option value="Tối (18:30 - 21:30)">Tối (18:30 - 21:30)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#222222]">Chi phí (VNĐ)</label>
                  <input
                    type="number"
                    value={newStopCost}
                    onChange={(e) => setNewStopCost(Number(e.target.value))}
                    step={10000}
                    className="w-full p-2.5 rounded-2xl border border-[#E5E5E5] text-xs font-semibold text-[#222222] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#222222]">Địa chỉ / Khu vực</label>
                <input
                  type="text"
                  value={newStopAddress}
                  onChange={(e) => setNewStopAddress(e.target.value)}
                  placeholder={`Quận Sơn Trà, ${destination}...`}
                  className="w-full p-2.5 rounded-2xl border border-[#E5E5E5] text-xs font-semibold text-[#222222] focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddStopOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5E5E5] text-xs font-bold text-[#717171]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#FF385C] hover:bg-[#E00B41] text-white text-xs font-bold transition-colors shadow-sm"
                >
                  Thêm vào ngày {activeDay}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
