import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  MapPin, 
  Sparkles, 
  Search, 
  ShieldCheck, 
  Tag, 
  DollarSign, 
  Calendar, 
  Check, 
  Flame, 
  Award,
  ChevronRight
} from 'lucide-react';
import { PROVINCES, searchAllFoods } from '@db/vietnamData';
import { FoodSpot } from '@db/types';

interface FoodDirectoryProps {
  onOpenBooking: (item: { name: string; type: 'table' | 'ticket'; price?: number }) => void;
  onNavigateTab: (tab: string, extraData?: any) => void;
}

export const FoodDirectory: React.FC<FoodDirectoryProps> = ({
  onOpenBooking,
  onNavigateTab,
}) => {
  const [selectedProvinceId, setSelectedProvinceId] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'mon_chinh' | 'an_vat' | 'ca_phe' | 'dac_san'>('all');
  const [onlyLocalFavorites, setOnlyLocalFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all foods or filter by province
  const allFoods: (FoodSpot & { provinceName: string })[] = [];
  PROVINCES.forEach((p) => {
    p.foods.forEach((f) => {
      allFoods.push({ ...f, provinceName: p.name });
    });
  });

  const filteredFoods = allFoods.filter((f) => {
    if (selectedProvinceId !== 'all') {
      const p = PROVINCES.find((prov) => prov.id === selectedProvinceId);
      if (p && f.provinceName !== p.name) return false;
    }
    if (selectedCategory !== 'all' && f.category !== selectedCategory) return false;
    if (onlyLocalFavorites && !f.isLocalFavorite) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        f.dishName.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.signatureDish.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-stone-900 to-amber-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-bold">
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Danh Bạ Ẩm Thực Bản Địa Chuẩn Vị</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            Ăn Chuẩn Vị Bản Xứ — Không Lo Chặt Chém
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Tuyển tập các quán ăn được thẩm định bởi người dân bản xứ và thuật toán VietGo AI, phân biệt rõ giữa quán khách du lịch và quán quen lâu năm của cư dân địa phương.
          </p>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Province Filter */}
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-600" />
            <select
              value={selectedProvinceId}
              onChange={(e) => setSelectedProvinceId(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-hidden"
            >
              <option value="all">Tất cả Tỉnh/Thành</option>
              {PROVINCES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.region})
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="flex-1 min-w-[220px] max-w-md relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm món ăn (phở, bún chả, mì quảng, lẩu bò...)"
              className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
          </div>

          {/* Local Favorites Toggle Button */}
          <button
            onClick={() => setOnlyLocalFavorites(!onlyLocalFavorites)}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
              onlyLocalFavorites
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Chỉ quán chuẩn bản địa 🛡️</span>
          </button>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'Tất cả danh mục' },
            { id: 'mon_chinh', label: '🍲 Món chính & Bữa cơm' },
            { id: 'an_vat', label: '🍢 Ăn vặt & Phố đêm' },
            { id: 'ca_phe', label: '☕ Cà phê & Tráng miệng' },
            { id: 'dac_san', label: '🎁 Đặc sản mang về' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Foods Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFoods.map((food) => (
          <div
            key={food.id}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col group"
          >
            {/* Image & Badges */}
            <div className="relative h-48 overflow-hidden bg-stone-100">
              <img
                src={food.imageUrl}
                alt={food.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 rounded-md bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-bold">
                  {food.provinceName}
                </span>
                {food.isLocalFavorite && (
                  <span className="px-2.5 py-1 rounded-md bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Quán chuẩn bản địa</span>
                  </span>
                )}
              </div>

              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-md text-amber-800 text-xs font-extrabold shadow-sm">
                {food.priceRange}
              </div>
            </div>

            {/* Content Body */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-extrabold text-base text-stone-900 group-hover:text-amber-700 transition-colors">
                    {food.dishName}
                  </h3>
                  <span className="text-xs text-stone-500 font-medium">★ {food.rating} ({food.reviewCount}+ đánh giá)</span>
                </div>

                <p className="text-xs font-bold text-stone-700 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-500" />
                  <span>{food.name}</span>
                </p>

                <p className="text-xs text-stone-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                  <span className="truncate">{food.address}</span>
                </p>

                <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                  {food.description}
                </p>

                {/* Best Time */}
                {food.bestTime && (
                  <div className="text-[11px] text-stone-500 bg-stone-50 p-2 rounded-lg border border-stone-100 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-stone-400" />
                    <span>Khung giờ lý tưởng: <strong className="text-stone-700">{food.bestTime}</strong></span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <button
                  onClick={() => onNavigateTab('map', { lat: food.coordinates.lat, lng: food.coordinates.lng })}
                  className="text-xs text-stone-600 hover:text-stone-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>Xem trên bản đồ</span>
                </button>

                <button
                  onClick={() => onOpenBooking({ name: `${food.name} (${food.dishName})`, type: 'table', price: food.avgPrice })}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs cursor-pointer transition-colors"
                >
                  Đặt bàn trước
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
