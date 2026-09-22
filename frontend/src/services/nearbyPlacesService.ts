import { PROVINCES } from '../data/vietnamData';
import { DetailItem } from '../components/ItemDetailModal';

export type PlaceCategoryGroup = 'all' | 'food' | 'cafe' | 'sightseeing' | 'culture' | 'shopping';

/** Nhận dạng nguồn dữ liệu — dùng để phân biệt với Google Places */
export const DATA_SOURCE_ID = 'local-sample' as const;

export interface NearbyPlace {
  id: string;
  name: string;
  subtitle?: string;
  categoryGroup: PlaceCategoryGroup;
  categoryLabel: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  provinceName: string;
  provinceId: string;
  imageUrl: string;
  rating: number | null;
  reviewCount: number | null;
  openingHours?: string;
  isOpenNow?: boolean;
  priceDisplay?: string;
  ticketPrice?: number;
  avgPrice?: number;
  description: string;
  localTips?: string;
  tags: string[];
  distanceKm?: number;
  distanceText?: string;
  sourceItem: DetailItem;
  /**
   * Google place_id — chỉ có khi địa điểm đến từ Google Places API.
   * Dùng để lazy-fetch Place Details khi mở ItemDetailModal.
   * Không có với dữ liệu mẫu (vietnamData.ts).
   */
  googlePlaceId?: string;

  // --- Multi-source fields (Foursquare + OSM pre-fetch) ---

  /** Nguồn dữ liệu gốc */
  dataSource?: 'foursquare' | 'osm' | 'merged' | 'sample' | 'google';

  /** Foursquare place ID — giữ để đối chiếu */
  foursquareId?: string;

  /** OSM element ID (e.g. "node/123456") — giữ để đối chiếu */
  osmId?: string;

  /** true nếu ảnh là minh họa (chưa có ảnh thật) — UI cần ghi rõ */
  isPlaceholderImage?: boolean;

  /** true nếu merge có conflict cần kiểm tra thủ công */
  needsReview?: boolean;

  /** Số điện thoại */
  phone?: string;

  /** Website */
  website?: string;
}

// Earth's radius in kilometers
const EARTH_RADIUS_KM = 6371;

/**
 * Calculates straight-line distance using the Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Formats distance with unit (meters or km)
 */
export function formatDistanceKm(km: number): string {
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  return `${km.toFixed(1)} km`;
}

/**
 * Checks if a place is open based on hours string (e.g., "07:00 - 22:00" or "Cả ngày")
 */
export function checkIsOpenNow(openingHours?: string): boolean {
  if (!openingHours) return true; // Default open if unspecified
  const lower = openingHours.toLowerCase();
  if (lower.includes('cả ngày') || lower.includes('24/7') || lower.includes('24h')) {
    return true;
  }

  // Look for standard HH:mm - HH:mm
  const match = openingHours.match(/(\d{1,2})[:h](\d{2})?\s*-\s*(\d{1,2})[:h](\d{2})?/);
  if (!match) return true;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const startHour = parseInt(match[1], 10);
  const startMin = match[2] ? parseInt(match[2], 10) : 0;
  const endHour = parseInt(match[3], 10);
  const endMin = match[4] ? parseInt(match[4], 10) : 0;

  const startTotal = startHour * 60 + startMin;
  let endTotal = endHour * 60 + endMin;

  // Handle overnight opening (e.g. 18:00 - 02:00)
  if (endTotal < startTotal) {
    endTotal += 24 * 60;
    const adjustedCurrent = currentMinutes < startTotal ? currentMinutes + 24 * 60 : currentMinutes;
    return adjustedCurrent >= startTotal && adjustedCurrent <= endTotal;
  }

  return currentMinutes >= startTotal && currentMinutes <= endTotal;
}

/**
 * Determines category group for unified filtering
 */
function classifyCategory(
  itemType: 'poi' | 'food' | 'festival',
  categoryStr: string,
  nameStr: string,
  tags: string[] = []
): { group: PlaceCategoryGroup; label: string } {
  const combined = (categoryStr + ' ' + nameStr + ' ' + tags.join(' ')).toLowerCase();

  // 1. Cafe & Drinks
  if (
    combined.includes('cà phê') ||
    combined.includes('cafe') ||
    combined.includes('trà') ||
    combined.includes('coffee') ||
    combined.includes('đồ uống')
  ) {
    return { group: 'cafe', label: 'Cà phê & Đồ uống' };
  }

  // 2. Shopping & Markets
  if (
    combined.includes('chợ') ||
    combined.includes('mua sắm') ||
    combined.includes('làng gốm') ||
    combined.includes('làng lụa') ||
    combined.includes('đặc sản làm quà') ||
    combined.includes('market') ||
    combined.includes('souvenir')
  ) {
    return { group: 'shopping', label: 'Mua sắm & Đặc sản' };
  }

  // 3. Culture, Heritage & Spiritual
  if (
    itemType === 'festival' ||
    combined.includes('văn hóa') ||
    combined.includes('di sản') ||
    combined.includes('tâm linh') ||
    combined.includes('đền') ||
    combined.includes('chùa') ||
    combined.includes('nhà tù') ||
    combined.includes('lăng') ||
    combined.includes('bảo tàng') ||
    combined.includes('tháp') ||
    combined.includes('thành cổ') ||
    combined.includes('miếu')
  ) {
    return { group: 'culture', label: 'Văn hóa & Di sản' };
  }

  // 4. Food spots
  if (itemType === 'food') {
    return { group: 'food', label: 'Ẩm thực & Quán ngon' };
  }

  // 5. Sightseeing & Nature
  return { group: 'sightseeing', label: 'Tham quan & Cảnh quan' };
}

/**
 * Builds the entire master list of places across all provinces in Vietnam
 */
export function getAllNearbyPlaces(): NearbyPlace[] {
  const places: NearbyPlace[] = [];

  PROVINCES.forEach((province) => {
    // 1. POIs
    province.pois.forEach((poi) => {
      const { group, label } = classifyCategory('poi', poi.category, poi.name, poi.tags);
      places.push({
        id: poi.id,
        name: poi.name,
        subtitle: poi.category,
        categoryGroup: group,
        categoryLabel: label,
        coordinates: poi.coordinates,
        address: poi.address,
        provinceName: province.name,
        provinceId: province.id,
        imageUrl: poi.imageUrl,
        rating: poi.rating || 4.7,
        reviewCount: poi.reviewCount || 350,
        openingHours: poi.openingHours,
        isOpenNow: checkIsOpenNow(poi.openingHours),
        ticketPrice: poi.ticketPrice,
        priceDisplay: poi.ticketPrice === 0 ? 'Miễn phí vé' : `${poi.ticketPrice.toLocaleString('vi-VN')} đ`,
        description: poi.description,
        localTips: poi.localTips,
        tags: poi.tags || [],
        sourceItem: { itemType: 'poi', ...poi }
      });
    });

    // 2. Foods
    province.foods.forEach((food) => {
      const { group, label } = classifyCategory('food', food.category, food.name + ' ' + food.dishName, [food.signatureDish]);
      places.push({
        id: food.id,
        name: food.dishName,
        subtitle: food.name,
        categoryGroup: group,
        categoryLabel: label,
        coordinates: food.coordinates,
        address: food.address,
        provinceName: province.name,
        provinceId: province.id,
        imageUrl: food.imageUrl,
        rating: food.rating || 4.8,
        reviewCount: food.reviewCount || 520,
        openingHours: food.bestTime ? `${food.bestTime} (Thời điểm ngon nhất)` : '07:00 - 22:00',
        isOpenNow: true,
        avgPrice: food.avgPrice,
        priceDisplay: food.priceRange || `${food.avgPrice.toLocaleString('vi-VN')} đ`,
        description: food.description,
        localTips: food.isLocalFavorite ? `Quán chuẩn bản địa • ${food.signatureDish}` : food.signatureDish,
        tags: [food.dishName, food.category],
        sourceItem: { itemType: 'food', ...food }
      });
    });

    // 3. Festivals & Cultural Events
    if (province.festivals) {
      province.festivals.forEach((fest) => {
        if (!fest.coordinates) return;
        places.push({
          id: fest.id,
          name: fest.name,
          subtitle: `Lễ hội • ${fest.solarDate}`,
          categoryGroup: 'culture',
          categoryLabel: 'Lễ hội & Sự kiện',
          coordinates: fest.coordinates,
          address: province.name,
          provinceName: province.name,
          provinceId: province.id,
          imageUrl: fest.imageUrl || province.imageUrl,
          rating: 4.9,
          reviewCount: 180,
          openingHours: 'Theo mùa sự kiện',
          isOpenNow: true,
          ticketPrice: 0,
          priceDisplay: 'Miễn phí tham gia',
          description: fest.description,
          localTips: `Quy mô: ${fest.scale}. Trang phục: ${fest.dressCode}`,
          tags: fest.highlights || ['lễ hội'],
          sourceItem: { itemType: 'festival', ...fest }
        });
      });
    }
  });

  return places;
}

export interface QueryNearbyOptions {
  center: { lat: number; lng: number };
  radiusKm: number | 'all';
  category: PlaceCategoryGroup;
  searchQuery?: string;
  sortBy: 'nearest' | 'rating';
  onlyOpenNow?: boolean;
}

/**
 * Queries and calculates distances from center, applies filters, and sorts
 */
export function queryNearbyPlaces(options: QueryNearbyOptions): NearbyPlace[] {
  const allPlaces = getAllNearbyPlaces();
  const { center, radiusKm, category, searchQuery, sortBy, onlyOpenNow } = options;
  const queryLower = (searchQuery || '').trim().toLowerCase();

  const processed = allPlaces.map((place) => {
    const dist = calculateDistanceKm(
      center.lat,
      center.lng,
      place.coordinates.lat,
      place.coordinates.lng
    );
    return {
      ...place,
      distanceKm: dist,
      distanceText: formatDistanceKm(dist),
      isOpenNow: checkIsOpenNow(place.openingHours)
    };
  });

  // Filter
  const filtered = processed.filter((place) => {
    // 1. Search Query
    if (queryLower) {
      const matchName = place.name.toLowerCase().includes(queryLower);
      const matchSubtitle = (place.subtitle || '').toLowerCase().includes(queryLower);
      const matchAddr = place.address.toLowerCase().includes(queryLower);
      const matchProv = place.provinceName.toLowerCase().includes(queryLower);
      const matchTags = place.tags.some((t) => t.toLowerCase().includes(queryLower));
      if (!matchName && !matchSubtitle && !matchAddr && !matchProv && !matchTags) {
        return false;
      }
    }

    // 2. Category
    if (category !== 'all' && place.categoryGroup !== category) {
      return false;
    }

    // 3. Open Now
    if (onlyOpenNow && !place.isOpenNow) {
      return false;
    }

    // 4. Radius Filter
    if (radiusKm !== 'all' && place.distanceKm !== undefined) {
      if (place.distanceKm > radiusKm) {
        return false;
      }
    }

    return true;
  });

  // Sort
  filtered.sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    // Default nearest
    return (a.distanceKm || 0) - (b.distanceKm || 0);
  });

  return filtered;
}
