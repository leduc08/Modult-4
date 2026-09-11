import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  UtensilsCrossed, 
  Sparkles, 
  Compass, 
  Layers, 
  Search, 
  Navigation, 
  Clock, 
  DollarSign, 
  Check, 
  ChevronRight,
  Filter,
  X
} from 'lucide-react';
import { PROVINCES, searchAllPOIs, searchAllFoods } from '@db/vietnamData';
import { POI, FoodSpot, FestivalEvent } from '@db/types';

interface SmartMapProps {
  onOpenBooking: (item: { name: string; type: 'table' | 'ticket'; price?: number }) => void;
  initialTarget?: { lat?: number; lng?: number; provinceName?: string };
}

export const SmartMap: React.FC<SmartMapProps> = ({
  onOpenBooking,
  initialTarget
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState('da-nang');
  const [searchQuery, setSearchQuery] = useState('');
  const [showPOIs, setShowPOIs] = useState(true);
  const [showFoods, setShowFoods] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [radiusFilter, setRadiusFilter] = useState<'all' | '1km' | '3km' | '5km'>('all');

  // Selected item modal / detail card
  const [selectedItem, setSelectedItem] = useState<{
    type: 'poi' | 'food' | 'event';
    data: any;
  } | null>(null);

  const activeProvince = PROVINCES.find(p => p.id === selectedProvinceId) || PROVINCES[1];

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if L is loaded from Leaflet script or global
    const L = (window as any).L;
    if (!L) {
      console.error('Leaflet is not loaded on window');
      return;
    }

    if (!mapInstanceRef.current) {
      const initialLat = initialTarget?.lat || activeProvince.coordinates.lat;
      const initialLng = initialTarget?.lng || activeProvince.coordinates.lng;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 13,
        zoomControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Clean, high-resolution tile layer (CartoDB Positron / OSM)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      // Keep map instance
    };
  }, []);

  // Update map markers when filters or province change
  useEffect(() => {
    const L = (window as any).L;
    const map = mapInstanceRef.current;
    if (!L || !map) return;

    // Clear old markers
    markersRef.current.forEach(m => map.removeLayer(m));
    markersRef.current = [];

    // Pan map to new province center
    map.flyTo([activeProvince.coordinates.lat, activeProvince.coordinates.lng], 13, { duration: 1.2 });

    // 1. Add POI Markers (Red)
    if (showPOIs) {
      activeProvince.pois.forEach(poi => {
        if (searchQuery && !poi.name.toLowerCase().includes(searchQuery.toLowerCase())) return;

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `<div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold transform hover:scale-110 transition-transform cursor-pointer">🏛️</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([poi.coordinates.lat, poi.coordinates.lng], { icon: customIcon })
          .addTo(map)
          .on('click', () => {
            setSelectedItem({ type: 'poi', data: poi });
          });

        markersRef.current.push(marker);
      });
    }

    // 2. Add Food Spot Markers (Orange / Amber)
    if (showFoods) {
      activeProvince.foods.forEach(food => {
        if (searchQuery && !food.dishName.toLowerCase().includes(searchQuery.toLowerCase()) && !food.name.toLowerCase().includes(searchQuery.toLowerCase())) return;

        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `<div class="w-8 h-8 rounded-full bg-amber-500 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold transform hover:scale-110 transition-transform cursor-pointer">🍲</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([food.coordinates.lat, food.coordinates.lng], { icon: customIcon })
          .addTo(map)
          .on('click', () => {
            setSelectedItem({ type: 'food', data: food });
          });

        markersRef.current.push(marker);
      });
    }

    // 3. Add Festival Markers (Purple)
    if (showEvents && activeProvince.festivals) {
      activeProvince.festivals.forEach(fest => {
        if (!fest.coordinates) return;
        const customIcon = L.divIcon({
          className: 'custom-map-pin',
          html: `<div class="w-8 h-8 rounded-full bg-purple-600 border-2 border-white shadow-md flex items-center justify-center text-white text-xs font-bold transform hover:scale-110 transition-transform cursor-pointer">🎭</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([fest.coordinates.lat, fest.coordinates.lng], { icon: customIcon })
          .addTo(map)
          .on('click', () => {
            setSelectedItem({ type: 'event', data: fest });
          });

        markersRef.current.push(marker);
      });
    }
  }, [selectedProvinceId, showPOIs, showFoods, showEvents, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Top Filter Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Province Dropdown */}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-red-600" />
          <select
            id="map-province-select"
            value={selectedProvinceId}
            onChange={(e) => setSelectedProvinceId(e.target.value)}
            className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-hidden"
          >
            {PROVINCES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.region})
              </option>
            ))}
          </select>
        </div>

        {/* Search in map */}
        <div className="flex-1 min-w-[200px] max-w-md relative">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm địa điểm, quán ăn trên bản đồ..."
            className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:outline-hidden focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Layer Checkboxes */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPOIs}
              onChange={(e) => setShowPOIs(e.target.checked)}
              className="accent-red-600 rounded-sm"
            />
            <span className="flex items-center gap-1 text-stone-700">
              <span className="w-2 h-2 rounded-full bg-red-600"></span>
              <span>Điểm tham quan</span>
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showFoods}
              onChange={(e) => setShowFoods(e.target.checked)}
              className="accent-amber-500 rounded-sm"
            />
            <span className="flex items-center gap-1 text-stone-700">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Ẩm thực chuẩn vị</span>
            </span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showEvents}
              onChange={(e) => setShowEvents(e.target.checked)}
              className="accent-purple-600 rounded-sm"
            />
            <span className="flex items-center gap-1 text-stone-700">
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
              <span>Lễ hội & Show</span>
            </span>
          </label>
        </div>
      </div>

      {/* Map Canvas & Detail Card Overlay */}
      <div className="relative h-[650px] rounded-2xl overflow-hidden border border-stone-200 shadow-md">
        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* "Xung quanh tôi" Quick Radius Badge */}
        <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md rounded-xl p-2.5 border border-stone-200 shadow-md space-y-2">
          <div className="text-[11px] font-bold text-stone-800 flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-red-600" />
            <span>Xung quanh tôi có gì?</span>
          </div>
          <div className="flex gap-1">
            {(['all', '1km', '3km', '5km'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRadiusFilter(r)}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                  radiusFilter === r
                    ? 'bg-red-600 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {r === 'all' ? 'Toàn tỉnh' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Item Floating Detail Card */}
        {selectedItem && (
          <div className="absolute bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-20 bg-white rounded-2xl border border-stone-200 p-5 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                  selectedItem.type === 'poi' ? 'bg-red-100 text-red-700' :
                  selectedItem.type === 'food' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-700'
                }`}>
                  {selectedItem.type === 'poi' ? 'Điểm tham quan' :
                   selectedItem.type === 'food' ? 'Ẩm thực bản địa' : 'Lễ hội & Sự kiện'}
                </span>
                {selectedItem.data.isLocalFavorite && (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                    🛡️ Quán chuẩn bản địa
                  </span>
                )}
              </div>

              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-3">
              <img
                src={selectedItem.data.imageUrl}
                alt={selectedItem.data.name || selectedItem.data.dishName}
                className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-sm text-stone-900 leading-snug">
                  {selectedItem.type === 'food' ? selectedItem.data.dishName : selectedItem.data.name}
                </h3>
                {selectedItem.type === 'food' && (
                  <p className="text-xs text-stone-600 font-medium">{selectedItem.data.name}</p>
                )}
                <p className="text-[11px] text-stone-500 truncate mt-0.5">{selectedItem.data.address || selectedItem.data.location}</p>
                
                <div className="flex items-center gap-2 mt-1.5 text-xs font-bold text-red-600">
                  {selectedItem.type === 'poi' && (
                    <span>{selectedItem.data.ticketPrice === 0 ? 'Miễn phí' : `${selectedItem.data.ticketPrice.toLocaleString()}đ`}</span>
                  )}
                  {selectedItem.type === 'food' && (
                    <span className="text-amber-700">{selectedItem.data.priceRange}</span>
                  )}
                  {selectedItem.data.rating && (
                    <span className="text-stone-600 text-[11px] font-medium">★ {selectedItem.data.rating}</span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
              {selectedItem.data.description}
            </p>

            {selectedItem.data.localTips && (
              <div className="bg-amber-50 rounded-lg p-2 text-[11px] text-amber-900 border border-amber-200/60">
                <span className="font-bold">Mẹo bản địa: </span>
                <span>{selectedItem.data.localTips}</span>
              </div>
            )}

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  selectedItem.data.name + ' ' + (selectedItem.data.address || '')
                )}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-stone-600 font-semibold hover:text-stone-900 flex items-center gap-1 cursor-pointer"
              >
                <span>Google Maps</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => onOpenBooking({
                  name: selectedItem.data.name || selectedItem.data.dishName,
                  type: selectedItem.type === 'food' ? 'table' : 'ticket',
                  price: selectedItem.data.ticketPrice || selectedItem.data.avgPrice
                })}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
              >
                {selectedItem.type === 'food' ? 'Đặt bàn giữ chỗ' : 'Đặt vé ngay'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
