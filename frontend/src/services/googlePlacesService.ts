/**
 * googlePlacesService.ts — Wrapper cho Google Places API (New)
 *
 * Luồng tối ưu chi phí:
 *   1. searchNearbyPlaces()  → Nearby Search, fields cơ bản (Basic tier)
 *   2. getPlaceDetails()     → Lazy, chỉ khi mở chi tiết, có session cache
 *   3. URL builders          → Chỉ đường / xem ảnh thêm qua link (0 API call)
 *
 * KHÔNG gọi API khi:
 *   - User chọn ghim / thẻ (chỉ update selectedPlaceId)
 *   - Component re-render
 *   - Đã có cache cho place_id đó trong session
 */

import {
  GOOGLE_MAPS_API_KEY,
  PLACES_API_BASE,
  NEARBY_SEARCH_FIELDS,
  PRICE_LEVEL_DISPLAY,
  CATEGORY_TO_GOOGLE_TYPES,
} from '../config/maps';
import { NearbyPlace } from './nearbyPlacesService';
import { calculateDistanceKm, formatDistanceKm, checkIsOpenNow } from './nearbyPlacesService';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Kết quả thô từ Nearby Search */
export interface GooglePlaceRaw {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  priceLevel?: string;
  types?: string[];
  primaryType?: string;
  photos?: GooglePhoto[];
  editorialSummary?: { text: string };
  websiteUri?: string;
  nationalPhoneNumber?: string;
}

export interface GooglePhoto {
  name: string; // e.g. "places/PLACE_ID/photos/PHOTO_REF"
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: { displayName: string; uri: string; photoUri: string }[];
}

/** Chi tiết lazy-loaded khi mở ItemDetailModal */
export interface GooglePlaceDetail {
  placeId: string;
  photoUrl?: string;         // URL ảnh đã build sẵn (maxWidth=800)
  photoAttribution?: string; // tên tác giả ảnh để attribution
  websiteUri?: string;
  nationalPhoneNumber?: string;
  editorialSummary?: string;
  weekdayDescriptions?: string[];
}

/** Phân loại lỗi Google API */
export type GoogleApiError =
  | { type: 'QUOTA_EXCEEDED'; message: string }
  | { type: 'AUTH_FAILED'; message: string }
  | { type: 'NETWORK'; message: string }
  | { type: 'UNKNOWN'; message: string };

// ---------------------------------------------------------------------------
// Session cache — tránh gọi lại Place Details cho cùng place_id
// ---------------------------------------------------------------------------
const detailCache = new Map<string, GooglePlaceDetail>();

// ---------------------------------------------------------------------------
// URL Builders — không cần API key
// ---------------------------------------------------------------------------

/**
 * Link chỉ đường tới tọa độ (mở Google Maps)
 */
export function buildDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Link tìm kiếm trên Google Maps theo tên + địa chỉ
 */
export function buildSearchUrl(name: string, address: string): string {
  const q = encodeURIComponent(`${name} ${address}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/**
 * Link xem địa điểm theo place_id (nếu có)
 */
export function buildPlaceUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
}

/**
 * URL ảnh từ Place Photo API (cần API key nhưng không tính vào quota Places)
 */
export function buildPhotoUrl(photoName: string, maxWidthPx = 800): string {
  return `${PLACES_API_BASE}/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${GOOGLE_MAPS_API_KEY}&skipHttpRedirect=false`;
}

// ---------------------------------------------------------------------------
// Error parsing
// ---------------------------------------------------------------------------

function parseGoogleError(err: unknown): GoogleApiError {
  if (err instanceof Response || (err && typeof err === 'object' && 'status' in err)) {
    const status = (err as { status: number }).status;
    if (status === 429) return { type: 'QUOTA_EXCEEDED', message: 'Đã hết quota Google Maps hôm nay. Vui lòng thử lại vào ngày mai.' };
    if (status === 401 || status === 403) return { type: 'AUTH_FAILED', message: 'API key không hợp lệ hoặc chưa bật Places API (New).' };
  }
  if (err instanceof TypeError && err.message.includes('fetch')) {
    return { type: 'NETWORK', message: 'Không thể kết nối đến Google. Kiểm tra kết nối mạng.' };
  }
  return { type: 'UNKNOWN', message: String(err) };
}

// ---------------------------------------------------------------------------
// Category mapping helper
// ---------------------------------------------------------------------------

function googleTypeToCategory(primaryType?: string, types?: string[]): {
  categoryGroup: NearbyPlace['categoryGroup'];
  categoryLabel: string;
} {
  const allTypes = [primaryType, ...(types ?? [])].filter(Boolean).join(' ');

  if (/lodging|hotel|hostel|motel|campground/.test(allTypes)) return { categoryGroup: 'stay', categoryLabel: 'Lưu trú' };
  if (/cafe|coffee|tea/.test(allTypes)) return { categoryGroup: 'cafe', categoryLabel: 'Cà phê & Đồ uống' };
  if (/shopping|market|store|clothing|mall/.test(allTypes)) return { categoryGroup: 'shopping', categoryLabel: 'Mua sắm & Đặc sản' };
  if (/museum|place_of_worship|church|temple|landmark/.test(allTypes)) return { categoryGroup: 'culture', categoryLabel: 'Văn hóa & Di sản' };
  if (/restaurant|food|meal|bakery/.test(allTypes)) return { categoryGroup: 'food', categoryLabel: 'Ẩm thực & Quán ngon' };
  return { categoryGroup: 'sightseeing', categoryLabel: 'Tham quan & Cảnh quan' };
}

// ---------------------------------------------------------------------------
// 1. Nearby Search
// ---------------------------------------------------------------------------

interface SearchNearbyOptions {
  center: { lat: number; lng: number };
  radiusMeters: number;
  category: string; // key trong CATEGORY_TO_GOOGLE_TYPES
  maxResultCount?: number;
}

/**
 * Gọi Nearby Search — chỉ gọi khi user xác nhận tìm kiếm.
 * Không nên gọi hàm này khi user chỉ chọn ghim hoặc component re-render.
 */
export async function searchNearbyPlaces(
  options: SearchNearbyOptions
): Promise<NearbyPlace[]> {
  if (!GOOGLE_MAPS_API_KEY) throw { type: 'AUTH_FAILED', message: 'Chưa có Google Maps API key.' } as GoogleApiError;

  const { center, radiusMeters, category, maxResultCount = 20 } = options;
  const includedTypes = CATEGORY_TO_GOOGLE_TYPES[category] ?? [];

  const body: Record<string, unknown> = {
    locationRestriction: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: radiusMeters,
      },
    },
    maxResultCount,
    languageCode: 'vi',
  };

  if (includedTypes.length > 0) {
    body.includedTypes = includedTypes;
  }

  let response: Response;
  try {
    response = await fetch(`${PLACES_API_BASE}/places:searchNearby`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': NEARBY_SEARCH_FIELDS.join(','),
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw parseGoogleError(err);
  }

  if (!response.ok) {
    throw parseGoogleError(response);
  }

  const data = await response.json();
  const places: GooglePlaceRaw[] = data.places ?? [];

  return places.map((p) => convertToNearbyPlace(p, center));
}

// ---------------------------------------------------------------------------
// 2. Place Details — lazy, chỉ gọi khi mở chi tiết
// ---------------------------------------------------------------------------

/**
 * Lấy thêm thông tin chi tiết cho 1 địa điểm.
 * Kết quả được cache trong session — gọi lần 2 cho cùng place_id sẽ trả cache ngay.
 */
export async function getPlaceDetails(placeId: string): Promise<GooglePlaceDetail> {
  // Kiểm tra cache trước
  if (detailCache.has(placeId)) {
    return detailCache.get(placeId)!;
  }

  if (!GOOGLE_MAPS_API_KEY) throw { type: 'AUTH_FAILED', message: 'Chưa có Google Maps API key.' } as GoogleApiError;

  const fields = ['photos', 'editorialSummary', 'websiteUri', 'nationalPhoneNumber'].join(',');

  let response: Response;
  try {
    response = await fetch(`${PLACES_API_BASE}/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
        'X-Goog-FieldMask': fields,
      },
    });
  } catch (err) {
    throw parseGoogleError(err);
  }

  if (!response.ok) {
    throw parseGoogleError(response);
  }

  const data: GooglePlaceRaw = await response.json();

  // Xây dựng URL ảnh từ photo đầu tiên (chỉ 1 ảnh)
  let photoUrl: string | undefined;
  let photoAttribution: string | undefined;
  if (data.photos && data.photos.length > 0) {
    const photo = data.photos[0];
    photoUrl = buildPhotoUrl(photo.name, 800);
    photoAttribution = photo.authorAttributions?.[0]?.displayName;
  }

  const detail: GooglePlaceDetail = {
    placeId,
    photoUrl,
    photoAttribution,
    websiteUri: data.websiteUri,
    nationalPhoneNumber: data.nationalPhoneNumber,
    editorialSummary: data.editorialSummary?.text,
    weekdayDescriptions: data.currentOpeningHours?.weekdayDescriptions,
  };

  // Lưu vào session cache
  detailCache.set(placeId, detail);

  return detail;
}

/** Xoá session cache (dùng cho testing) */
export function clearDetailCache(): void {
  detailCache.clear();
}

// ---------------------------------------------------------------------------
// 3. Converter — map GooglePlaceRaw → NearbyPlace (shared interface)
// ---------------------------------------------------------------------------

export function convertToNearbyPlace(
  p: GooglePlaceRaw,
  searchCenter: { lat: number; lng: number }
): NearbyPlace {
  const lat = p.location?.latitude ?? 0;
  const lng = p.location?.longitude ?? 0;
  const distKm = calculateDistanceKm(searchCenter.lat, searchCenter.lng, lat, lng);
  const { categoryGroup, categoryLabel } = googleTypeToCategory(p.primaryType, p.types);

  return {
    id: p.id,
    name: p.displayName?.text ?? 'Địa điểm không rõ tên',
    subtitle: p.primaryType,
    categoryGroup,
    categoryLabel,
    coordinates: { lat, lng },
    address: p.formattedAddress ?? p.shortFormattedAddress ?? '',
    provinceName: '',
    provinceId: '',
    // Danh sách ban đầu dùng icon theo loại (không có ảnh từ Nearby Search)
    imageUrl: getDefaultImageByCategory(categoryGroup),
    rating: p.rating ?? 4.5,
    reviewCount: p.userRatingCount ?? 0,
    openingHours: p.currentOpeningHours?.weekdayDescriptions?.join('; '),
    isOpenNow: p.currentOpeningHours?.openNow ?? true,
    priceDisplay: p.priceLevel ? PRICE_LEVEL_DISPLAY[p.priceLevel] : undefined,
    description: '',
    tags: p.types?.slice(0, 5) ?? [],
    distanceKm: distKm,
    distanceText: formatDistanceKm(distKm),
    // Đây là Google place — sourceItem sẽ không có đủ fields tĩnh
    // Lưu place_id để lazy-fetch detail sau
    sourceItem: {
      itemType: 'poi',
      id: p.id,
      name: p.displayName?.text ?? '',
      address: p.formattedAddress ?? '',
      description: '',
      imageUrl: getDefaultImageByCategory(categoryGroup),
      coordinates: { lat, lng },
      category: categoryLabel,
      tags: p.types?.slice(0, 5) ?? [],
      rating: p.rating ?? 4.5,
      reviewCount: p.userRatingCount ?? 0,
      openingHours: p.currentOpeningHours?.weekdayDescriptions?.join('\n'),
      ticketPrice: 0,
      localTips: '',
      googlePlaceId: p.id,
    } as any,
    // Thêm googlePlaceId để ItemDetailModal biết cần lazy-fetch
    googlePlaceId: p.id,
  };
}

/**
 * Icon placeholder theo category — danh sách ban đầu không có ảnh thật
 * để tránh gọi Photo API cho toàn bộ kết quả search
 */
function getDefaultImageByCategory(category: NearbyPlace['categoryGroup']): string {
  const icons: Record<NearbyPlace['categoryGroup'], string> = {
    food: '/images/food-placeholder.svg',
    cafe: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&q=80&auto=format&fit=crop',
    sightseeing: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80&auto=format&fit=crop',
    culture: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&q=80&auto=format&fit=crop',
    shopping: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80&auto=format&fit=crop',
    stay: '/images/stay-placeholder.svg',
    all: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80&auto=format&fit=crop',
  };
  return icons[category];
}

export { parseGoogleError };
