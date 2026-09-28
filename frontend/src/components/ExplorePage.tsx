import React, { useState, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Navigation,
  Heart, 
  SlidersHorizontal, 
  Palmtree, 
  Trees, 
  Landmark, 
  Utensils, 
  PartyPopper, 
  Layers, 
  X
} from 'lucide-react';
import { PROVINCES } from '../data/vietnamData';
import { POI, FoodSpot, Festival } from '../types';
import { DetailItem } from './ItemDetailModal';

interface ExplorePageProps {
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onSelectItem: (item: DetailItem) => void;
  onQuickPlanTrip: (params: { destination: string; days: number; guests: number }) => void;
  onNavigateToNearby?: () => void;
}

const ExploreImage: React.FC<{ src: string; alt: string; className: string }> = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="h-full w-full bg-rose-50">
      {!loaded && !failed && <div className="absolute inset-0 animate-pulse bg-rose-50" role="status" aria-label={`Đang tải ảnh ${alt}`} />}
      {failed ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-rose-50 px-4 text-center text-rose-700">
          <MapPin className="h-6 w-6" aria-hidden="true" />
          <span className="text-xs font-semibold">Chưa có ảnh phù hợp cho {alt}</span>
        </div>
      ) : (
        <img src={src} alt={alt} className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'}`} loading="lazy" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
      )}
    </div>
  );
};

export const ExplorePage: React.FC<ExplorePageProps> = ({
  wishlist,
  onToggleWishlist,
  onSelectItem,
  onQuickPlanTrip,
  onNavigateToNearby,
}) => {
  // Search Bar States
  const [destinationQuery, setDestinationQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false); // Mobile search modal

  // Category filter: 'all' | 'nature' | 'beach' | 'culture' | 'food' | 'festival'
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Filter drawer/popover state
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterMaxPrice, setFilterMaxPrice] = useState<number>(500000);

  // Categories definitions in Airbnb style
  const categories = [
    { id: 'all', label: 'Tất cả', icon: Layers },
    { id: 'nature', label: 'Thiên nhiên', icon: Trees },
    { id: 'beach', label: 'Biển đảo', icon: Palmtree },
    { id: 'culture', label: 'Văn hóa & Di sản', icon: Landmark },
    { id: 'food', label: 'Ẩm thực', icon: Utensils },
    { id: 'festival', label: 'Lễ hội', icon: PartyPopper },
  ];

  // Popular destinations for quick pill clicks
  const popularDestinations = [
    { name: 'Đà Nẵng', tag: 'Biển & Cầu Rồng' },
    { name: 'Hà Nội', tag: 'Thủ đô nghìn năm' },
    { name: 'Đà Lạt', tag: 'Thành phố ngàn hoa' },
    { name: 'Sa Pa', tag: 'Săn mây & Ruộng bậc thang' },
    { name: 'Phú Quốc', tag: 'Đảo ngọc nghỉ dưỡng' },
    { name: 'Hội An', tag: 'Phố cổ đèn lồng' },
    { name: 'Ninh Bình', tag: 'Tràng An & Tam Cốc' }
  ];

  // Flatten POIs
  const allPois = useMemo(() => {
    const list: Array<POI & { provinceName: string; region: string }> = [];
    PROVINCES.forEach(p => {
      p.pois.forEach(poi => {
        list.push({ ...poi, provinceName: p.name, region: p.region });
      });
    });
    return list;
  }, []);

  // Flatten Foods
  const allFoods = useMemo(() => {
    const list: Array<FoodSpot & { provinceName: string; region: string }> = [];
    PROVINCES.forEach(p => {
      p.foods.forEach(f => {
        list.push({ ...f, provinceName: p.name, region: p.region });
      });
    });
    return list;
  }, []);

  // Flatten Festivals
  const allFestivals = useMemo(() => {
    const list: Array<Festival & { provinceName: string }> = [];
    PROVINCES.forEach(p => {
      p.festivals.forEach(fest => {
        list.push({ ...fest, provinceName: p.name });
      });
    });
    return list;
  }, []);

  // Filtered lists based on search query, category, and advanced filter
  const matchesSearch = (text: string, destText: string) => {
    if (!destinationQuery.trim()) return true;
    const q = destinationQuery.toLowerCase();
    return text.toLowerCase().includes(q) || destText.toLowerCase().includes(q);
  };

  const matchesRegion = (region: string) => {
    if (filterRegion === 'all') return true;
    return region === filterRegion;
  };

  // 1. Featured Destinations (Provinces)
  const filteredProvinces = useMemo(() => {
    return PROVINCES.filter(p => {
      const matchSearch = destinationQuery ? p.name.toLowerCase().includes(destinationQuery.toLowerCase()) : true;
      const matchReg = matchesRegion(p.region);
      if (activeCategory === 'beach') return (p.name.includes('Đà Nẵng') || p.name.includes('Phú Quốc') || p.name.includes('Nha Trang')) && matchSearch && matchReg;
      if (activeCategory === 'nature') return (p.name.includes('Sa Pa') || p.name.includes('Hà Giang') || p.name.includes('Đà Lạt') || p.name.includes('Ninh Bình')) && matchSearch && matchReg;
      if (activeCategory === 'culture') return (p.name.includes('Hà Nội') || p.name.includes('Hội An') || p.name.includes('Huế')) && matchSearch && matchReg;
      return matchSearch && matchReg;
    });
  }, [destinationQuery, activeCategory, filterRegion]);

  // 2. Cultural & Heritage Experiences (POIs)
  const filteredPOIs = useMemo(() => {
    return allPois.filter(poi => {
      const matchSearch = matchesSearch(poi.name, poi.provinceName);
      const matchReg = matchesRegion(poi.region);
      const matchPrice = poi.ticketPrice <= filterMaxPrice;
      if (!matchSearch || !matchReg || !matchPrice) return false;
      if (activeCategory === 'all') return true;
      if (activeCategory === 'culture') return poi.category.includes('Văn hóa') || poi.category.includes('Tâm linh') || poi.category.includes('Di sản');
      if (activeCategory === 'nature') return poi.category.includes('Thiên nhiên') || poi.tags.some(t => ['núi', 'rừng', 'sông', 'thác'].includes(t));
      if (activeCategory === 'beach') return poi.tags.some(t => ['biển', 'đảo', 'bãi tắm', 'san hô'].includes(t));
      return false;
    });
  }, [allPois, destinationQuery, activeCategory, filterRegion, filterMaxPrice]);

  // 3. Local Foods
  const filteredFoods = useMemo(() => {
    if (activeCategory !== 'all' && activeCategory !== 'food') return [];
    return allFoods.filter(f => {
      const matchSearch = matchesSearch(f.dishName, f.provinceName) || matchesSearch(f.name, f.address);
      const matchReg = matchesRegion(f.region);
      return matchSearch && matchReg;
    });
  }, [allFoods, destinationQuery, activeCategory, filterRegion]);

  // 4. Festivals
  const filteredFestivals = useMemo(() => {
    if (activeCategory !== 'all' && activeCategory !== 'festival' && activeCategory !== 'culture') return [];
    return allFestivals.filter(fest => {
      return matchesSearch(fest.name, fest.provinceName);
    });
  }, [allFestivals, destinationQuery, activeCategory]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearchOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-[#222222]">
      {/* 1. Header & Airbnb Pill Search Bar Section */}
      <section className="border-b border-[#E5E5E5] bg-white pt-4 pb-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Welcoming Greeting */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#222222] tracking-tight">
              Chuyến đi tiếp theo của bạn bắt đầu ở đâu?
            </h1>
            <p className="text-xs sm:text-sm text-[#717171] max-w-xl mx-auto">
              Khám phá điểm đến, ẩm thực và văn hóa địa phương cùng VietGo.
            </p>
          </div>

          {/* Desktop Airbnb Pill Search Bar */}
          <div className="hidden sm:block">
            <form 
              onSubmit={handleSearchSubmit}
              className="max-w-3xl mx-auto bg-white rounded-full border border-[#E5E5E5] shadow-md hover:shadow-lg transition-all p-2 flex items-center justify-between divide-x divide-[#E5E5E5]"
            >
              {/* Field 1: Destination */}
              <div className="flex-1 px-5 py-1.5 hover:bg-[#F7F7F7] rounded-full transition-colors cursor-pointer group">
                <label className="block text-[11px] font-bold text-[#222222] uppercase tracking-wider">
                  Địa điểm
                </label>
                <input
                  type="text"
                  value={destinationQuery}
                  onChange={(e) => setDestinationQuery(e.target.value)}
                  placeholder="Bạn muốn đi đâu? (Hà Nội, Đà Nẵng...)"
                  className="w-full bg-transparent text-xs sm:text-sm text-[#222222] font-semibold placeholder:text-[#717171] focus:outline-hidden"
                />
              </div>

              <div className="px-5 py-1.5 hover:bg-[#F7F7F7] rounded-full transition-colors min-w-[160px]">
                <label className="block text-[11px] font-bold text-[#222222] uppercase tracking-wider" htmlFor="explore-interest">Sở thích</label>
                <select id="explore-interest" value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="w-full bg-transparent text-xs sm:text-sm text-[#222222] font-semibold focus:outline-hidden cursor-pointer">
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                </select>
              </div>

              {/* Action Button: Coral Search Button */}
              <div className="pl-2 pr-1">
                <button
                  type="submit"
                  className="bg-[#FF385C] hover:bg-[#E00B41] text-white p-3.5 rounded-full transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer font-bold text-xs sm:text-sm px-5"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden md:inline">Khám phá</span>
                </button>
              </div>
            </form>
          </div>

          {/* Mobile Pill Trigger Button */}
          <div className="sm:hidden">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-full bg-white rounded-full border border-[#E5E5E5] shadow-sm py-3 px-4 flex items-center justify-between text-left cursor-pointer active:scale-98 transition-transform"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#FF385C] text-white flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#222222]">
                    {destinationQuery || 'Bạn muốn đi đâu?'}
                  </div>
                  <div className="text-[11px] text-[#717171]">
                    {categories.find(cat => cat.id === activeCategory)?.label}
                  </div>
                </div>
              </div>
              <div className="p-2 border border-[#E5E5E5] rounded-full text-[#717171]">
                <SlidersHorizontal className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>

          {/* Quick Popular Destination Tags & 'Khám phá gần tôi' button */}
          <div className="flex items-center justify-center flex-wrap gap-2 pt-1 text-xs">
            {onNavigateToNearby && (
              <button
                onClick={onNavigateToNearby}
                className="flex items-center gap-1.5 px-4 py-1 rounded-full bg-rose-50 hover:bg-rose-100 text-[#FF385C] border border-rose-200 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5 fill-[#FF385C]/20" />
                <span>Khám phá gần tôi</span>
              </button>
            )}
            <span className="text-[#717171] font-medium hidden sm:inline">Phổ biến:</span>
            {popularDestinations.map((dest) => (
              <button
                key={dest.name}
                onClick={() => setDestinationQuery(dest.name)}
                className={`px-3 py-1 rounded-full border transition-all cursor-pointer ${
                  destinationQuery === dest.name
                    ? 'bg-[#222222] text-white border-[#222222]'
                    : 'bg-[#F7F7F7] hover:bg-[#E5E5E5] text-[#222222] border-[#E5E5E5]'
                }`}
              >
                {dest.name}
              </button>
            ))}
            {destinationQuery && (
              <button
                onClick={() => setDestinationQuery('')}
                className="text-xs font-bold text-[#FF385C] hover:underline px-2 cursor-pointer"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Theme Filter Tabs Bar */}
      <section className="sticky top-[var(--site-header-height,89px)] z-30 bg-white/95 backdrop-blur-xs border-b border-[#E5E5E5] py-2 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none py-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex flex-col items-center gap-1.5 pb-1 border-b-2 cursor-pointer transition-all whitespace-nowrap group shrink-0 ${
                    isActive
                      ? 'border-[#222222] text-[#222222] font-bold'
                      : 'border-transparent text-[#717171] hover:text-[#222222] hover:border-[#E5E5E5]'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-[#FF385C]' : 'text-[#717171]'}`} />
                  <span className="text-xs">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Filter Button */}
          <button
            onClick={() => setFilterModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E5E5] hover:border-[#222222] text-xs font-bold text-[#222222] transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bộ lọc</span>
            {filterRegion !== 'all' && (
              <span className="w-2 h-2 rounded-full bg-[#FF385C]"></span>
            )}
          </button>
        </div>
      </section>

      {/* 3. Main Content Sections */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-10">
        <p className="text-[11px] text-[#717171]">Dữ liệu địa điểm và mức giá đang dùng cho bản demo. Hãy kiểm tra thông tin trước chuyến đi. <a href="/image-credits.html" className="underline">Nguồn ảnh</a></p>
        {/* SECTION A: Điểm đến nổi bật (Top Destinations) */}
        {(activeCategory === 'all' || activeCategory === 'beach' || activeCategory === 'nature' || activeCategory === 'culture') && filteredProvinces.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#222222] tracking-tight">
                  Điểm đến nổi bật Việt Nam
                </h2>
                <p className="text-xs sm:text-sm text-[#717171]">
                  Gợi ý điểm đến cùng thông tin thời tiết và mẹo di chuyển để tham khảo
                </p>
              </div>
            </div>

            {/* Grid 4 columns responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProvinces.map((prov) => {
                const isSaved = wishlist.includes(prov.id);
                return (
                  <div
                    key={prov.id}
                    onClick={() => onSelectItem({ itemType: 'province', ...prov })}
                    className="group flex flex-col cursor-pointer"
                  >
                    {/* Image with 4:3 ratio & 16-20px rounded */}
                    <div className="relative aspect-[4/3] rounded-[18px] overflow-hidden bg-[#F7F7F7] mb-2.5">
                      <ExploreImage src={prov.imageUrl} alt={prov.name} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />

                      {/* Wishlist button top right */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(prov.id);
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-xs hover:bg-white text-[#222222] transition-transform active:scale-125 cursor-pointer shadow-xs"
                      >
                        <Heart 
                          className={`w-4 h-4 ${isSaved ? 'fill-[#FF385C] text-[#FF385C]' : 'text-[#222222]'}`} 
                        />
                      </button>

                      {/* Region Badge */}
                      <span className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {prov.region}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-1 flex-col space-y-0.5">
                      <div className="flex items-center justify-between font-extrabold text-sm text-[#222222]">
                        <span>{prov.name}</span>
                      </div>
                      <p className="text-xs text-[#717171] line-clamp-1">
                        {prov.tagline}
                      </p>
                      <div className="text-xs text-[#717171] pt-1">Mùa đẹp: {prov.bestMonths}</div>
                      <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onQuickPlanTrip({
                              destination: prov.name,
                              days: 3,
                              guests: 2
                            });
                          }}
                          className="mt-auto self-start pt-2 whitespace-nowrap text-[11px] font-bold text-[#FF385C] hover:underline"
                        >
                          Lập lịch trình &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION B: Trải nghiệm văn hóa & Danh thắng (POIs) */}
        {(activeCategory === 'all' || activeCategory === 'culture' || activeCategory === 'nature' || activeCategory === 'beach') && filteredPOIs.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-[#E5E5E5]">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#222222] tracking-tight">
                  Trải nghiệm văn hóa & Danh thắng
                </h2>
                <p className="text-xs sm:text-sm text-[#717171]">
                  Di tích ngàn năm, thắng cảnh thiên nhiên và điểm check-in tiêu biểu
                </p>
              </div>
            </div>

            {/* Grid 4 columns responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPOIs.slice(0, 12).map((poi) => {
                const isSaved = wishlist.includes(poi.id);
                const priceLabel = poi.ticketPrice > 0 
                  ? `${poi.ticketPrice.toLocaleString('vi-VN')} VNĐ / vé`
                  : 'Miễn phí vé';

                return (
                  <div
                    key={poi.id}
                    onClick={() => onSelectItem({ itemType: 'poi', ...poi })}
                    className="group flex flex-col cursor-pointer"
                  >
                    {/* Image with 4:3 ratio & 18px rounded */}
                    <div className="relative aspect-[4/3] rounded-[18px] overflow-hidden bg-[#F7F7F7] mb-2.5">
                      <ExploreImage src={poi.imageUrl} alt={poi.name} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />

                      {/* Wishlist button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(poi.id);
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-xs hover:bg-white text-[#222222] transition-transform active:scale-125 cursor-pointer shadow-xs"
                      >
                        <Heart 
                          className={`w-4 h-4 ${isSaved ? 'fill-[#FF385C] text-[#FF385C]' : 'text-[#222222]'}`} 
                        />
                      </button>

                      {/* Category Pill */}
                      <span className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs text-[#222222] text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                        {poi.category}
                      </span>
                    </div>

                    {/* Metadata */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between font-extrabold text-sm text-[#222222]">
                        <span className="truncate pr-2">{poi.name}</span>
                      </div>

                      <div className="text-xs text-[#717171] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#FF385C] shrink-0" />
                        <span className="truncate">{poi.provinceName}</span>
                      </div>

                      <p className="text-xs text-[#717171] line-clamp-1 pt-0.5">
                        {poi.description}
                      </p>

                      <div className="text-xs pt-1 flex items-center justify-between">
                        <span className="font-extrabold text-[#222222]">
                          Giá tham khảo: {priceLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION C: Khám phá ẩm thực bản địa (FoodSpots) */}
        {(activeCategory === 'all' || activeCategory === 'food') && filteredFoods.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-[#E5E5E5]">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#222222] tracking-tight">
                  Khám phá ẩm thực chuẩn vị
                </h2>
                <p className="text-xs sm:text-sm text-[#717171]">
                  Khám phá món ngon địa phương cùng địa chỉ và mức giá tham khảo.
                </p>
              </div>
            </div>

            {/* Grid 4 columns responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredFoods.slice(0, 8).map((food) => {
                const isSaved = wishlist.includes(food.id);
                return (
                  <div
                    key={food.id}
                    onClick={() => onSelectItem({ itemType: 'food', ...food })}
                    className="group flex flex-col cursor-pointer"
                  >
                    {/* Image with 4:3 ratio & 18px rounded */}
                    <div className="relative aspect-[4/3] rounded-[18px] overflow-hidden bg-[#F7F7F7] mb-2.5">
                      <ExploreImage src={food.imageUrl} alt={food.dishName} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />

                      {/* Wishlist button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(food.id);
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-xs hover:bg-white text-[#222222] transition-transform active:scale-125 cursor-pointer shadow-xs"
                      >
                        <Heart 
                          className={`w-4 h-4 ${isSaved ? 'fill-[#FF385C] text-[#FF385C]' : 'text-[#222222]'}`} 
                        />
                      </button>

                      {/* Local favorite badge */}
                      {food.isLocalFavorite && (
                        <span className="absolute bottom-3 left-3 bg-[#FF385C] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                          Quán tủ bản xứ
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between font-extrabold text-sm text-[#222222]">
                        <span className="truncate pr-2">{food.dishName}</span>
                      </div>

                      <div className="text-xs text-[#717171] truncate">
                        {food.name} • {food.provinceName}
                      </div>

                      <p className="text-xs text-[#717171] line-clamp-1 pt-0.5">
                        {food.description}
                      </p>

                      <div className="text-xs pt-1 flex items-center justify-between">
                        <span className="font-extrabold text-[#222222]">
                          Giá tham khảo: {food.priceRange} / món
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION D: Lễ hội đáng khám phá (Festivals) */}
        {(activeCategory === 'all' || activeCategory === 'festival' || activeCategory === 'culture') && filteredFestivals.length > 0 && (
          <section className="space-y-4 pt-4 border-t border-[#E5E5E5]">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-[#222222] tracking-tight">
                  Lễ hội đáng khám phá
                </h2>
                <p className="text-xs sm:text-sm text-[#717171]">
                  Lễ hội truyền thống, văn hóa dân gian và sự kiện pháo hoa tầm cỡ
                </p>
              </div>
            </div>

            {/* Grid 4 columns responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredFestivals.slice(0, 4).map((fest) => {
                const isSaved = wishlist.includes(fest.id);
                return (
                  <div
                    key={fest.id}
                    onClick={() => onSelectItem({ itemType: 'festival', ...fest })}
                    className="group flex flex-col cursor-pointer"
                  >
                    <div className="relative aspect-[4/3] rounded-[18px] overflow-hidden bg-[#F7F7F7] mb-2.5">
                      <ExploreImage src={fest.imageUrl} alt={fest.name} className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300" />

                      {/* Wishlist button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleWishlist(fest.id);
                        }}
                        className="absolute top-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-xs hover:bg-white text-[#222222] transition-transform active:scale-125 cursor-pointer shadow-xs"
                      >
                        <Heart 
                          className={`w-4 h-4 ${isSaved ? 'fill-[#FF385C] text-[#FF385C]' : 'text-[#222222]'}`} 
                        />
                      </button>

                      <span className="absolute bottom-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                        Quy mô {fest.scale}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <div className="font-extrabold text-sm text-[#222222] truncate">
                        {fest.name}
                      </div>
                      <div className="text-xs text-[#717171] truncate">
                        {fest.provinceName} • {fest.solarDate}
                      </div>
                      <p className="text-xs text-[#717171] line-clamp-1 pt-0.5">
                        {fest.description}
                      </p>
                      <div className="text-xs pt-1 font-extrabold text-[#222222]">
                        Giá tham khảo: {fest.ticketPrice > 0 ? `${fest.ticketPrice.toLocaleString('vi-VN')} VNĐ / vé` : 'Miễn phí tham dự'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty State */}
        {filteredProvinces.length === 0 && filteredPOIs.length === 0 && filteredFoods.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#F7F7F7] flex items-center justify-center mx-auto text-xl">
              🔍
            </div>
            <h3 className="text-base font-bold text-[#222222]">
              Không tìm thấy kết quả phù hợp cho "{destinationQuery}"
            </h3>
            <p className="text-xs text-[#717171] max-w-sm mx-auto">
              Hãy thử tìm kiếm với tên tỉnh thành khác như Hà Nội, Đà Nẵng, Đà Lạt, Sa Pa hoặc xóa bộ lọc.
            </p>
            <button
              onClick={() => {
                setDestinationQuery('');
                setActiveCategory('all');
                setFilterRegion('all');
              }}
              className="px-4 py-2 rounded-full bg-[#222222] text-white text-xs font-bold cursor-pointer hover:bg-black transition-colors"
            >
              Xem tất cả địa điểm
            </button>
          </div>
        )}
      </div>

      {/* Mobile Search Sheet / Dialog */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex flex-col justify-end sm:hidden animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <h3 className="text-base font-bold text-[#222222]">Tìm kiếm chuyến đi</h3>
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-full text-[#717171] hover:text-[#222222]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#222222]">Điểm đến tại Việt Nam</label>
                <input
                  type="text"
                  value={destinationQuery}
                  onChange={(e) => setDestinationQuery(e.target.value)}
                  placeholder="Hà Nội, Đà Nẵng, Sa Pa, Phú Quốc..."
                  className="w-full p-3 rounded-2xl border border-[#E5E5E5] text-xs font-semibold text-[#222222] focus:outline-hidden focus:border-[#FF385C]"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#222222]" htmlFor="mobile-explore-interest">Sở thích</label>
                <select id="mobile-explore-interest" value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)} className="w-full p-3 rounded-2xl border border-[#E5E5E5] text-xs font-semibold text-[#222222] focus:outline-hidden">
                  {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                onClick={() => setDestinationQuery('')}
                className="py-3 px-4 rounded-2xl border border-[#E5E5E5] text-xs font-bold text-[#717171]"
              >
                Xóa
              </button>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="flex-1 py-3 px-4 rounded-2xl bg-[#FF385C] text-white text-xs font-bold shadow-sm"
              >
                Khám phá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filter Modal */}
      {filterModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setFilterModalOpen(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-[#E5E5E5] space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <h3 className="text-base font-extrabold text-[#222222]">Bộ lọc nâng cao</h3>
              <button 
                onClick={() => setFilterModalOpen(false)}
                className="p-1 rounded-full text-[#717171] hover:text-[#222222]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Region selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#222222]">Khu vực địa lý</label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {['all', 'Bắc', 'Trung', 'Nam', 'Tây Nguyên', 'Tây Nam Bộ'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setFilterRegion(r)}
                    className={`py-2 px-2.5 rounded-xl border text-center font-semibold cursor-pointer transition-all ${
                      filterRegion === r
                        ? 'bg-[#222222] text-white border-[#222222]'
                        : 'bg-[#F7F7F7] text-[#717171] border-[#E5E5E5] hover:border-[#222222]'
                    }`}
                  >
                    {r === 'all' ? 'Tất cả vùng' : r}
                  </button>
                ))}
              </div>
            </div>

            {/* Price ceiling */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-[#222222]">Giá vé tối đa (VNĐ)</label>
                <span className="font-bold text-[#FF385C]">{filterMaxPrice.toLocaleString('vi-VN')} đ</span>
              </div>
              <input
                type="range"
                min={0}
                max={1000000}
                step={50000}
                value={filterMaxPrice}
                onChange={(e) => setFilterMaxPrice(Number(e.target.value))}
                className="w-full accent-[#FF385C] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#717171]">
                <span>Miễn phí (0đ)</span>
                <span>500.000đ</span>
                <span>1.000.000đ</span>
              </div>
            </div>

            <div className="pt-3 border-t border-[#E5E5E5] flex items-center justify-between">
              <button
                onClick={() => {
                  setFilterRegion('all');
                  setFilterMaxPrice(1000000);
                }}
                className="text-xs font-bold text-[#717171] hover:underline cursor-pointer"
              >
                Đặt lại
              </button>

              <button
                onClick={() => setFilterModalOpen(false)}
                className="py-2.5 px-5 rounded-2xl bg-[#FF385C] hover:bg-[#E00B41] text-white text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                Áp dụng bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
