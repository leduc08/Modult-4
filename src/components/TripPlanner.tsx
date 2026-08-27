import React, { useState } from 'react';
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
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TripPlan, TravelStyle, CompanionType } from '../types';
import { PROVINCES } from '../data/vietnamData';

interface TripPlannerProps {
  onNavigateTab: (tab: string, extraData?: any) => void;
  onOpenBooking: (item: { name: string; type: 'table' | 'ticket'; price?: number }) => void;
}

export const TripPlanner: React.FC<TripPlannerProps> = ({
  onNavigateTab,
  onOpenBooking
}) => {
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

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/plan-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          days,
          budget,
          companions: companion,
          style: travelStyle,
          peopleCount
        })
      });

      if (!res.ok) throw new Error('Không thể tạo lịch trình');

      const data: TripPlan = await res.json();
      setGeneratedPlan(data);
      setActiveDayTab(1);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi tạo lịch trình. Vui lòng thử lại!');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModifyPlan = async () => {
    if (!modifyPrompt.trim() || !generatedPlan || isModifying) return;
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

      if (!res.ok) throw new Error('Lỗi chỉnh sửa lịch trình');

      const updatedData: TripPlan = await res.json();
      setGeneratedPlan(updatedData);
      setModifyPrompt('');
    } catch (err) {
      console.error(err);
      alert('Không thể áp dụng chỉnh sửa lúc này. Vui lòng thử lại!');
    } finally {
      setIsModifying(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-red-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg">
        <div className="absolute right-0 top-0 w-80 h-full opacity-10 pointer-events-none flex items-center justify-center">
          <Sparkles className="w-72 h-72 text-red-500" />
        </div>

        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>AI Trip & Budget Engine (Tự cân đối trong 10s)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            Lập Lịch Trình Du Lịch Việt Nam Thông Minh
          </h1>
          <p className="text-sm text-stone-300 leading-relaxed">
            AI tự động tính toán khoảng cách địa lý giữa các điểm (không bị đi vòng), kiểm tra giờ mở cửa, phân bổ thời gian ăn nghỉ hợp lý và chia ngân sách theo tỷ lệ vàng.
          </p>
        </div>
      </div>

      {/* Main Grid: Input Wizard on Left (or top), Generated Itinerary on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Step-by-Step Intake Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h2 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-red-600" />
              <span>Interactive AI Intake</span>
            </h2>
            <span className="text-xs text-stone-500 font-medium">Bước 1/3: Cá nhân hóa</span>
          </div>

          {/* 1. Destination */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-500" />
              <span>Điểm đến tại Việt Nam</span>
            </label>
            <select
              id="destination-select"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-semibold text-stone-800 focus:ring-2 focus:ring-red-500 focus:outline-hidden"
            >
              {PROVINCES.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.region}) — {p.tagline.split('—')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Duration & People */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-500" />
                <span>Số ngày</span>
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      days === d
                        ? 'bg-red-600 text-white border-red-600 shadow-xs'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {d}N
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-stone-500" />
                <span>Số người</span>
              </label>
              <select
                value={peopleCount}
                onChange={(e) => setPeopleCount(Number(e.target.value))}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-hidden"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                  <option key={n} value={n}>{n} người</option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. Budget */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tổng ngân sách dự kiến</span>
              </label>
              <span className="font-extrabold text-red-600 text-sm">
                {budget.toLocaleString()} VNĐ
              </span>
            </div>
            <input
              type="range"
              min={1000000}
              max={30000000}
              step={500000}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="w-full accent-red-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-medium">
              <span>1 triệu (Tiết kiệm)</span>
              <span>10 triệu (Thoải mái)</span>
              <span>30 triệu (Luxury)</span>
            </div>
          </div>

          {/* 4. Companions */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Thành phần đoàn</label>
            <div className="grid grid-cols-2 gap-2">
              {companionOptions.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCompanion(c)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold text-left border transition-all cursor-pointer ${
                    companion === c
                      ? 'bg-red-50 text-red-700 border-red-300 ring-1 ring-red-400'
                      : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Travel Style */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-stone-600">Phong cách chuyến đi</label>
            <div className="grid grid-cols-1 gap-2">
              {styleOptions.map((st) => {
                const Icon = st.icon;
                const isSelected = travelStyle === st.label;
                return (
                  <button
                    key={st.label}
                    type="button"
                    onClick={() => setTravelStyle(st.label)}
                    className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-red-50/80 border-red-300 text-stone-900 shadow-2xs'
                        : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-red-600 text-white' : 'bg-stone-100 text-stone-600'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs">{st.label}</div>
                      <div className="text-[11px] text-stone-500 truncate">{st.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <button
            id="generate-plan-submit-btn"
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white font-extrabold rounded-xl shadow-md shadow-red-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>AI đang tính toán cung đường & tối ưu chi phí...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Sinh Lịch Trình Tự Động (10s)</span>
              </>
            )}
          </button>
        </div>

        {/* Generated Timeline & Golden Ratio Budget Display */}
        <div className="lg:col-span-7 space-y-6">
          {generatedPlan ? (
            <div className="space-y-6">
              {/* Trip Overview Card */}
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-xs font-bold">
                        {generatedPlan.durationDays} Ngày {generatedPlan.durationDays - 1 > 0 ? `${generatedPlan.durationDays - 1} Đêm` : ''}
                      </span>
                      <span className="text-xs text-stone-500 font-medium">• {generatedPlan.companion}</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-stone-900 mt-1">{generatedPlan.title}</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigateTab('map', { provinceName: generatedPlan.destination })}
                      className="px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      <span>Xem bản đồ tuyến</span>
                    </button>
                  </div>
                </div>

                {/* AI Summary note */}
                <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3.5 rounded-xl border border-stone-200/60">
                  <span className="font-bold text-stone-800">💡 Đánh giá của AI: </span>
                  {generatedPlan.summaryAI}
                </p>

                {/* Golden Ratio Budget Visualizer */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-stone-800">Cơ cấu ngân sách Tỷ lệ vàng:</span>
                    <span className="text-stone-500 font-medium">Tổng: {generatedPlan.totalBudget.toLocaleString()}đ ({generatedPlan.budgetPerPerson.toLocaleString()}đ/người)</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="h-3 rounded-full bg-stone-100 flex overflow-hidden">
                    <div title="Lưu trú (30%)" style={{ width: '30%' }} className="bg-indigo-500"></div>
                    <div title="Ăn uống (25%)" style={{ width: '25%' }} className="bg-amber-500"></div>
                    <div title="Di chuyển (20%)" style={{ width: '20%' }} className="bg-emerald-500"></div>
                    <div title="Vé & Trải nghiệm (15%)" style={{ width: '15%' }} className="bg-purple-500"></div>
                    <div title="Dự phòng / Mua sắm (10%)" style={{ width: '10%' }} className="bg-rose-400"></div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-[11px] pt-1">
                    <div className="flex items-center gap-1 text-stone-600">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      <span>Khách sạn (30%)</span>
                    </div>
                    <div className="flex items-center gap-1 text-stone-600">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span>Ăn uống (25%)</span>
                    </div>
                    <div className="flex items-center gap-1 text-stone-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>Di chuyển (20%)</span>
                    </div>
                    <div className="flex items-center gap-1 text-stone-600">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      <span>Vé & Tour (15%)</span>
                    </div>
                    <div className="flex items-center gap-1 text-stone-600">
                      <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                      <span>Dự phòng (10%)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Day Tabs */}
              <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                {generatedPlan.days.map((day) => (
                  <button
                    key={day.dayNumber}
                    onClick={() => setActiveDayTab(day.dayNumber)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      activeDayTab === day.dayNumber
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    Ngày {day.dayNumber}
                  </button>
                ))}
              </div>

              {/* Timeline Items of Active Day */}
              {generatedPlan.days
                .filter((d) => d.dayNumber === activeDayTab)
                .map((day) => (
                  <div key={day.dayNumber} className="space-y-4">
                    <div className="flex items-center justify-between bg-red-50/60 border border-red-100 p-3 rounded-xl">
                      <div className="font-bold text-xs text-red-950">
                        Chủ đề ngày {day.dayNumber}: {day.theme}
                      </div>
                      <div className="text-xs font-semibold text-red-700">
                        Dự tính: ~{day.dayCostEstimated.toLocaleString()}đ
                      </div>
                    </div>

                    <div className="space-y-3 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-stone-200">
                      {day.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="relative pl-10 bg-white border border-stone-200/90 rounded-2xl p-4 shadow-2xs hover:border-red-300 transition-all space-y-2 group"
                        >
                          {/* Timeline Dot */}
                          <div className="absolute left-2.5 top-5 w-3.5 h-3.5 rounded-full bg-white border-3 border-red-600 shadow-2xs"></div>

                          <div className="flex flex-wrap items-center justify-between gap-1">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                              {item.timeSlot}
                            </span>
                            <span className="text-xs font-extrabold text-stone-900">
                              {item.estimatedCost > 0 ? `${item.estimatedCost.toLocaleString()} VNĐ` : 'Miễn phí'}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-sm text-stone-900 group-hover:text-red-600 transition-colors">
                            {item.title}
                          </h4>

                          {item.locationName && (
                            <div className="text-xs text-stone-600 flex items-center gap-1 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-stone-400" />
                              <span>{item.locationName}</span>
                              {item.address && <span className="text-stone-400">({item.address})</span>}
                            </div>
                          )}

                          <p className="text-xs text-stone-600 leading-relaxed">{item.notes}</p>

                          {item.insiderTip && (
                            <div className="bg-amber-50/90 border border-amber-200/80 rounded-lg p-2 text-[11px] text-amber-900 flex items-start gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Mẹo từ AI: </span>
                                <span>{item.insiderTip}</span>
                              </div>
                            </div>
                          )}

                          <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                            <span className="text-stone-400 font-medium">Thời lượng: ~{item.duration}</span>
                            <button
                              onClick={() => onOpenBooking({ name: item.locationName || item.title, type: item.activityType === 'an_uong' ? 'table' : 'ticket', price: item.estimatedCost })}
                              className="text-red-600 font-bold hover:underline cursor-pointer"
                            >
                              {item.activityType === 'an_uong' ? 'Đặt bàn trước' : 'Đặt vé / Giữ chỗ'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

              {/* Interactive Live Modification ("AI hỏi ngược & chỉnh sửa tức thì") */}
              <div className="bg-stone-900 text-white rounded-2xl p-5 space-y-3 shadow-md">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <h4 className="font-bold text-sm">Chỉnh sửa tức thì với AI (Interactive Edit)</h4>
                </div>
                <p className="text-xs text-stone-300">
                  Bạn muốn thay đổi điểm đến, đổi quán ăn chay, thêm thời gian nghỉ ngơi hay đổi quán cà phê view biển? Hãy nhập yêu cầu bên dưới:
                </p>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={modifyPrompt}
                    onChange={(e) => setModifyPrompt(e.target.value)}
                    placeholder="VD: Đổi bữa trưa ngày 2 thành món chay thanh đạm / Bỏ bớt 1 bảo tàng để đi cafe..."
                    className="flex-1 px-3.5 py-2.5 bg-stone-800 border border-stone-700 rounded-xl text-xs text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-red-500"
                  />
                  <button
                    onClick={handleModifyPlan}
                    disabled={!modifyPrompt.trim() || isModifying}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-stone-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap"
                  >
                    {isModifying ? 'Đang chỉnh sửa...' : 'Áp dụng ngay'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
                <Compass className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-stone-900 text-base">Chưa có lịch trình được sinh</h3>
                <p className="text-xs text-stone-500 max-w-sm mx-auto">
                  Hãy chọn điểm đến, số ngày và phong cách du lịch ở cột bên trái. VietGo AI sẽ tạo toàn bộ lịch trình tối ưu trong 10 giây!
                </p>
              </div>
              <button
                onClick={handleGeneratePlan}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Tạo lịch trình mẫu (Đà Nẵng 3N2Đ)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
