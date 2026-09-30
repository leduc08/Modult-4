import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  X, 
  Check, 
  RotateCcw, 
  Coffee, 
  Utensils, 
  Landmark, 
  Camera, 
  ShoppingBag, 
  BedDouble,
  Layers, 
  ChevronRight, 
  AlertCircle, 
  LocateFixed, 
  ExternalLink,
  Map as MapIcon,
  List as ListIcon,
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  NearbyPlace, 
  PlaceCategoryGroup, 
  queryNearbyPlaces 
} from '../services/nearbyPlacesService';
import { DetailItem } from './ItemDetailModal';
import type { ChatActionContext } from '../../../database/chatActionTypes';
import { 
  DEFAULT_DATA_SOURCE, 
  IS_SAMPLE_MODE, 
  DataSourceType,
  CARTO_API_KEY
} from '../config/maps';
import {
  searchNearbyPlaces as searchGoogle,
  GoogleApiError,
} from '../services/googlePlacesService';
import {
  searchNearbyPlaces as searchFoursquare,
  FoursquareApiError,
} from '../services/foursquareService';
import {
  loadCityPlaces,
  filterCityPlaces,
  hasPreFetchedData,
  type CityPlacesData,
  type MergeStats,
} from '../data/places/index';

interface NearbyPageProps {
  initialChatFocus?: { context: ChatActionContext; category: 'all' | 'food' };
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onSelectItem: (item: DetailItem) => void;
  onAddToItinerary: (item: DetailItem) => void;
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
  { id: 'nha-trang', name: 'Nha Trang', lat: 12.2388, lng: 109.1967 },
];

/** Find nearest city for a GPS coordinate */
function findNearestCity(lat: number, lng: number): typeof POPULAR_AREAS[0] {
  let nearest = POPULAR_AREAS[0];
  let minDist = Infinity;
  for (const city of POPULAR_AREAS) {
    const d = Math.hypot(city.lat - lat, city.lng - lng);
    if (d < minDist) { minDist = d; nearest = city; }
  }
  return nearest;
}

export const NearbyPage: React.FC<NearbyPageProps> = ({
  initialChatFocus,
  wishlist,
  onToggleWishlist,
  onSelectItem,
  onAddToItinerary,
}) => {
  // Map Container & Instance Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersMapRef = useRef<{ [key: string]: L.Marker | L.CircleMarker }>({});
  const clusterMarkersRef = useRef<L.Marker[]>([]);
  const [mapZoom, setMapZoom] = useState(14);
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
  const [showGeoNotice, setShowGeoNotice] = useState(false);
  const [realUserCoords, setRealUserCoords] = useState<{ lat: number; lng: number; accuracy?: number } | null>(null);

  // 2. Active Search Center (Can be real user coords OR chosen city / map drag center)
  const [searchCenter, setSearchCenter] = useState<{
    lat: number;
    lng: number;
    name: string;
    cityId: string;
    isRealUser: boolean;
  }>(initialChatFocus ? {
    ...initialChatFocus.context.coordinates,
    name: initialChatFocus.context.destination,
    cityId: findNearestCity(initialChatFocus.context.coordinates.lat, initialChatFocus.context.coordinates.lng).id,
    isRealUser: false,
  } : {
    lat: 16.0544,
    lng: 108.2022,
    name: 'Đà Nẵng',
    cityId: 'da-nang',
    isRealUser: false,
  });

  // Flag indicating the user panned the map away from current search center
  const searchCenterRef = useRef(searchCenter);
  searchCenterRef.current = searchCenter;
  const [hasMapMovedAway, setHasMapMovedAway] = useState(false);
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number } | null>(null);

  // 3. Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlaceCategoryGroup>(initialChatFocus?.category || 'all');
  const [selectedRadius, setSelectedRadius] = useState<number | 'all'>(initialChatFocus ? 'all' : 5);
  const [chatProvinceId, setChatProvinceId] = useState(initialChatFocus?.context.provinceId || '');
  const [recommendedIds, setRecommendedIds] = useState<string[]>(initialChatFocus
    ? initialChatFocus.category === 'food' ? initialChatFocus.context.foodIds : [...initialChatFocus.context.poiIds, ...initialChatFocus.context.foodIds]
    : []);
  const [sortBy, setSortBy] = useState<'nearest' | 'rating'>('nearest');
  const [onlyOpenNow, setOnlyOpenNow] = useState(false);

  // 4. Selected Place for Highlight / Card Peek
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);

  // 5. Toast notification for "Added to itinerary"
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 6. Mobile toggle: 'map' | 'list'
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

  // -----------------------------------------------------------------------
  // 7. Live Data Mode State (Foursquare / Google / Sample)
  // -----------------------------------------------------------------------

  /**
   * 'foursquare+osm' → dữ liệu pre-fetched kết hợp (khuyến nghị, không gọi API runtime)
   * 'sample'         → dữ liệu tĩnh vietnamData.ts (Leaflet, không cần API key)
   * 'foursquare'     → Foursquare Places API free
   * 'google'         → Google Places API (New) - có billing
   */
  const [dataSource, setDataSource] = useState<DataSourceType>(() => {
    if (initialChatFocus) return 'sample';
    // Auto-detect pre-fetched data on mount
    if (hasPreFetchedData()) return 'foursquare+osm';
    return 'sample';
  });

  /** Trạng thái fetch chung */
  const [fetchState, setFetchState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  /** Lỗi từ API — phân loại rõ ràng */
  const [apiError, setApiError] = useState<{ type: string; message: string } | null>(null);

  /** Kết quả từ API (tách riêng khỏi sample places) */
  const [livePlaces, setLivePlaces] = useState<NearbyPlace[]>([]);

  /** Đã gọi search ít nhất 1 lần chưa */
  const [hasSearchedOnce, setHasSearchedOnce] = useState(false);

  /** Debounce timer ref cho filter change */
  const filterDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Pre-fetched city data (loaded from JSON) */
  const [cityData, setCityData] = useState<CityPlacesData | null>(null);
  const [loadedCityId, setLoadedCityId] = useState<string | null>(null);
  const usingSample = dataSource === 'sample' || (
    dataSource === 'foursquare+osm' && loadedCityId === searchCenter.cityId && !cityData
  );

  /** Merge stats from pre-fetched data */
  const [mergeStats, setMergeStats] = useState<MergeStats | null>(null);

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
    { id: 'stay', label: 'Lưu trú', icon: BedDouble },
  ];

  // Request real user location with geolocation API
  const handleRequestUserLocation = () => {
    if (!navigator.geolocation) {
      setGeoState('denied');
      setGeoErrorMessage('Trình duyệt của bạn không hỗ trợ xác định vị trí.');
      setShowGeoNotice(true);
      return;
    }

    setGeoState('locating');
    setShowGeoNotice(false);
    setGeoErrorMessage('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const coords = { lat: latitude, lng: longitude, accuracy };
        setRealUserCoords(coords);
        setGeoState('located');
        const nearestCity = findNearestCity(latitude, longitude);
        setSearchCenter({
          lat: latitude,
          lng: longitude,
          name: 'Vị trí của bạn',
          cityId: nearestCity.id,
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
        setShowGeoNotice(true);
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
  const handleSelectArea = (area: typeof POPULAR_AREAS[0]) => {
    setChatProvinceId('');
    setRecommendedIds([]);
    setSearchCenter({
      lat: area.lat,
      lng: area.lng,
      name: area.name,
      cityId: area.id,
      isRealUser: false,
    });
    setHasMapMovedAway(false);
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current;
      map.stop();
      if (map.getContainer().clientWidth > 0) {
        map.flyTo([area.lat, area.lng], 14, { duration: 1 });
      } else {
        map.setView([area.lat, area.lng], 14, { animate: false });
      }
    }
  };

  // Query places based on searchCenter and filters (Sample Mode)
  const samplePlaces = useMemo(() => {
    if (!usingSample) return [];
    return queryNearbyPlaces({
      center: { lat: searchCenter.lat, lng: searchCenter.lng },
      radiusKm: selectedRadius,
      category: selectedCategory,
      searchQuery,
      sortBy,
      onlyOpenNow,
    }).filter(place => (!chatProvinceId || place.provinceId === chatProvinceId)
      && (!recommendedIds.length || recommendedIds.includes(place.id)));
  }, [searchCenter, selectedRadius, selectedCategory, searchQuery, sortBy, onlyOpenNow, usingSample, chatProvinceId, recommendedIds]);

  /** Danh sách địa điểm hiển thị — tuỳ theo dataSource */
  const staticPlaces = useMemo(() => {
    if (dataSource !== 'foursquare+osm' || cityData?.cityId !== searchCenter.cityId) return [];
    return filterCityPlaces(cityData, {
      center: searchCenter, radiusKm: selectedRadius, category: selectedCategory,
      searchQuery, sortBy,
    });
  }, [dataSource, cityData, searchCenter, selectedRadius, selectedCategory, searchQuery, sortBy]);
  const places = usingSample ? samplePlaces : dataSource === 'foursquare+osm' ? staticPlaces : livePlaces;
  const [visiblePlaceCount, setVisiblePlaceCount] = useState(50);
  useEffect(() => { setVisiblePlaceCount(50); }, [places]);

  // ---------------------------------------------------------------------------
  // Live Search (Foursquare hoặc Google) — CHỈ gọi khi user xác nhận
  // ---------------------------------------------------------------------------

  const executeSearch = useCallback(async () => {
    if (dataSource === 'sample') return;

    // --- foursquare+osm mode: filter pre-fetched JSON locally ---
    if (dataSource === 'foursquare+osm') {
      if (!cityData) return;
      setFetchState('loading');
      setHasSearchedOnce(true);

      const filtered = filterCityPlaces(cityData, {
        center: { lat: searchCenter.lat, lng: searchCenter.lng },
        radiusKm: selectedRadius,
        category: selectedCategory,
        searchQuery,
        sortBy,
      });

      setLivePlaces(filtered);
      setFetchState('success');
      return;
    }

    // --- Realtime API modes (foursquare / google) ---
    setFetchState('loading');
    setApiError(null);
    setHasSearchedOnce(true);

    const radiusMeters = selectedRadius === 'all' ? 50000 : selectedRadius * 1000;

    try {
      let results: NearbyPlace[] = [];

      if (dataSource === 'foursquare') {
        results = await searchFoursquare({
          center: { lat: searchCenter.lat, lng: searchCenter.lng },
          radiusMeters,
          category: selectedCategory,
          limit: 20,
        });
      } else if (dataSource === 'google') {
        results = await searchGoogle({
          center: { lat: searchCenter.lat, lng: searchCenter.lng },
          radiusMeters,
          category: selectedCategory,
          maxResultCount: 20,
        });
      }

      setLivePlaces(results);
      setFetchState('success');
    } catch (err: unknown) {
      const e = err as { type?: string; message?: string };
      setApiError({ type: e.type ?? 'UNKNOWN', message: e.message ?? String(err) });
      setFetchState('error');
    }
  }, [dataSource, searchCenter, selectedRadius, selectedCategory, cityData, searchQuery, sortBy]);

  /**
   * Auto-load city JSON when dataSource is 'foursquare+osm' and cityId changes
   */
  useEffect(() => {
    if (dataSource !== 'foursquare+osm') return;

    let cancelled = false;
    setFetchState('loading');
    setCityData(null);
    setMergeStats(null);
    setLoadedCityId(null);
    setSelectedPlaceId(null);

    loadCityPlaces(searchCenter.cityId).then(data => {
      if (cancelled) return;
      setLoadedCityId(searchCenter.cityId);
      if (data) {
        setCityData(data);
        setMergeStats(data.stats);

        // Auto-filter immediately
        const filtered = filterCityPlaces(data, {
          center: { lat: searchCenter.lat, lng: searchCenter.lng },
          radiusKm: selectedRadius,
          category: selectedCategory,
          searchQuery,
          sortBy,
        });
        setLivePlaces(filtered);
        setFetchState('success');
        setHasSearchedOnce(true);
      } else {
        // No pre-fetched data for this city → fallback to sample
        setCityData(null);
        setMergeStats(null);
        setLivePlaces([]);
        setFetchState('idle');
      }
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSource, searchCenter.cityId]);

  /**
   * Trigger search với debounce khi filter thay đổi.
   * KHÔNG trigger khi selectedPlaceId thay đổi.
   */
  useEffect(() => {
    if (dataSource === 'sample' || dataSource === 'foursquare+osm') return;
    if (!hasSearchedOnce) return;

    if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    filterDebounceRef.current = setTimeout(() => {
      executeSearch();
    }, dataSource === 'foursquare+osm' ? 200 : 800);

    return () => {
      if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedRadius, searchQuery, sortBy, dataSource, searchCenter]);

  /** Chuyển về sample mode và báo rõ (không âm thầm) */
  const handleFallbackToSample = () => {
    setDataSource('sample');
    setFetchState('idle');
    setApiError(null);
    setLivePlaces([]);
    setCityData(null);
    setMergeStats(null);
  };

  // Alias cũ cho executeGoogleSearch (dùng trong handleSearchThisArea)
  const executeGoogleSearch = executeSearch;

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
      preferCanvas: true,
    });

    // OpenStreetMap base tiles for every nearby-place data source.
    leafletLib
      .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
      const activeCenter = searchCenterRef.current;
      const dist = Math.hypot(center.lat - activeCenter.lat, center.lng - activeCenter.lng);
      setHasMapMovedAway(dist > 0.005);
    });
    map.on('zoomend', () => setMapZoom(map.getZoom()));

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.stop();
    if (map.getContainer().clientWidth > 0) map.invalidateSize();
  }, [mobileView]);

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
    clusterMarkersRef.current.forEach(marker => marker.remove());
    clusterMarkersRef.current = [];

    const clusteredIds = new Set<string>();
    if (mapZoom <= 15 && places.length > 40) {
      const grid = new Map<string, NearbyPlace[]>();
      for (const place of places) {
        if (place.id === selectedPlaceId) continue;
        const point = map.latLngToContainerPoint([place.coordinates.lat, place.coordinates.lng]);
        const key = `${Math.floor(point.x / 88)}:${Math.floor(point.y / 88)}`;
        const group = grid.get(key) || [];
        group.push(place);
        grid.set(key, group);
      }
      for (const group of grid.values()) {
        if (group.length < 2) continue;
        group.forEach(place => clusteredIds.add(place.id));
        const lat = group.reduce((sum, place) => sum + place.coordinates.lat, 0) / group.length;
        const lng = group.reduce((sum, place) => sum + place.coordinates.lng, 0) / group.length;
        const icon = leafletLib.divIcon({
          className: 'nearby-cluster-marker',
          html: `<span class="flex items-center justify-center w-9 h-9 rounded-full bg-[#FF385C] text-white font-bold text-xs border-[3px] border-white shadow-lg">${group.length}</span>`,
          iconSize: [36, 36], iconAnchor: [18, 18],
        });
        const marker = leafletLib.marker([lat, lng], { icon }).addTo(map).on('click', () => {
          map.fitBounds(leafletLib.latLngBounds(group.map(place => [place.coordinates.lat, place.coordinates.lng])), { maxZoom: 16, padding: [48, 48] });
        });
        clusterMarkersRef.current.push(marker);
      }
    }

    places.forEach((place) => {
      if (clusteredIds.has(place.id)) return;
      const isSelected = place.id === selectedPlaceId;
      if (places.length > 100 && !isSelected) {
        const label = document.createElement('span');
        label.textContent = place.name;
        const marker = leafletLib.circleMarker([place.coordinates.lat, place.coordinates.lng], {
          radius: 4, color: '#ffffff', weight: 1, fillColor: '#e34263', fillOpacity: 0.8,
        }).addTo(map).bindTooltip(label).on('click', () => {
          setSelectedPlaceId(place.id);
          placeCardsRef.current[place.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        markersMapRef.current[place.id] = marker;
        return;
      }

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
      const safeName = document.createElement('span');
      safeName.textContent = place.name;
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
            <span class="max-w-[100px] truncate text-[11px]">${safeName.innerHTML}</span>
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
  }, [places, selectedPlaceId, mapZoom]);

  useEffect(() => {
    if (chatProvinceId && places.length && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(places.map(p => [p.coordinates.lat, p.coordinates.lng] as [number, number]), { padding: [40, 40], maxZoom: 14 });
    }
  }, [chatProvinceId, places]);

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
    const nearestCity = findNearestCity(currentMapCenter.lat, currentMapCenter.lng);
    setSearchCenter({
      lat: currentMapCenter.lat,
      lng: currentMapCenter.lng,
      name: 'Khu vực trên bản đồ',
      cityId: nearestCity.id,
      isRealUser: false,
    });
    setHasMapMovedAway(false);
    // Live mode: trigger search người dùng xác nhận khu vực mới
    if (dataSource !== 'sample' && dataSource !== 'foursquare+osm') {
      executeSearch();
    }
    // foursquare+osm: auto-loads via useEffect on cityId change
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
    <div className="min-h-[calc(100vh-110px)] bg-white text-[#222222] flex flex-col relative">
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
          } max-h-none lg:max-h-[calc(100vh-110px)] overflow-hidden`}
        >
          {/* Top Sticky Header: Search Bar & Area Indicator */}
          <div className="p-4 sm:p-5 border-b border-[#E5E5E5] bg-white shrink-0 space-y-3">
            {chatProvinceId && (
              <div className="text-xs text-[#717171] flex items-center justify-between gap-2">
                <span>Gợi ý từ cuộc chat: {initialChatFocus?.context.destination}</span>
                {recommendedIds.length > 0 && <button className="underline" onClick={() => setRecommendedIds([])}>Xem tất cả</button>}
              </div>
            )}
            {/* Search Input Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-[#717171] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && dataSource !== 'sample') {
                    executeSearch();
                  }
                }}
                placeholder={
                  dataSource === 'foursquare'
                    ? 'Tìm địa điểm, món ăn, cà phê... (Enter để tìm)'
                    : dataSource === 'google'
                    ? 'Tìm địa điểm... (Enter để tìm)'
                    : 'Tìm địa điểm, món ăn, cà phê, di tích...'
                }
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

            {/* Live Mode: nút tìm kiếm rõ ràng (Foursquare hoặc Google — NOT foursquare+osm) */}
            {dataSource !== 'sample' && dataSource !== 'foursquare+osm' && (
              <button
                onClick={executeSearch}
                disabled={fetchState === 'loading'}
                className="w-full flex items-center justify-center gap-2 py-2 bg-[#FF385C] hover:bg-[#E00B41] disabled:bg-[#E5E5E5] text-white disabled:text-[#717171] rounded-full text-xs font-bold transition-colors cursor-pointer"
              >
                {fetchState === 'loading' ? (
                  <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Đang tìm...</span></>
                ) : (
                  <><Search className="w-3.5 h-3.5" /><span>Tìm quanh đây</span></>
                )}
              </button>
            )}

            {/* Category Filter Pills (Horizontal Scroll) */}
            <div className="relative after:pointer-events-none after:absolute after:right-0 after:top-0 after:bottom-1 after:w-7 after:bg-gradient-to-l after:from-white after:to-transparent">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
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
                  disabled={dataSource === 'foursquare+osm' && !usingSample}
                  title={dataSource === 'foursquare+osm' && !usingSample ? 'Chưa có trạng thái mở cửa hiện tại' : undefined}
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
          <div className="px-4 py-2 bg-[#F7F7F7]/60 border-b border-[#E5E5E5] flex flex-col gap-1 text-xs shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-[#FF385C] shrink-0"></span>
                <span className="font-bold text-[#222222] truncate">
                  {searchCenter.isRealUser
                    ? 'Gần bạn'
                    : searchCenter.name}
                </span>
                <span className="text-[#717171] text-[11px] shrink-0">
                  • {places.length} địa điểm
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
              {/* Locate Button */}
              <button
                onClick={handleRequestUserLocation}
                disabled={geoState === 'locating'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-stone-50 border border-[#E5E5E5] text-[#222222] text-xs font-bold shadow-2xs hover:shadow-xs transition-all cursor-pointer shrink-0"
                title="Sử dụng vị trí của tôi"
              >
                <LocateFixed className={`w-3.5 h-3.5 text-[#FF385C] ${geoState === 'locating' ? 'animate-spin' : ''}`} />
                <span className={geoState === 'located' ? 'sr-only' : 'hidden sm:inline'}>
                  {geoState === 'locating' ? 'Đang định vị...' : geoState === 'located' ? 'Định vị lại' : 'Vị trí của tôi'}
                </span>
              </button>
              </div>
            </div>

            <select aria-label="Chọn thành phố" value={searchCenter.cityId}
              onChange={event => { const area = POPULAR_AREAS.find(city => city.id === event.target.value); if (area) handleSelectArea(area); }}
              className="lg:hidden w-full bg-white border border-[#D1D1D1] rounded-lg px-2 py-1 text-xs font-semibold">
              {POPULAR_AREAS.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </div>

          {/* Geolocation Explanation & Permission Notice (If not located) */}
          {geoState === 'denied' && showGeoNotice && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center gap-2 shrink-0">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1">{geoErrorMessage || 'Chưa nhận được vị trí'}</span>
              <button aria-label="Đóng thông báo vị trí" onClick={() => setShowGeoNotice(false)}><X className="w-4 h-4" /></button>
            </div>
          )}

          {/* Live Mode: empty state khi chưa tìm lần nào (KHÔNG hiện cho foursquare+osm vì auto-load) */}
          {dataSource !== 'sample' && dataSource !== 'foursquare+osm' && !hasSearchedOnce && fetchState !== 'loading' && (
            <div className="p-4 m-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-blue-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shrink-0">
              <div className="space-y-0.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-900">
                  <Search className="w-4 h-4 text-[#FF385C]" />
                  <span>
                    Nhấn "Tìm quanh đây" để xem địa điểm thực
                    {dataSource === 'foursquare' ? ' từ Foursquare' : ' từ Google'}
                  </span>
                </div>
                <p className="text-[11px] text-blue-800">
                  Kết quả tìm kiếm theo vị trí thực, cập nhật theo thời gian thực.
                </p>
              </div>
              <button
                onClick={executeSearch}
                disabled={fetchState === 'loading'}
                className="px-4 py-2 bg-[#222222] hover:bg-black text-white rounded-full font-bold text-xs shrink-0 cursor-pointer shadow-xs"
              >
                Tìm quanh đây
              </button>
            </div>
          )}

          {/* foursquare+osm: no data for this city */}
          {dataSource === 'foursquare+osm' && !cityData && fetchState !== 'loading' && (
            <div className="p-4 m-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shrink-0">
              <div className="space-y-0.5">
                <div className="font-bold flex items-center gap-1.5 text-amber-900">
                  <Info className="w-4 h-4" />
                  <span>Đang hiển thị dữ liệu mẫu cho {searchCenter.name}</span>
                </div>
                <p className="text-[11px] text-amber-800">
                  Dữ liệu địa điểm của khu vực này chưa được cập nhật.
                </p>
              </div>
              <button
                onClick={handleFallbackToSample}
                className="px-4 py-2 bg-[#222222] hover:bg-black text-white rounded-full font-bold text-xs shrink-0 cursor-pointer shadow-xs"
              >
                Dùng dữ liệu mẫu
              </button>
            </div>
          )}

          {/* Places Scrollable List */}
          <div className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4 space-y-3.5">
            {places.length === 0 ? (
              <div className="py-16 text-center space-y-3 bg-[#F7F7F7] rounded-3xl border border-[#E5E5E5] p-6">
                <Compass className="w-10 h-10 text-stone-300 mx-auto" />
                <div className="text-sm font-bold text-[#222222]">
                  {dataSource === 'foursquare+osm' && cityData?.places.length === 0
                    ? 'Chưa có dữ liệu cho khu vực này'
                    : 'Không tìm thấy địa điểm nào trong bán kính này'}
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
              places.slice(0, visiblePlaceCount).map((place) => {
                const isSelected = place.id === selectedPlaceId;
                const isWishlisted = wishlist.includes(place.id);

                return (
                  <div
                    key={place.id}
                    ref={(el) => (placeCardsRef.current[place.id] = el)}
                    onClick={() => handleSelectPlaceFromList(place)}
                    data-place-id={place.id}
                    className={`bg-white rounded-2xl border p-3 sm:p-4 flex gap-3.5 sm:gap-4 transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'border-[#222222] shadow-md ring-2 ring-[#222222]/10 bg-stone-50/40'
                        : 'border-[#E5E5E5] hover:border-stone-400 hover:shadow-xs'
                    }`}
                  >
                    {/* Thumbnail Image */}
                    <button type="button" aria-label={`Xem chi tiết ${place.name}`} onClick={(e) => { e.stopPropagation(); onSelectItem(place.sourceItem); }} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden shrink-0 bg-stone-100 text-left">
                      <div className="absolute inset-0 flex items-center justify-center bg-rose-50 p-2 text-center text-[11px] font-semibold text-rose-700">Chưa có ảnh địa điểm</div>
                      {!place.isPlaceholderImage && place.imageUrl && <img
                        src={place.imageUrl}
                        alt={place.name}
                        className="relative w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={e => { e.currentTarget.style.display = 'none'; }}
                      />}
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex flex-wrap items-center gap-1">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-xs text-white uppercase">
                          {place.categoryGroup === 'food'
                            ? 'Ẩm thực'
                            : place.categoryGroup === 'cafe'
                            ? 'Cà phê'
                            : place.categoryGroup === 'sightseeing'
                            ? 'Thắng cảnh'
                            : place.categoryGroup === 'culture'
                            ? 'Văn hóa'
                            : place.categoryGroup === 'stay'
                            ? 'Lưu trú'
                            : 'Mua sắm'}
                        </span>
                      </div>
                    </button>

                    {/* Information Content */}
                    <div className="flex-1 min-w-0 space-y-1.5 flex flex-col justify-between">
                      <div>
                        {/* Title & Heart Button */}
                        <div className="flex items-start justify-between gap-2">
                          <button type="button" onClick={(e) => { e.stopPropagation(); onSelectItem(place.sourceItem); }} className="text-sm font-bold text-[#222222] truncate group-hover:text-[#FF385C] transition-colors text-left">
                            {place.name}
                          </button>
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
                            {place.distanceText ? `${searchCenter.isRealUser ? 'Cách bạn' : 'Cách tâm khu vực'} ${place.distanceText} (đường chim bay)` : ''}
                          </span>
                          {/* Rating — ẩn nếu null/0 (không fabricate) */}
                          {place.rating != null ? (
                            <div className="flex items-center gap-1 font-bold text-[#222222]">
                              <Star className="w-3.5 h-3.5 fill-[#FF385C] text-[#FF385C]" />
                              <span>{place.rating}</span>
                              {place.reviewCount ? (
                                <span className="text-[#717171] font-normal">({place.reviewCount})</span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-[#717171] text-[10px] italic">Chưa có đánh giá</span>
                          )}
                        </div>

                        {/* Opening status & Price */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-semibold ${
                              place.isOpenNow ? 'text-emerald-700' : 'text-[#595959]'
                            }`}
                          >
                            {place.isOpenNow === undefined ? 'Chưa có thông tin giờ mở cửa' : place.isOpenNow ? '● Đang mở cửa' : '○ Đã đóng cửa'}
                          </span>
                          {place.priceDisplay && (
                            <span className="font-extrabold text-[#222222]">
                              {place.priceDisplay}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
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

                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {places.length > visiblePlaceCount && (
              <button onClick={() => setVisiblePlaceCount(count => count + 50)}
                className="w-full py-3 text-sm font-semibold border border-[#E5E5E5] rounded-lg hover:bg-stone-50">
                Xem thêm địa điểm ({places.length - visiblePlaceCount})
              </button>
            )}
            <details className="text-xs text-[#595959] border-t border-[#E5E5E5] pt-3">
              <summary className="cursor-pointer font-semibold">Thông tin dữ liệu</summary>
              <div className="pt-2 space-y-1">
                <p>Nguồn: {cityData ? [cityData.attribution.foursquare, cityData.attribution.osm].filter(Boolean).join(' + ') : usingSample ? 'Dữ liệu mẫu' : dataSource}</p>
                {mergeStats && <p>{mergeStats.fromFoursquare} Foursquare · {mergeStats.fromOSM} OpenStreetMap · {mergeStats.merged} đã gộp · {mergeStats.needsReview} cần kiểm tra</p>}
                {cityData?.fetchedAt && <p>Cập nhật: {new Date(cityData.fetchedAt).toLocaleDateString('vi-VN')}</p>}
                {(hasPreFetchedData() || !IS_SAMPLE_MODE) && <button onClick={() => {
                  const modes: DataSourceType[] = ['foursquare+osm', 'sample'];
                  if (!IS_SAMPLE_MODE) modes.push(DEFAULT_DATA_SOURCE);
                  const next = modes[(modes.indexOf(dataSource) + 1) % modes.length];
                  setDataSource(next); setLivePlaces([]); setFetchState('idle'); setApiError(null);
                  setHasSearchedOnce(false); setCityData(null); setMergeStats(null);
                }} className="font-semibold underline">Đổi nguồn dữ liệu</button>}
              </div>
            </details>
          </div>
        </div>

        {/* =================================================================== */}
        {/* RIGHT COLUMN: Interactive Leaflet Map (60% Desktop, Full on Mobile) */}
        {/* =================================================================== */}
        <div
          className={`w-full lg:w-[58%] xl:w-[60%] relative flex-none lg:flex-1 ${
            mobileView === 'list' ? 'hidden lg:block' : 'block'
          } h-[calc(100dvh-154px)] lg:h-[calc(100vh-110px)] bg-stone-100`}
        >
          {/* OpenStreetMap map canvas for every place data source */}
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Error Banner — API lỗi (KHÔNG âm thầm fallback) */}
          {dataSource !== 'sample' && fetchState === 'error' && apiError && (
            <div className="absolute top-4 left-4 right-4 z-30 bg-red-50 border border-red-200 rounded-2xl p-3 shadow-lg flex items-start justify-between gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-red-700">
                    {apiError.type === 'QUOTA_EXCEEDED'
                      ? `Đã hết quota ${dataSource === 'foursquare' ? 'Foursquare' : 'Google'} hôm nay`
                      : apiError.type === 'AUTH_FAILED'
                      ? 'API key không hợp lệ'
                      : apiError.type === 'NETWORK'
                      ? 'Không thể kết nối mạng'
                      : 'Lỗi không xác định'}
                  </p>
                  <p className="text-[11px] text-red-600">{apiError.message}</p>
                </div>
              </div>
              <button
                onClick={handleFallbackToSample}
                className="text-[11px] font-bold text-red-600 hover:text-red-800 underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                Dùng dữ liệu mẫu
              </button>
            </div>
          )}

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

          {/* Compact city picker */}
          <div className="hidden sm:flex absolute bottom-6 left-6 z-20 bg-white/95 backdrop-blur-md rounded-xl p-2 border border-[#D1D1D1] shadow-lg items-center gap-2 text-xs">
            <span className="font-bold text-[#595959]">Thành phố</span>
            <select aria-label="Đến nhanh thành phố" value={searchCenter.cityId}
              onChange={event => { const area = POPULAR_AREAS.find(city => city.id === event.target.value); if (area) handleSelectArea(area); }}
              className="bg-white border border-[#D1D1D1] rounded-lg px-2 py-1 font-semibold text-[#222222]">
              {POPULAR_AREAS.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </div>

          {/* Attribution footer — Foursquare + OSM */}
          {dataSource === 'foursquare+osm' && cityData && (
            <div className="absolute bottom-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-sm px-4 py-1.5 text-[9px] text-[#717171] border-t border-[#E5E5E5] flex items-center justify-center gap-1">
              <span>Nguồn: {[cityData.attribution.foursquare, cityData.attribution.osm].filter(Boolean).join(' + ')}</span>
            </div>
          )}

          {/* Floating Selected Place Card at Bottom (Mobile and Desktop Peek) */}
          {selectedPlace && (
            <div className="absolute bottom-24 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-30 bg-white rounded-3xl border border-[#E5E5E5] p-4 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-50 text-[#FF385C]">
                    {selectedPlace.categoryLabel}
                  </span>
                  <span className="text-[11px] font-bold text-[#717171]">
                    {selectedPlace.distanceText ? `• ${searchCenter.isRealUser ? 'Cách bạn' : 'Cách tâm khu vực'} ${selectedPlace.distanceText}` : ''}
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
                <button type="button" onClick={() => onSelectItem(selectedPlace.sourceItem)} aria-label={`Xem chi tiết ${selectedPlace.name}`} className="relative w-20 h-20 shrink-0 text-left">
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-rose-50 text-xs font-semibold text-rose-700">Chưa có ảnh địa điểm</div>
                  {!selectedPlace.isPlaceholderImage && selectedPlace.imageUrl && <img src={selectedPlace.imageUrl} alt={selectedPlace.name} className="relative w-full h-full rounded-2xl object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} />}
                </button>
                <div className="flex-1 min-w-0 space-y-1">
                  <button type="button" onClick={() => onSelectItem(selectedPlace.sourceItem)} className="text-xs sm:text-sm font-bold text-[#222222] truncate text-left w-full hover:text-[#FF385C]">
                    {selectedPlace.name}
                  </button>
                  <p className="text-[11px] text-[#717171] truncate">{selectedPlace.address}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-[#FF385C]">
                      {selectedPlace.priceDisplay || 'Chưa có giá'}
                    </span>
                    {selectedPlace.rating != null && <>
                    <span className="text-stone-300">•</span>
                    <span className="flex items-center gap-0.5 text-[#222222] font-semibold text-[11px]">
                      <Star className="w-3 h-3 fill-[#FF385C] text-[#FF385C]" />
                      {selectedPlace.rating}
                    </span>
                    </>}
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

                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Floating Pill Button: Switch between Map and List (Airbnb style) */}
      <div className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 z-30">
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
