import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  MapPin, 
  Ticket, 
  ShieldCheck, 
  ChevronRight, 
  Clock, 
  DollarSign, 
  Info,
  QrCode
} from 'lucide-react';
import { PROVINCES } from '@db/vietnamData';
import { FestivalEvent } from '@db/types';

interface FestivalsEventsProps {
  onOpenBooking: (item: { name: string; type: 'table' | 'ticket'; price?: number }) => void;
  onNavigateTab: (tab: string, extraData?: any) => void;
}

export const FestivalsEvents: React.FC<FestivalsEventsProps> = ({
  onOpenBooking,
  onNavigateTab
}) => {
  const [selectedRegion, setSelectedRegion] = useState<'all' | 'bac' | 'trung' | 'nam'>('all');

  // Collect all festivals
  const allEvents: (FestivalEvent & { provinceName: string })[] = [];
  PROVINCES.forEach(p => {
    if (p.festivals) {
      p.festivals.forEach(f => {
        allEvents.push({ ...f, provinceName: p.name });
      });
    }
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-stone-900 to-red-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Lễ Hội Truyền Thống & Show Di Sản Văn Hóa</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            Hòa Mình Vào Nhịp Đập Lễ Hội Việt Nam
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Tra cứu lịch diễn ra theo cả Dương lịch & Âm lịch, quy chuẩn trang phục khi tham gia nghi lễ linh thiêng, cùng hệ thống giữ vé trực tuyến show thực cảnh triệu đô.
          </p>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {allEvents.map((evt) => (
          <div
            key={evt.id}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between group"
          >
            {/* Header / Image banner */}
            <div className="relative h-52 bg-stone-900 overflow-hidden">
              <img
                src={evt.imageUrl}
                alt={evt.name}
                className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-black/20"></div>

              <div className="absolute top-3 left-3 flex gap-2">
                <span className="px-2.5 py-1 rounded-md bg-purple-600/90 text-white text-[10px] font-bold">
                  {evt.provinceName}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-stone-900/80 text-amber-300 text-[10px] font-bold">
                  {evt.isAnnual ? 'Lễ hội thường niên' : 'Show biểu diễn'}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 text-white">
                <h3 className="font-extrabold text-base leading-snug drop-shadow-sm">
                  {evt.name}
                </h3>
                <p className="text-xs text-purple-200 flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Dương lịch: {evt.solarDate} {evt.lunarDate && `(Âm lịch: ${evt.lunarDate})`}</span>
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <p className="text-xs text-stone-600 leading-relaxed">
                  {evt.description}
                </p>

                {/* Cultural Etiquette box */}
                <div className="bg-purple-50/70 border border-purple-200/60 rounded-xl p-3 text-xs text-purple-950 space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                    <span>Quy tắc văn hóa & Trang phục ({evt.dressCode}):</span>
                  </div>
                  <p className="text-[11px] text-purple-900 leading-normal">{evt.etiquette}</p>
                </div>
              </div>

              {/* Action bar */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 font-medium">Giá vé tham khảo:</span>
                  <div className="text-xs font-extrabold text-stone-900">
                    {evt.ticketPrice === 0 ? 'Vào cửa tự do' : `Từ ${evt.ticketPrice.toLocaleString()} VNĐ`}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigateTab('map', { lat: evt.coordinates?.lat, lng: evt.coordinates?.lng })}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-500" />
                    <span className="hidden sm:inline">Bản đồ</span>
                  </button>

                  <button
                    onClick={() => onOpenBooking({ name: evt.name, type: 'ticket', price: evt.ticketPrice })}
                    className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Giữ vé điện tử</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
