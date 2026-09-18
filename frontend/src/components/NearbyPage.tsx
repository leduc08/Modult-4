import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  MapPin, 
  Navigation, 
  Compass, 
  SlidersHorizontal, 
  Star, 
  Heart, 
  Clock, 
  ArrowUpRight, 
  Plus, 
  Bot, 
  X, 
  Check, 
  RotateCcw, 
  Coffee, 
  Utensils, 
  Landmark, 
  Camera, 
  ShoppingBag, 
  Layers, 
  ChevronRight, 
  AlertCircle, 
  LocateFixed, 
  ExternalLink,
  Map as MapIcon,
  List as ListIcon
} from 'lucide-react';
import L from 'leaflet';
import { 
  NearbyPlace, 
  PlaceCategoryGroup, 
  queryNearbyPlaces 
} from '../services/nearbyPlacesService';
import { DetailItem } from './ItemDetailModal';

interface NearbyPageProps {
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onSelectItem: (item: DetailItem) => void;
  onAddToItinerary: (item: DetailItem) => void;
  onAskAI: (item: DetailItem) => void;
}

// Preset popular areas for quick jump when GPS is off or user wants to browse
const POPULAR_AREAS = [
  { id: 'da-nang', name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022 },
  { id: 'ha-noi', name: 'Hà Nội', lat: 21.0285, lng: 105.8542 },
  { id: 'tp-hcm', name: 'TP. Hồ Chí Minh', lat: 10.7769, lng: 106.7009 },
  { id: 'hoi-an', name: 'Hội An', lat: 15.8801, lng: 108.3380 },
  { id: 'da-lat', name: 'Đà Lạt', lat: 11.9404, lng: 108.4583 },
  { id: 'sa-pa', name: 'Sa Pa', lat: 22.3364, lng: 103.8438 },
  { id: 'phu-quoc', name: 'Phú Quốc', lat: 10.2899, lng: 103.9840 },
  { id: 'hue', name: 'Huế', lat: 16.4637, lng: 107.5909 },
  { id: 'ninh-binh', name: 'Ninh Bình', lat: 20.2506, lng: 105.9745 },
];

export const NearbyPage: React.FC<NearbyPageProps> = ({
  wishlist,
  onToggleWishlist,
  onSelectItem,
  onAddToItinerary,
  onAskAI,
}) => {
  // Map Container & Instance Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersMapRef = useRef<{ [key: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const placeCardsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 1. User Geolocation State
  // 'idle' = not requested yet
  // 'locating' = active navigator.geolocation request
  // 'located' = got real user GPS
  // 'denied' = permission denied / error / timeout
  const [geoState, setGeoState] = useState<'idle' | 'locating' | 'located' | 'denied'>('idle');
  const [geoErrorMessage, setGeoErrorMessage] = useState<string>('');
  const [realUserCoords, setRealUserCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);

  // 2. Active Search Center (Can be real user coords OR chosen city / map drag center)
  const [searchCenter, setSearchCenter] = useState<{
    lat: number;
    lng: number;
    name: string;
    isRealUser: boolean;
  }>({
    lat: 16.0544,
    lng: 108.2022,
    name: 'Đà Nẵng',
    isRealUser: false,
  });

  // Flag indicating the user panned the map away from current search center
  const [hasMapMovedAway, setHasMapMovedAway] = useState(false);
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // 3. Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategoryGroup>('all');
  const [selectedRadius, setSelectedRadius] = useState<number | 'all'>(5);
  const [sortBy, setSortBy] = useState<'nearest' | 'rating'>('nearest');
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);

  // 4. Selected Place for Highlight / Card Peek
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // 5. Toast notification for "Added to itinerary"
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 6. Mobile toggle: 'map' | 'list'
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

  // Trigger Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Categories config
  const categories: { id: PlaceCategoryGroup; label: string; icon: any }[] = [
    { id: 'all', label: 'Tất cả', icon: Layers },
    { id: 'food', label: 'Ăn uống', icon: Utensils },
    { id: 'cafe', label: 'Cà phê', icon: Coffee },
    { id: 'sightseeing', label: 'Tham quan', icon: Camera },
    { id: 'culture', label: 'Văn hóa', icon: Landmark },
    { id: 'shopping', label: 'Mua sắm', icon: ShoppingBag },
  ];

  // Request real user location with geolocation API
  const handleRequestUserLocation = () => {
    if (!navigator.geolocation) {
      setGeoState('denied');
      setGeoErrorMessage('Trình duyệt của bạn không hỗ trợ xác định vị trí.');
      return;
    }

    setGeoState('locating');
    setGeoErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coords = { lat: latitude, lng: longitude, accuracy };
        setRealUserCoords(coords);
        setGeoState('located');
        setSearchCenter({
          lat: latitude,
          lng: longitude,
          name: 'Vị trí của bạn',
          isRealUser: true,
        });
        setHasMapMovedAway(false);

        // Fly map to user position
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 15, { duration: 1.2 });
        }
      },
      (error) => {
        setGeoState('denied');
        if (error.code === error.PERMISSION_DENIED) {
          setGeoErrorMessage('Bạn đã từ chối quyền truy cập vị trí. Bạn vẫn có thể chọn thành phố bên dưới.');
        } else if (error.code === error.TIMEOUT) {
          setGeoErrorMessage('Quá thời gian lấy vị trí GPS. Vui lòng thử lại hoặc chọn thành phố.');
        } else {
          setGeoErrorMessage('Không thể xác định vị trí lúc này. Hãy chọn một thành phố bên dưới.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Jump to specific preset city/area
  const handleSelectArea = (area: { name: string; lat: number; lng: number }) => {
    setSearchCenter({
      lat: area.lat,
      lng: area.lng,
      name: area.name,
      isRealUser: false,
    });
    setHasMapMovedAway(false);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([area.lat, area.lng], 14, { duration: 1 });
    }
  };

  // Query places based on searchCenter and filters
  const places = useMemo(() => {
    return queryNearbyPlaces({
      center: { lat: searchCenter.lat, lng: searchCenter.lng },
      radiusKm: selectedRadius,
      category: selectedCategory,
      searchQuery,
      sortBy,
      onlyOpenNow,
    });
  }, [searchCenter, selectedRadius, selectedCategory, searchQuery, sortBy, onlyOpenNow]);

  // The active selected place object
  const selectedPlace = useMemo(() => {
    if (!selectedPlaceId) return null;
    return places.find((p) => p.id === selectedPlaceId) || null;
  }, [selectedPlaceId, places]);

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const leafletLib = (window as any).L || L;
    if (!leafletLib) return;

    const map = leafletLib.map(mapContainerRef.current, {
      center: [searchCenter.lat, searchCenter.lng],
      zoom: 14,
      zoomControl: false,
      attributionControl: true,
    });

    // Clean, crisp CartoDB Positron tiles matching Airbnb aesthetic
    leafletLib
      .tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
        maxZoom: 19,
      })
      .addTo(map);

    // Zoom control at bottom right
    leafletLib.control.zoom({ position: 'bottomright' }).addTo(map);

    // Listen to moveend to show "Tìm trong khu vực này"
    map.on('moveend', () => {
      const center = map.getCenter();
      setCurrentMapCenter({ lat: center.lat, lng: center.lng });
      // If moved significantly from searchCenter (> 400m)
      const dist = Math.hypot(center.lat - searchCenter.lat, center.lng - searchCenter.lng);
      if (dist > 0.005) {
        setHasMapMovedAway(true);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render / Update User Location Marker
  useEffect(() => {
    const leafletLib = (window as any).L || L;
    const map = mapInstanceRef.current;
    if (!map || !leafletLib) return;

    // Clean up old user markers
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
    if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.remove();
      userAccuracyCircleRef.current = null;
    }

    if (realUserCoords) {
      // Accuracy circle
      if (realUserCoords.accuracy && realUserCoords.accuracy > 20) {
        userAccuracyCircleRef.current = leafletLib
          .circle([realUserCoords.lat, realUserCoords.lng], {
            radius: Math.min(realUserCoords.accuracy, 1000),
            color: '#3B82F6',
            fillColor: '#60A5FA',
            fillOpacity: 0.15,
            weight: 1,
          })
          .addTo(map);
      }

      // User location dot (pulsing blue dot)
      const userDotIcon = leafletLib.divIcon({
        className: 'user-location-pin',
        html: `
          <div class="relative flex items-center justify-center w-6 h-6">
            <span class="absolute inline-flex w-full h-full rounded-full bg-blue-400 opacity-75 animate-ping"></span>
            <span class="relative inline-flex w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-white shadow-md"></span>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      userMarkerRef.current = leafletLib
        .marker([realUserCoords.lat, realUserCoords.lng], { icon: userDotIcon, zIndexOffset: 1000 })
        .addTo(map)
        .bindTooltip('Vị trí của bạn', { permanent: false, direction: 'top' });
    }
  }, [realUserCoords]);

  // 3. Render Place Pins on Map
  useEffect(() => {
    const leafletLib = (window as any).L || L;
    const map = mapInstanceRef.current;
    if (!map || !leafletLib) return;

    // Remove existing markers
    Object.values(markersMapRef.current).forEach((m: any) => m?.remove());
    markersMapRef.current = {};

    places.forEach((place) => {
      const isSelected = place.id === selectedPlaceId;

      // Icon emoji based on category
      const iconEmoji =
        place.categoryGroup === 'food'
          ? '🍲'
          : place.categoryGroup === 'cafe'
          ? '☕'
          : place.categoryGroup === 'sightseeing'
          ? '🏛️'
          : place.categoryGroup === 'culture'
          ? '⛩️'
          : place.categoryGroup === 'shopping'
          ? '🛍️'
          : '📍';

      // Airbnb style custom HTML pin
      const pinHtml = `
        <div class="group relative cursor-pointer select-none transition-all duration-200 transform ${
          isSelected ? 'scale-125 z-50' : 'hover:scale-115'
        }">
          <div class="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold shadow-md border ${
            isSelected
              ? 'bg-[#222222] text-white border-[#222222] shadow-xl'
              : 'bg-white text-[#222222] border-[#E5E5E5] hover:border-[#222222]'
          }">
            <span class="text-sm">${iconEmoji}</span>
            <span class="max-w-[100px] truncate text-[11px]">${place.name}</span>
          </div>
          <div class="w-2 h-2 mx-auto rotate-45 -mt-1 ${
            isSelected ? 'bg-[#222222]' : 'bg-white border-r border-b border-[#E5E5E5]'
          }"></div>
        </div>
      `;

      const customIcon = leafletLib.divIcon({
        className: `airbnb-place-marker marker-${place.id}`,
        html: pinHtml,
        iconSize: [120, 36],
        iconAnchor: [60, 34],
      });

      const marker = leafletLib
        .marker([place.coordinates.lat, place.coordinates.lng], {
          icon: customIcon,
          zIndexOffset: isSelected ? 500 : 10,
        })
        .addTo(map)
        .on('click', () => {
          setSelectedPlaceId(place.id);
          // Scroll card into view on desktop
          const el = placeCardsRef.current[place.id];
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });

      markersMapRef.current[place.id] = marker;
    });
  }, [places, selectedPlaceId]);

  // When selectedPlaceId changes, center map on that place
  const handleSelectPlaceFromList = (place: NearbyPlace) => {
    setSelectedPlaceId(place.id);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([place.coordinates.lat, place.coordinates.lng], {
        animate: true,
        duration: 0.6,
      });
    }
  };

  // Re-search at current map center (Airbnb "Tìm trong khu vực này")
  const handleSearchThisArea = () => {
    if (!currentMapCenter) return;
    setSearchCenter({
      lat: currentMapCenter.lat,
      lng: currentMapCenter.lng,
      name: 'Khu vực trên bản đồ',
      isRealUser: false,
    });
    setHasMapMovedAway(false);
  };

  // Reset all filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedRadius('all');
    setSortBy('nearest');
    setOnlyOpenNow(false);
  };

  const isFilterActive =
    searchQuery !== '' ||
    selectedCategory !== 'all' ||
    selectedRadius !== 5 ||
    sortBy !== 'nearest' ||
    onlyOpenNow;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-white text-[#222222] flex flex-col relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#222222] text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Split Layout: Left 40% List & Filters, Right 60% Leaflet Map */}
      <div className="flex-1 flex flex-col lg:flex-row h-full">
        {/* =================================================================== */}
        {/* LEFT COLUMN: Controls, Geolocation CTA, Filters, and Places List (40%) */}
        {/* =================================================================== */}
        <div
          className={`w-full lg:w-[42%] xl:w-[40%] flex flex-col border-r border-[#E5E5E5] bg-white z-10 ${
            mobileView === 'map' ? 'hidden lg:flex' : 'flex'
          } max-h-none lg:max-h-[calc(100vh-80px)] overflow-hidden`}
        >
          {/* Top Sticky Header: Search Bar & Area Indicator */}
          <div className="p-4 sm:p-5 border-b border-[#E5E5E5] bg-white shrink-0 space-y-3">
            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#717171] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm địa điểm, món ăn, cà phê, di tích..."
                className="w-full pl-10 pr-9 py-2.5 bg-[#F7F7F7] hover:bg-[#EFEFEF] focus:bg-white border border-[#E5E5E5] focus:border-[#222222] rounded-full text-xs sm:text-sm font-semibold text-[#222222] placeholder:text-[#717171] transition-all focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 p-1 rounded-full hover:bg-[#E5E5E5] text-[#717171]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Filter Pills (Horizontal Scroll) */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#222222] text-white shadow-xs'
                        : 'bg-[#F7F7F7] text-[#717171] hover:text-[#222222] hover:bg-[#E5E5E5] border border-transparent'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-Filters: Radius, Sort, and Open Now */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {/* Radius pills */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-bold text-[#717171] mr-1">Bán kính:</span>
                {([1, 3, 5, 10, 'all'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setSelectedRadius(r)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                      selectedRadius === r
                        ? 'bg-[#FF385C] text-white'
                        : 'bg-[#F7F7F7] text-[#717171] hover:text-[#222222] hover:bg-[#E5E5E5]'
                    }`}
                  >
                    {r === 'all' ? 'Tất cả' : `${r} km`}
                  </button>
                ))}
              </div>

              {/* Sort and Open Now */}
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#F7F7F7] text-[#222222] text-[11px] font-bold px-2.5 py-1 rounded-full border border-[#E5E5E5] cursor-pointer focus:outline-hidden"
                >
                  <option value="nearest">Gần nhất</option>
                  <option value="rating">Đánh giá cao</option>
                </select>

                <button
                  onClick={() => setOnlyOpenNow(!onlyOpenNow)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors border ${
                    onlyOpenNow
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-[#F7F7F7] text-[#717171] border-[#E5E5E5]'
                  }`}
                >
                  Đang mở cửa
                </button>

                {isFilterActive && (
                  <button
                    onClick={handleClearFilters}
                    className="text-[11px] font-bold text-[#FF385C] hover:underline cursor-pointer flex items-center gap-0.5"
                    title="Xóa bộ lọc"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Đặt lại</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Area Indicator & GPS Status Banner */}
          <div className="px-5 py-3 bg-[#F7F7F7]/60 border-b border-[#E5E5E5] flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-[#FF385C] shrink-0 animate-pulse"></span>
              <span className="font-bold text-[#222222] truncate">
                {searchCenter.isRealUser
                  ? 'Gần bạn (Vị trí hiện tại)'
                  : `Quanh khu vực: ${searchCenter.name}`}
              </span>
              <span className="text-[#717171] text-[11px] shrink-0">
                • {places.length} địa điểm
              </span>
            </div>

            {/* Locate Button */}
            <button
              onClick={handleRequestUserLocation}
              disabled={geoState === 'locating'}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-stone-50 border border-[#E5E5E5] text-[#222222] text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
              title="Sử dụng vị trí của tôi"
            >
              <LocateFixed className={`w-3.5 h-3.5 text-[#FF385C] ${geoState === 'locating' ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">
                {geoState === 'locating' ? 'Đang định vị...' : 'Vị trí của tôi'}
              </span>
            </button>
          </div>

          {/* Geolocation Explanation & Permission Notice (If not located) */}
          {geoState === 'idle' && (
            <div className="p-4 m-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shrink-0">
              <div className="space-y-0.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Navigation className="w-4 h-4 text-[#FF385C]" />
                  <span>Cho phép vị trí để tìm địa điểm gần bạn nhất</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  VietGo chỉ yêu cầu quyền khi bạn bấm xác nhận, không theo dõi liên tục.
                </p>
              </div>
              <button
                onClick={handleRequestUserLocation}
                className="px-4 py-2 bg-[#222222] hover:bg-black text-white rounded-full font-bold text-xs shrink-0 cursor-pointer shadow-xs"
              >
                Sử dụng vị trí của tôi
              </button>
            </div>
          )}

          {/* Geolocation Denied Notice & Quick City Selector */}
          {geoState === 'denied' && (
            <div className="p-4 m-4 rounded-2xl bg-stone-50 border border-[#E5E5E5] text-stone-800 space-y-2 text-xs shrink-0">
              <div className="flex items-center gap-2 font-bold text-rose-600">
                <AlertCircle className="w-4 h-4" />
                <span>{geoErrorMessage || 'Chưa nhận được vị trí'}</span>
              </div>
              <p className="text-[11px] text-[#717171]">
                Chọn nhanh một thành phố bên dưới để tiếp tục khám phá:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {POPULAR_AREAS.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => handleSelectArea(city)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                      searchCenter.name === city.name
                        ? 'bg-[#222222] text-white border-[#222222]'
                        : 'bg-white text-[#717171] border-[#E5E5E5] hover:border-[#222222]'
                    }`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Places Scrollable List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {places.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-[#F7F7F7] rounded-3xl border border-[#E5E5E5] p-6">
                <Compass className="w-10 h-10 text-stone-300 mx-auto" />
                <div className="text-sm font-bold text-[#222222]">
                  Không tìm thấy địa điểm nào trong bán kính này
                </div>
                <p className="text-xs text-[#717171] max-w-sm mx-auto">
                  Hãy thử nới rộng bán kính tìm kiếm, xóa từ khóa lọc hoặc chọn một thành phố du lịch lớn.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setSelectedRadius('all')}
                    className="px-4 py-2 bg-[#222222] text-white rounded-full text-xs font-bold cursor-pointer"
                  >
                    Xem toàn vùng
                  </button>
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 bg-white border border-[#E5E5E5] text-[#222222] rounded-full text-xs font-bold cursor-pointer"
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            ) : (
              places.map((place) => {
                const isSelected = place.id === selectedPlaceId;
                const isWishlisted = wishlist.includes(place.id);

                return (
                  <div
                    key={place.id}
                    ref={(el) => (placeCardsRef.current[place.id] = el)}
                    onClick={() => handleSelectPlaceFromList(place)}
                    className={`bg-white rounded-2xl border p-3 sm:p-4 flex gap-3.5 sm:gap-4 transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'border-[#222222] shadow-md ring-2 ring-[#222222]/10 bg-stone-50/40'
                        : 'border-[#E5E5E5] hover:border-stone-400 hover:shadow-xs'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-stone-100">
                      <img
                        src={place.imageUrl}
                        alt={place.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-xs text-white uppercase">
                        {place.categoryGroup === 'food'
                          ? 'Ẩm thực'
                          : place.categoryGroup === 'cafe'
                          ? 'Cà phê'
                          : place.categoryGroup === 'sightseeing'
                          ? 'Thắng cảnh'
                          : place.categoryGroup === 'culture'
                          ? 'Văn hóa'
                          : 'Mua sắm'}
                      </span>
                    </div>

                    {/* Information Content */}
                    <div className="flex-1 min-w-0 space-y-1.5 flex flex-col justify-between">
                      <div>
                        {/* Title & Heart Button */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-[#222222] truncate group-hover:text-[#FF385C] transition-colors">
                            {place.name}
                          </h3>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWishlist(place.id);
                            }}
                            className="p-1 rounded-full text-stone-400 hover:text-[#FF385C] transition-colors cursor-pointer shrink-0"
                            title="Lưu yêu thích"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                isWishlisted ? 'fill-[#FF385C] text-[#FF385C]' : ''
                              }`}
                            />
                          </button>
                        </div>

                        {place.subtitle && (
                          <p className="text-[11px] font-medium text-[#717171] truncate">
                            {place.subtitle}
                          </p>
                        )}

                        <p className="text-[11px] text-[#717171] truncate mt-0.5">
                          {place.address}
                        </p>
                      </div>

                      {/* Distance & Status info */}
                      <div className="space-y-1 pt-1 border-t border-[#E5E5E5]/60 text-[11px]">
                        <div className="flex items-center justify-between text-[#717171]">
                          <span className="font-semibold text-[#222222]">
                            {place.distanceText ? `${place.distanceText} (đường chim bay)` : ''}
                          </span>
                          <div className="flex items-center gap-1 font-bold text-[#222222]">
                            <Star className="w-3.5 h-3.5 fill-[#FF385C] text-[#FF385C]" />
                            <span>{place.rating}</span>
                            <span className="text-[#717171] font-normal">({place.reviewCount})</span>
                          </div>
                        </div>

                        {/* Opening status & Price */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-semibold ${
                              place.isOpenNow ? 'text-emerald-600' : 'text-stone-400'
                            }`}
                          >
                            {place.isOpenNow ? '● Đang mở cửa' : '○ Đã đóng cửa'}
                          </span>
                          {place.priceDisplay && (
                            <span className="font-extrabold text-[#222222]">
                              {place.priceDisplay}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex items-center gap-1.5 pt-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectItem(place.sourceItem);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#F7F7F7] hover:bg-[#E5E5E5] text-[11px] font-bold text-[#222222] transition-colors cursor-pointer"
                        >
                          Xem chi tiết
                        </button>

                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 rounded-lg bg-[#F7F7F7] hover:bg-[#E5E5E5] text-[11px] font-bold text-[#222222] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <span>Chỉ đường</span>
                          <ExternalLink className="w-2.5 h-2.5 text-[#717171]" />
                        </a>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddToItinerary(place.sourceItem);
                            showToast(`Đã thêm "${place.name}" vào Lịch trình!`);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-[#222222] hover:bg-black text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Lịch trình</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAskAI(place.sourceItem);
                          }}
                          className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-[#FF385C] transition-colors cursor-pointer"
                          title="Hỏi AI về nơi này"
                        >
                          <Bot className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: Interactive Leaflet Map (60% Desktop, Full on Mobile) */}
        {/* =================================================================== */}
        <div
          className={`w-full lg:w-[58%] xl:w-[60%] relative flex-1 ${
            mobileView === 'list' ? 'hidden lg:block' : 'block'
          } h-[calc(100vh-140px)] lg:h-[calc(100vh-80px)] bg-stone-100`}
        >
          {/* Leaflet Map Canvas */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Floating Action: "Tìm trong khu vực này" (Airbnb search this area button) */}
          {hasMapMovedAway && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={handleSearchThisArea}
                className="px-4 py-2 bg-white hover:bg-[#F7F7F7] text-[#222222] rounded-full shadow-xl border border-[#E5E5E5] text-xs font-bold flex items-center gap-2 cursor-pointer transition-transform hover:scale-105"
              >
                <Search className="w-3.5 h-3.5 text-[#FF385C]" />
                <span>Tìm trong khu vực này</span>
              </button>
            </div>
          )}

          {/* Mobile Top Controls Overlay */}
          <div className="lg:hidden absolute top-4 left-4 right-4 z-20 space-y-2">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-[#E5E5E5] p-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-[#FF385C] shrink-0"></span>
                <span className="text-xs font-bold text-[#222222] truncate">
                  {searchCenter.isRealUser ? 'Gần bạn' : searchCenter.name}
                </span>
                <span className="text-[10px] text-[#717171] shrink-0">
                  ({places.length} điểm)
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleRequestUserLocation}
                  className="p-2 rounded-xl bg-[#F7F7F7] text-[#222222] cursor-pointer"
                  title="Vị trí của tôi"
                >
                  <LocateFixed className="w-4 h-4 text-[#FF385C]" />
                </button>
                <button
                  onClick={() => setMobileView('list')}
                  className="px-3 py-1.5 rounded-xl bg-[#222222] text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                  <span>Danh sách</span>
                </button>
              </div>
            </div>
          </div>

          {/* Preset Quick City Floating Chips on Map (Bottom-left Desktop) */}
          <div className="hidden sm:flex absolute bottom-6 left-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl p-2 border border-[#E5E5E5] shadow-lg max-w-md flex-wrap items-center gap-1 text-[11px]">
            <span className="font-bold text-[#717171] px-2">Đến nhanh:</span>
            {POPULAR_AREAS.slice(0, 6).map((city) => (
              <button
                key={city.id}
                onClick={() => handleSelectArea(city)}
                className={`px-2.5 py-1 rounded-xl font-bold cursor-pointer transition-all ${
                  searchCenter.name === city.name
                    ? 'bg-[#222222] text-white'
                    : 'bg-[#F7F7F7] text-[#717171] hover:text-[#222222]'
                }`}
              >
                {city.name}
              </button>
            ))}
          </div>

          {/* Floating Selected Place Card at Bottom (Mobile and Desktop Peek) */}
          {selectedPlace && (
            <div className="absolute bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-30 bg-white rounded-3xl border border-[#E5E5E5] p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-50 text-[#FF385C]">
                    {selectedPlace.categoryLabel}
                  </span>
                  <span className="text-[11px] font-bold text-[#717171]">
                    {selectedPlace.distanceText ? `• Cách ${selectedPlace.distanceText}` : ''}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPlaceId(null)}
                  className="p-1 rounded-full text-stone-400 hover:text-[#222222] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-3">
                <img
                  src={selectedPlace.imageUrl}
                  alt={selectedPlace.name}
                  className="w-20 h-20 rounded-2xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-xs sm:text-sm font-bold text-[#222222] truncate">
                    {selectedPlace.name}
                  </h4>
                  <p className="text-[11px] text-[#717171] truncate">{selectedPlace.address}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-[#FF385C]">
                      {selectedPlace.priceDisplay || 'Miễn phí'}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="flex items-center gap-0.5 text-[#222222] font-semibold text-[11px]">
                      <Star className="w-3 h-3 fill-[#FF385C] text-[#FF385C]" />
                      {selectedPlace.rating}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#717171] line-clamp-2 leading-relaxed">
                {selectedPlace.description}
              </p>

              {/* Action buttons */}
              <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.coordinates.lat},${selectedPlace.coordinates.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-full bg-[#F7F7F7] hover:bg-[#E5E5E5] text-xs font-bold text-[#222222] flex items-center gap-1 cursor-pointer"
                >
                  <span>Chỉ đường</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      onAddToItinerary(selectedPlace.sourceItem);
                      showToast(`Đã thêm "${selectedPlace.name}" vào Lịch trình!`);
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#222222] hover:bg-black text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lịch trình</span>
                  </button>

                  <button
                    onClick={() => onSelectItem(selectedPlace.sourceItem)}
                    className="px-3.5 py-1.5 rounded-full bg-[#FF385C] hover:bg-[#E00B41] text-white text-xs font-bold cursor-pointer"
                  >
                    Chi tiết
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Pill Button: Switch between Map and List (Airbnb style) */}
      <div className="lg:hidden fixed bottom-18 left-1/2 -translate-x-1/2 z-30">
        <button
          onClick={() => setMobileView(mobileView === 'map' ? 'list' : 'map')}
          className="px-5 py-2.5 bg-[#222222] text-white rounded-full shadow-2xl flex items-center gap-2 text-xs font-bold cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        >
          {mobileView === 'map' ? (
            <>
              <ListIcon className="w-4 h-4" />
              <span>Hiện danh sách ({places.length})</span>
            </>
          ) : (
            <>
              <MapIcon className="w-4 h-4" />
              <span>Xem bản đồ</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
