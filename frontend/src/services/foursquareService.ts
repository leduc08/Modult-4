/**
 * foursquareService.ts — Wrapper cho Foursquare Places API v3
 *
 * Free tier: 500 requests/ngày, không cần billing.
 * Signup: https://foursquare.com/developer/
 *
 * Luồng tối ưu (giống google flow, 0 billing):
 *   1. searchNearbyPlaces()  → Nearby Search, trả basic fields + 1 ảnh
 *   2. getPlaceDetails()     → Lazy, chỉ khi mở chi tiết, session cache
 *   3. URL builders          → Chỉ đường qua Google Maps link (0 API call)
 *
 * Tài liệu: https://docs.foursquare.com/developer/reference/place-search
 */

import { NearbyPlace } from './nearbyPlacesService';
import { calculateDistanceKm, formatDistanceKm } from './nearbyPlacesService';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const FOURSQUARE_API_KEY: string =
  ((import.meta as any).env?.VITE_FOURSQUARE_API_KEY as string) ?? '';

export const IS_FOURSQUARE_CONFIGURED: boolean = Boolean(FOURSQUARE_API_KEY);

// BASE URL: Dùng qua Proxy của Vite để vượt rào chắn CORS của Foursquare
const FSQ_BASE = '/api/foursquare';

// ---------------------------------------------------------------------------
// TYPES: FSQ OS Places API Response
// ---------------------------------------------------------------------------

export interface FoursquareCategory {
  fsq_category_id: string;
  name: string;
  short_name?: string;
  icon?: {
    prefix: string;
    suffix: string;
  };
}

export interface FoursquareLocation {
  address?: string;
  formatted_address?: string;
  locality?: string;
  region?: string;
  country?: string;
}

interface FoursquarePhoto {
  id: string;
  prefix: string;
  suffix: string;
  width?: number;
  height?: number;
}

interface FoursquareHours {
  open_now?: boolean;
  display?: string; // e.g. "Mo-Fr 08:00-22:00"
  regular?: { open: string; close: string; day: number }[];
}

export interface FoursquarePlace {
  fsq_place_id: string;
  name: string;
  latitude: number;
  longitude: number;
  categories?: FoursquareCategory[];
  location?: FoursquareLocation;
  tel?: string;
  website?: string;
  rating?: number;        // 0–10
  stats?: { total_ratings?: number; total_tips?: number };
  price?: number;         // 1 (rẻ) → 4 (đắt)
  hours?: FoursquareHours;
  photos?: FoursquarePhoto[];
  description?: string;
}

/** Chi tiết lazy-loaded khi mở ItemDetailModal */
export interface FoursquareDetail {
  placeId: string;
  photoUrl?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  description?: string;
  hoursDisplay?: string;
  openNow?: boolean;
}

/** Phân loại lỗi Foursquare API */
export type FoursquareApiError =
  | { type: 'QUOTA_EXCEEDED'; message: string }
  | { type: 'AUTH_FAILED'; message: string }
  | { type: 'NETWORK'; message: string }
  | { type: 'UNKNOWN'; message: string };

// ---------------------------------------------------------------------------
// Category mapping — Foursquare category IDs
// https://docs.foursquare.com/data-products/docs/categories
// ---------------------------------------------------------------------------

export const CATEGORY_TO_FSQ: Record<string, string> = {
  all: '',
  food: '13000',          // Food (parent)
  cafe: '13032',          // Coffee Shop
  sightseeing: '16000',   // Landmarks & Outdoors
  culture: '12000',       // Arts & Entertainment
  shopping: '17000',      // Retail
};

const FSQ_CATEGORY_TO_GROUP: Record<string, NearbyPlace['categoryGroup']> = {
  '13000': 'food',
  '13032': 'cafe',
  '13035': 'cafe',  // Tea Room
  '16000': 'sightseeing',
  '16032': 'sightseeing', // Park
  '12000': 'culture',
  '12002': 'culture', // Museum
  '17000': 'shopping',
  '17069': 'shopping', // Market
};

function fsqCategoriesToGroup(cats?: FoursquareCategory[]): {
  categoryGroup: NearbyPlace['categoryGroup'];
  categoryLabel: string;
} {
  if (!cats || cats.length === 0) return { categoryGroup: 'sightseeing', categoryLabel: 'Tham quan' };
  const cat = cats[0];
  if (/campground|camping|hotel|hostel|homestay|guesthouse|guest house|lodging|resort|motel/i.test(cat.name)) {
    return { categoryGroup: 'stay', categoryLabel: 'Lưu trú' };
  }
  const catId = cat.fsq_category_id;
  const numId = parseInt(catId, 10);
  const group = FSQ_CATEGORY_TO_GROUP[catId] ??
    (numId >= 13000 && numId < 14000 ? 'food' :
     numId >= 17000 && numId < 18000 ? 'shopping' :
     numId >= 12000 && numId < 13000 ? 'culture' : 'sightseeing');
  return { categoryGroup: group, categoryLabel: cat.name === 'Vietnamese Restaurant' ? 'Nhà hàng Việt' : cat.name };
}

const PRICE_DISPLAY: Record<number, string> = {
  1: '< 50k',
  2: '50k - 150k',
  3: '150k - 400k',
  4: '> 400k',
};

// ---------------------------------------------------------------------------
// Photo URL builder
// ---------------------------------------------------------------------------

/**
 * Tạo URL ảnh từ Foursquare photo object
 * Format: {prefix}{size}{suffix}
 */
export function buildFsqPhotoUrl(photo: FoursquarePhoto, size = '400x300'): string {
  return `${photo.prefix}${size}${photo.suffix}`;
}

// ---------------------------------------------------------------------------
// URL Builders — không tốn API quota
// ---------------------------------------------------------------------------

export function buildDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function buildFoursquareUrl(fsqId: string): string {
  return `https://foursquare.com/v/${fsqId}`;
}

export function buildSearchUrl(name: string, address: string): string {
  const q = encodeURIComponent(`${name} ${address}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// ---------------------------------------------------------------------------
// Error parsing
// ---------------------------------------------------------------------------

function parseError(err: unknown): FoursquareApiError {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: number }).status;
    if (status === 429) return { type: 'QUOTA_EXCEEDED', message: 'Đã hết 500 request/ngày của Foursquare Free tier. Vui lòng thử lại ngày mai.' };
    if (status === 401 || status === 403) return { type: 'AUTH_FAILED', message: 'Foursquare API key không hợp lệ. Kiểm tra lại VITE_FOURSQUARE_API_KEY.' };
  }
  if (err instanceof TypeError) return { type: 'NETWORK', message: 'Không thể kết nối đến Foursquare API. Kiểm tra kết nối mạng.' };
  return { type: 'UNKNOWN', message: String(err) };
}

// ---------------------------------------------------------------------------
// Session cache
// ---------------------------------------------------------------------------

const detailCache = new Map<string, FoursquareDetail>();

// ---------------------------------------------------------------------------
// 1. Nearby Search
// ---------------------------------------------------------------------------

interface SearchNearbyOptions {
  center: { lat: number; lng: number };
  radiusMeters: number;
  category: string;      // key trong CATEGORY_TO_FSQ
  limit?: number;        // default 20, max 50
}

/**
 * Tìm địa điểm quanh một vị trí.
 * CHỈ gọi khi user xác nhận tìm (Enter / nút "Tìm quanh đây").
 * KHÔNG gọi khi user chọn card/pin hoặc component re-render.
 */
export async function searchNearbyPlaces(
  options: SearchNearbyOptions
): Promise<NearbyPlace[]> {
  if (!FOURSQUARE_API_KEY) {
    throw { type: 'AUTH_FAILED', message: 'Chưa có Foursquare API key.' } as FoursquareApiError;
  }

  const { center, radiusMeters, category, limit = 20 } = options;
  const categoryId = CATEGORY_TO_FSQ[category] ?? '';

  // FSQ OS Places API search
  const params = new URLSearchParams({
    ll: `${center.lat},${center.lng}`,
    radius: String(Math.min(radiusMeters, 100000)), // max 100km
    limit: String(Math.min(limit, 50))
  });
  
  if (categoryId) params.set('categories', categoryId);

  let response: Response;
  try {
    response = await fetch(`${FSQ_BASE}/places/search?${params}`, {
      headers: {
        Authorization: FOURSQUARE_API_KEY.startsWith('Bearer') ? FOURSQUARE_API_KEY : `Bearer ${FOURSQUARE_API_KEY}`,
        Accept: 'application/json',
        'X-Places-Api-Version': '2025-06-17'
      },
    });
  } catch (err) {
    throw parseError(err);
  }

  if (!response.ok) {
    throw parseError({ status: response.status });
  }

  const data = await response.json();
  const places: FoursquarePlace[] = data.results ?? [];

  return places.map((p) => convertToNearbyPlace(p, center));
}

// ---------------------------------------------------------------------------
// 2. Place Details — lazy, chỉ khi mở chi tiết
// ---------------------------------------------------------------------------

/**
 * Lấy thêm chi tiết cho 1 địa điểm (website, phone, mô tả).
 * Kết quả được cache trong session — gọi lại cùng fsqId trả cache ngay.
 */
export async function getPlaceDetails(fsqId: string): Promise<FoursquareDetail> {
  if (detailCache.has(fsqId)) return detailCache.get(fsqId)!;
  if (!FOURSQUARE_API_KEY) {
    throw { type: 'AUTH_FAILED', message: 'Chưa có Foursquare API key.' } as FoursquareApiError;
  }

  let response: Response;
  try {
    response = await fetch(`${FSQ_BASE}/places/${fsqId}`, {
      headers: {
        Authorization: FOURSQUARE_API_KEY.startsWith('Bearer') ? FOURSQUARE_API_KEY : `Bearer ${FOURSQUARE_API_KEY}`,
        Accept: 'application/json',
        'X-Places-Api-Version': '2025-06-17'
      },
    });
  } catch (err) {
    throw parseError(err);
  }

  if (!response.ok) {
    throw parseError({ status: response.status });
  }

  const p: FoursquarePlace = await response.json();

  // Chỉ 1 ảnh khi mở chi tiết
  const photoUrl = p.photos && p.photos.length > 0
    ? buildFsqPhotoUrl(p.photos[0], '800x600')
    : undefined;

  const detail: FoursquareDetail = {
    placeId: fsqId,
    photoUrl,
    websiteUri: p.website,
    nationalPhoneNumber: p.tel,
    description: p.description,
    hoursDisplay: p.hours?.display,
    openNow: p.hours?.open_now,
  };

  detailCache.set(fsqId, detail);
  return detail;
}

/** Xoá session cache (dùng cho testing) */
export function clearDetailCache(): void {
  detailCache.clear();
}

// ---------------------------------------------------------------------------
// 3. Converter — map FoursquarePlace → NearbyPlace (shared interface)
// ---------------------------------------------------------------------------

/**
 * Placeholder ảnh theo loại — khi search chưa load ảnh thật
 */
function getDefaultImage(group: NearbyPlace['categoryGroup']): string {
  const imgs: Record<NearbyPlace['categoryGroup'], string> = {
    food: '/images/food-placeholder.svg',
    cafe: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&q=80&auto=format&fit=crop',
    sightseeing: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80&auto=format&fit=crop',
    culture: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&q=80&auto=format&fit=crop',
    shopping: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80&auto=format&fit=crop',
    stay: '/images/stay-placeholder.svg',
    all: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80&auto=format&fit=crop',
  };
  return imgs[group];
}

export function convertToNearbyPlace(
  p: FoursquarePlace,
  searchCenter: { lat: number; lng: number }
): NearbyPlace {
  const lat = p.latitude ?? 0;
  const lng = p.longitude ?? 0;
  const distKm = calculateDistanceKm(searchCenter.lat, searchCenter.lng, lat, lng);
  const { categoryGroup, categoryLabel } = fsqCategoriesToGroup(p.categories);

  // Rating Foursquare là 0–10, chuyển về 0–5 cho đồng nhất UI
  const rating = p.rating ? Math.round((p.rating / 2) * 10) / 10 : 4.5;

  return {
    id: p.fsq_place_id,
    name: p.name,
    subtitle: p.categories?.[0]?.name,
    categoryGroup,
    categoryLabel,
    coordinates: { lat, lng },
    address: p.location?.formatted_address ?? p.location?.address ?? '',
    provinceName: p.location?.locality ?? '',
    provinceId: '',
    imageUrl: getDefaultImage(categoryGroup),
    rating,
    reviewCount: 0,
    openingHours: undefined,
    isOpenNow: true,
    priceDisplay: p.price ? PRICE_DISPLAY[p.price as keyof typeof PRICE_DISPLAY] : undefined,
    description: p.tel ? `Phone: ${p.tel}` : '',
    tags: p.categories?.map((c) => c.name) ?? [],
    distanceKm: distKm,
    distanceText: formatDistanceKm(distKm),
    sourceItem: {
      itemType: 'poi',
      id: p.fsq_place_id,
      name: p.name,
      address: p.location?.formatted_address ?? '',
      description: '',
      imageUrl: getDefaultImage(categoryGroup),
      coordinates: { lat, lng },
      category: categoryLabel,
      tags: p.categories?.map((c) => c.name) ?? [],
      rating,
      reviewCount: 0,
      openingHours: undefined,
      ticketPrice: 0,
      localTips: '',
    } as any,
    // Dùng fsq_place_id để lazy-fetch detail khi mở ItemDetailModal
    googlePlaceId: p.fsq_place_id, // tái dụng field này (cùng semantic)
  };
}

export { parseError as parseFoursquareError };
