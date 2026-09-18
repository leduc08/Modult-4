import React, { useState, useMemo } from 'react';
import { 
  UtensilsCrossed, 
  Compass, 
  MapPin, 
  Search, 
  SlidersHorizontal, 
  Heart, 
  Star, 
  Clock, 
  Calendar, 
  Sparkles, 
  Ticket, 
  CheckCircle2, 
  Coffee, 
  ShieldCheck, 
  Info,
  ChevronRight,
  ExternalLink,
  Gift,
  Plane,
  Package
} from 'lucide-react';
import { FoodSpot, Festival, Souvenir } from '../types';
import { PROVINCES } from '../data/vietnamData';

interface ExperiencesHubProps {
  onOpenBooking: (item: { name: string; type: 'table' | 'ticket'; price?: number }) => void;
  onNavigateTab: (tab: string, extraData?: any) => void;
}

export const ExperiencesHub: React.FC<ExperiencesHubProps> = ({
  onOpenBooking,
  onNavigateTab
}) => {
  // Category tabs in Airbnb style
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [onlyLocalFavorite, setOnlyLocalFavorite] = useState(false);
  const [onlyMustTry, setOnlyMustTry] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);

  // Collect all food spots & festivals with province name
  const allExperiences = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'food' | 'festival' | 'souvenir';
      title: string;
      subtitle: string;
      categoryTag: string;
      provinceId: string;
      provinceName: string;
      priceText: string;
      priceNum?: number;
      rating: number;
      reviewCount: number;
      imageUrl: string;
      isMustTry: boolean;
      isLocalFavorite?: boolean;
      description: string;
      highlights?: string[];
      details?: string;
      originalItem: FoodSpot | Festival | Souvenir;
    }> = [];

    PROVINCES.forEach(province => {
      // Foods
      province.foods.forEach(f => {
        list.push({
          id: `food-${f.id}`,
          type: 'food',
          title: f.dishName,
          subtitle: `${f.name} • ${f.address}`,
          categoryTag: f.category,
          provinceId: province.id,
          provinceName: province.name,
          priceText: f.priceRange,
          priceNum: f.avgPrice,
          rating: f.rating,
          reviewCount: f.reviewCount,
          imageUrl: f.imageUrl,
          isMustTry: f.isMustTry,
          isLocalFavorite: f.isLocalFavorite,
          description: f.description,
          details: `Giờ lý tưởng: ${f.bestTime} • Món tủ: ${f.signatureDish}`,
          originalItem: f
        });
      });

      // Souvenirs & OCOP Gifts
      province.souvenirs.forEach(s => {
        list.push({
          id: `souvenir-${s.id}`,
          type: 'souvenir',
          title: s.name,
          subtitle: `Đặc sản ${province.name} • Hạn dùng: ${s.shelfLife}`,
          categoryTag: s.isOCOP ? `Đặc sản OCOP ⭐⭐⭐` : 'Quà tặng truyền thống',
          provinceId: province.id,
          provinceName: province.name,
          priceText: s.standardPrice,
          priceNum: parseInt(s.standardPrice.replace(/\D/g, '')) || 90000,
          rating: 4.9,
          reviewCount: 110,
          imageUrl: s.imageUrl,
          isMustTry: true,
          isLocalFavorite: true,
          description: `Đặc sản làm quà tiêu biểu từ ${province.name}. Nơi mua uy tín: ${s.trustedAddresses.join(', ')}.`,
          highlights: s.trustedAddresses,
          details: `Quy định bay: ${s.flightRule} (${s.flightNote})`,
          originalItem: s
        });
      });

      // Festivals
      province.festivals.forEach(fest => {
        list.push({
          id: `fest-${fest.id}`,
          type: 'festival',
          title: fest.name,
          subtitle: `Dương lịch: ${fest.solarDate} (Âm lịch: ${fest.lunarDate})`,
          categoryTag: `Lễ hội ${fest.scale}`,
          provinceId: province.id,
          provinceName: fest.provinceName || province.name,
          priceText: fest.ticketPrice === 0 ? 'Miễn phí vé vào' : `Vé từ ${fest.ticketPrice.toLocaleString('vi-VN')} ₫`,
          priceNum: fest.ticketPrice,
          rating: 4.9,
          reviewCount: 95,
          imageUrl: fest.imageUrl,
          isMustTry: fest.scale === 'Quốc gia',
          isLocalFavorite: true,
          description: fest.description,
          highlights: fest.highlights,
          details: `Quy tắc & Trang phục: ${fest.dressCode} • ${fest.etiquette}`,
          originalItem: fest
        });
      });
    });

    return list;
  }, []);

  // Filter logic
  const filteredExperiences = useMemo(() => {
    return allExperiences.filter(item => {
      // Category filter
      if (selectedCategory === 'food' && item.type !== 'food') return false;
      if (selectedCategory === 'souvenir' && item.type !== 'souvenir') return false;
      if (selectedCategory === 'festival' && item.type !== 'festival') return false;
      if (selectedCategory === 'local_fav' && !item.isLocalFavorite) return false;
      if (selectedCategory === 'must_try' && !item.isMustTry) return false;

      // Province filter
      if (selectedProvince !== 'all' && item.provinceId !== selectedProvince) return false;

      // Local favorite toggle
      if (onlyLocalFavorite && !item.isLocalFavorite) return false;

      // Must try toggle
      if (onlyMustTry && !item.isMustTry) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.provinceName.toLowerCase().includes(q) ||
          item.categoryTag.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [allExperiences, selectedCategory, selectedProvince, onlyLocalFavorite, onlyMustTry, searchQuery]);

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const categories = [
    { id: 'all', label: 'Tất cả trải nghiệm', icon: Sparkles },
    { id: 'food', label: 'Ẩm thực chuẩn vị', icon: UtensilsCrossed },
    { id: 'souvenir', label: 'Quà tặng & Đặc sản OCOP', icon: Gift },
    { id: 'festival', label: 'Lễ hội & Văn hóa', icon: Compass },
    { id: 'local_fav', label: 'Quán ruột dân bản địa', icon: ShieldCheck },
    { id: 'must_try', label: 'Trải nghiệm phải thử', icon: Star },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Airbnb Header & Slogan */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight flex items-center gap-2">
          <span>Trải Nghiệm Ẩm Thực & Văn Hóa Bản Địa</span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-[#FF385C]/10 text-[#FF385C] font-extrabold uppercase tracking-wide">
            Airbnb Style
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-stone-500">
          Khám phá những hương vị độc bản, hàng quán gia truyền và lễ hội truyền thống chuẩn hóa từ người dân địa phương.
        </p>
      </div>

      {/* Airbnb-style Floating Search & Filter Pill Bar */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="w-full md:flex-1 relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo món ăn, lễ hội, tên quán hoặc tỉnh thành (VD: Phở Bát Đàn, Hội An, Lễ hội Chùa Hương...)"
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:border-[#FF385C] focus:bg-white transition-all"
            />
          </div>

          {/* Province Dropdown */}
          <div className="w-full md:w-64">
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-2xl text-xs sm:text-sm font-bold text-stone-800 focus:outline-hidden cursor-pointer"
            >
              <option value="all">📍 Toàn bộ Tỉnh thành (34+)</option>
              {PROVINCES.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.region})</option>
              ))}
            </select>
          </div>

          {/* Quick Filter Toggles */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setOnlyLocalFavorite(!onlyLocalFavorite)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                onlyLocalFavorite
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Dân bản địa khuyên</span>
            </button>
            <button
              onClick={() => setOnlyMustTry(!onlyMustTry)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                onlyMustTry
                  ? 'bg-[#FF385C] text-white border-[#FF385C] shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span>Phải thử</span>
            </button>
          </div>
        </div>

        {/* Airbnb Iconic Category Icons Scrollbar */}
        <div className="flex items-center gap-6 overflow-x-auto pt-2 border-t border-stone-100 scrollbar-none pb-1">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-center gap-1.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap group ${
                  isSelected
                    ? 'text-stone-900 border-b-2 border-stone-900 pb-2'
                    : 'text-stone-400 hover:text-stone-700'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                  isSelected ? 'text-[#FF385C]' : 'text-stone-400'
                }`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-stone-500 px-1">
        <span>
          Hiển thị <strong>{filteredExperiences.length}</strong> món ngon, quà tặng OCOP & lễ hội văn hóa
        </span>
        {wishlist.length > 0 && (
          <span className="text-[#FF385C] font-bold">
            ❤️ Đã lưu {wishlist.length} mục yêu thích
          </span>
        )}
      </div>

      {/* Airbnb Experience Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredExperiences.map(item => {
          const isLiked = wishlist.includes(item.id);
          const isFood = item.type === 'food';
          const isSouvenir = item.type === 'souvenir';

          return (
            <div
              key={item.id}
              className="group bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col cursor-pointer"
              onClick={() => {
                if (isFood) {
                  onOpenBooking({
                    name: item.title,
                    type: 'table',
                    price: item.priceNum
                  });
                } else {
                  onOpenBooking({
                    name: isSouvenir ? `Đặc sản quà tặng: ${item.title}` : item.title,
                    type: 'ticket',
                    price: item.priceNum
                  });
                }
              }}
            >
              {/* Image Container with Wishlist Heart */}
              <div className="relative aspect-[4/3] overflow-hidden bg-stone-100">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />

                {/* Wishlist Heart Button */}
                <button
                  type="button"
                  onClick={(e) => toggleWishlist(item.id, e)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-stone-700 transition-transform active:scale-90 shadow-sm cursor-pointer"
                  title="Lưu vào danh sách yêu thích"
                >
                  <Heart className={`w-4 h-4 ${isLiked ? 'fill-[#FF385C] text-[#FF385C]' : 'text-stone-700'}`} />
                </button>

                {/* Badge Pills on Image */}
                <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                    {item.provinceName}
                  </span>
                  {isSouvenir && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1">
                      <Gift className="w-2.5 h-2.5" />
                      <span>Quà Bản Địa</span>
                    </span>
                  )}
                  {item.isMustTry && !isSouvenir && (
                    <span className="px-2 py-0.5 rounded-full bg-[#FF385C] text-white text-[10px] font-bold">
                      ★ Phải thử
                    </span>
                  )}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  {/* Category & Rating */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-500 uppercase text-[10px] tracking-wider">
                      {item.categoryTag}
                    </span>
                    <div className="flex items-center gap-1 font-bold text-stone-900">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{item.rating}</span>
                      <span className="text-stone-400 font-normal">({item.reviewCount})</span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-base text-stone-900 group-hover:text-[#FF385C] transition-colors line-clamp-1">
                    {item.title}
                  </h3>

                  {/* Subtitle / Location */}
                  <p className="text-xs text-stone-500 line-clamp-1">
                    {item.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Souvenir Flight Rule Alert Pill */}
                  {isSouvenir && item.details && (
                    <div className="mt-1 bg-sky-50 rounded-xl p-2 border border-sky-200/80 flex items-start gap-1.5 text-[10.5px] text-sky-900 leading-snug">
                      <Plane className="w-3 h-3 text-sky-600 shrink-0 mt-0.5" />
                      <span>{item.details}</span>
                    </div>
                  )}
                </div>

                {/* Price & Action Row */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-extrabold text-stone-900">
                      {item.priceText}
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {isFood 
                        ? 'Giá chuẩn bản địa' 
                        : isSouvenir 
                          ? 'Giá niêm yết OCOP' 
                          : 'Giá vé chính thức'}
                    </div>
                  </div>

                  {/* Booking CTA */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isFood) {
                        onOpenBooking({
                          name: item.title,
                          type: 'table',
                          price: item.priceNum
                        });
                      } else {
                        onOpenBooking({
                          name: isSouvenir ? `Đặc sản quà tặng: ${item.title}` : item.title,
                          type: 'ticket',
                          price: item.priceNum
                        });
                      }
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-transform active:scale-95 shadow-xs cursor-pointer ${
                      isSouvenir 
                        ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                        : 'bg-[#FF385C] hover:bg-[#E00B41] text-white'
                    }`}
                  >
                    {isFood ? 'Đặt bàn' : isSouvenir ? 'Đặt mua quà' : 'Đặt vé'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredExperiences.length === 0 && (
        <div className="text-center py-16 bg-stone-50 rounded-3xl border border-stone-200/80 space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-200 text-stone-500 flex items-center justify-center mx-auto text-xl font-bold">
            🔍
          </div>
          <h3 className="font-bold text-base text-stone-800">Không tìm thấy trải nghiệm phù hợp</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn tỉnh thành khác để khám phá ẩm thực và lễ hội.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedProvince('all');
              setOnlyLocalFavorite(false);
              setOnlyMustTry(false);
            }}
            className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};
