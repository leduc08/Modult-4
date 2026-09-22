/**
 * GoogleMapView.tsx — Component Google Maps JS API riêng biệt.
 *
 * Chỉ được render khi IS_SAMPLE_MODE = false (có API key).
 * Không thay tile URL của Leaflet. Đây là component độc lập hoàn toàn.
 *
 * Đồng bộ 2 chiều:
 *   - Click marker → gọi onSelectPlace → NearbyPage cập nhật selectedPlaceId
 *   - selectedPlaceId thay đổi → marker được highlight (không trigger API call)
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { GOOGLE_MAPS_API_KEY } from '../config/maps';
import { NearbyPlace } from '../services/nearbyPlacesService';

interface GoogleMapViewProps {
  center: { lat: number; lng: number };
  places: NearbyPlace[];
  selectedPlaceId: string | null;
  onSelectPlace: (placeId: string) => void;
  userCoords?: { lat: number; lng: number; accuracy?: number } | null;
  onMapMoveEnd?: (center: { lat: number; lng: number }) => void;
}

// Singleton để tránh load script nhiều lần
let googleMapsScriptLoaded = false;
let googleMapsScriptLoading = false;
const scriptLoadCallbacks: (() => void)[] = [];

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.maps) {
      resolve();
      return;
    }
    if (googleMapsScriptLoaded) {
      resolve();
      return;
    }
    if (googleMapsScriptLoading) {
      scriptLoadCallbacks.push(resolve);
      return;
    }

    googleMapsScriptLoading = true;
    scriptLoadCallbacks.push(resolve);

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleMapsScriptLoaded = true;
      googleMapsScriptLoading = false;
      scriptLoadCallbacks.forEach((cb) => cb());
      scriptLoadCallbacks.length = 0;
    };
    script.onerror = () => {
      googleMapsScriptLoading = false;
      reject(new Error('Không thể load Google Maps script'));
    };
    document.head.appendChild(script);
  });
}

/** Emoji icon theo category */
function getCategoryEmoji(category: NearbyPlace['categoryGroup']): string {
  const map: Record<string, string> = {
    food: '🍲',
    cafe: '☕',
    sightseeing: '🏛️',
    culture: '⛩️',
    shopping: '🛍️',
    all: '📍',
  };
  return map[category] ?? '📍';
}

/** Tạo HTML cho marker dạng Airbnb pill */
function createMarkerHtml(place: NearbyPlace, isSelected: boolean): string {
  const emoji = getCategoryEmoji(place.categoryGroup);
  const bgClass = isSelected ? 'bg-[#222222] text-white' : 'bg-white text-[#222222]';
  const borderClass = isSelected ? 'border-[#222222]' : 'border-[#E5E5E5]';
  const shadowClass = isSelected ? 'shadow-xl' : 'shadow-md';
  const scale = isSelected ? 'scale-125' : '';

  return `
    <div style="
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'};
      transition: transform 0.15s ease;
      cursor: pointer;
    ">
      <div style="
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 700;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        border: 1.5px solid ${isSelected ? '#222222' : '#E5E5E5'};
        background: ${isSelected ? '#222222' : '#ffffff'};
        color: ${isSelected ? '#ffffff' : '#222222'};
        box-shadow: ${isSelected ? '0 4px 16px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.12)'};
        max-width: 120px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      ">
        <span>${emoji}</span>
        <span style="max-width: 90px; overflow: hidden; text-overflow: ellipsis;">${place.name}</span>
      </div>
      <div style="
        width: 8px;
        height: 8px;
        margin-top: -4px;
        transform: rotate(45deg);
        background: ${isSelected ? '#222222' : '#ffffff'};
        border-right: 1.5px solid ${isSelected ? '#222222' : '#E5E5E5'};
        border-bottom: 1.5px solid ${isSelected ? '#222222' : '#E5E5E5'};
      "></div>
    </div>
  `;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  center,
  places,
  selectedPlaceId,
  onSelectPlace,
  userCoords,
  onMapMoveEnd,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<Map<string, any>>(new Map());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null);
  const isInitializedRef = useRef(false);

  // 1. Load Google Maps JS script & khởi tạo map
  useEffect(() => {
    if (!mapContainerRef.current || isInitializedRef.current) return;

    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      .then(() => {
        if (!mapContainerRef.current || isInitializedRef.current) return;
        isInitializedRef.current = true;

        const map = new window.google.maps.Map(mapContainerRef.current, {
          center: { lat: center.lat, lng: center.lng },
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_BOTTOM,
          },
          mapId: 'DEMO_MAP_ID', // Cần mapId cho AdvancedMarkerElement
          gestureHandling: 'greedy',
        });

        // Lắng nghe moveend
        map.addListener('idle', () => {
          const c = map.getCenter();
          if (c && onMapMoveEnd) {
            onMapMoveEnd({ lat: c.lat(), lng: c.lng() });
          }
        });

        mapInstanceRef.current = map;
      })
      .catch((err) => {
        console.error('[GoogleMapView] Failed to load Google Maps:', err);
      });

    return () => {
      // Giữ map instance để tránh khởi tạo lại khi re-render
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 2. Pan map khi center thay đổi
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.panTo({ lat: center.lat, lng: center.lng });
  }, [center.lat, center.lng]);

  // 3. Render markers khi places hoặc selectedPlaceId thay đổi
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    // Xóa markers cũ
    markersRef.current.forEach((m) => (m.map = null));
    markersRef.current.clear();

    // Tạo markers mới
    places.forEach((place) => {
      const isSelected = place.id === selectedPlaceId;
      const el = document.createElement('div');
      el.innerHTML = createMarkerHtml(place, isSelected);

      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: place.coordinates.lat, lng: place.coordinates.lng },
        content: el,
        zIndex: isSelected ? 100 : 10,
        title: place.name,
      });

      marker.addListener('click', () => {
        onSelectPlace(place.id);
      });

      markersRef.current.set(place.id, marker);
    });
  }, [places, selectedPlaceId, onSelectPlace]);

  // 4. User location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    // Xóa marker user cũ
    if (userMarkerRef.current) {
      userMarkerRef.current.map = null;
      userMarkerRef.current = null;
    }

    if (!userCoords) return;

    const el = document.createElement('div');
    el.innerHTML = `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
        <span style="
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: rgba(59,130,246,0.35);
          animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;
        "></span>
        <span style="
          position: relative;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #2563eb;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></span>
      </div>
      <style>
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      </style>
    `;

    userMarkerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
      map,
      position: { lat: userCoords.lat, lng: userCoords.lng },
      content: el,
      zIndex: 200,
      title: 'Vị trí của bạn',
    });
  }, [userCoords]);

  return (
    <div
      ref={mapContainerRef}
      className="w-full h-full"
      style={{ minHeight: 400 }}
    />
  );
};

// Khai báo window.google cho TypeScript (SDK được load dynamic lúc runtime)
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google: any;
  }
}
