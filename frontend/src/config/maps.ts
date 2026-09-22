/**
 * maps.ts — Cấu hình Google Maps & Places API
 *
 * Nếu VITE_GOOGLE_MAPS_API_KEY không được set, ứng dụng tự động chạy ở
 * "Sample Data Mode" — không load Google SDK, không gọi bất kỳ Google API nào.
 */

export const GOOGLE_MAPS_API_KEY: string =
  ((import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY as string) ?? '';

/**
 * Foursquare Places API v3 key.
 * Signup miễn phí tại https://foursquare.com/developer/
 * Free tier: 500 requests/ngày, không cần billing.
 */
export const FOURSQUARE_API_KEY: string =
  ((import.meta as any).env?.VITE_FOURSQUARE_API_KEY as string) ?? '';

/**
 * CARTO API Key (dùng để bỏ watermark "API KEY REQUIRED" trên bản đồ)
 */
export const CARTO_API_KEY: string =
  ((import.meta as any).env?.VITE_CARTO_API_KEY as string) ?? '';

/**
 * true  → không có bất kỳ API key nào → chạy hoàn toàn bằng dữ liệu mẫu
 * false → có Foursquare hoặc Google key
 */
export const IS_SAMPLE_MODE: boolean = !GOOGLE_MAPS_API_KEY && !FOURSQUARE_API_KEY;

/**
 * Nguồn dữ liệu ưu tiên:
 * - 'foursquare+osm' dữ liệu pre-fetched kết hợp (khuyến nghị, không gọi API runtime)
 * - 'foursquare' nếu có Foursquare key (API realtime, 500 req/ngày)
 * - 'google'     nếu có Google key (API realtime, có billing)
 * - 'sample'     fallback khi không có key và chưa pre-fetch
 */
export type DataSourceType = 'sample' | 'foursquare' | 'google' | 'foursquare+osm';

/**
 * DEFAULT_DATA_SOURCE sẽ được NearbyPage ghi đè thành 'foursquare+osm'
 * nếu phát hiện có dữ liệu pre-fetched (JSON files tồn tại).
 * Giá trị fallback ở đây dùng khi chưa pre-fetch.
 */
export const DEFAULT_DATA_SOURCE: DataSourceType =
  FOURSQUARE_API_KEY ? 'foursquare' :
  GOOGLE_MAPS_API_KEY ? 'google' : 'sample';

// ---------------------------------------------------------------------------
// Places API (New) — REST endpoint
// ---------------------------------------------------------------------------
export const PLACES_API_BASE = 'https://places.googleapis.com/v1';

/**
 * Các field được phép fetch từ Nearby Search.
 * Chọn lọc kỹ để tránh billing tier cao (Basic Data ← rẻ nhất).
 * Tham khảo: https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
 */
export const NEARBY_SEARCH_FIELDS = [
  'places.id',
  'places.displayName',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.currentOpeningHours.openNow',
  'places.currentOpeningHours.weekdayDescriptions',
  'places.priceLevel',
  'places.types',
  'places.primaryType',
  'places.formattedAddress',
  'places.shortFormattedAddress',
] as const;

/**
 * Các field CHỈ fetch khi mở chi tiết (lazy load — 1 lần per place_id).
 * Thuộc Advanced / Preferred tier → chỉ dùng khi user chủ động mở detail.
 */
export const DETAIL_ONLY_FIELDS = [
  'photos',
  'editorialSummary',
  'websiteUri',
  'nationalPhoneNumber',
] as const;

/**
 * Map từ category group nội bộ sang Google Places primaryType[]
 */
export const CATEGORY_TO_GOOGLE_TYPES: Record<string, string[]> = {
  all: [],
  food: ['restaurant', 'food', 'meal_takeaway', 'meal_delivery', 'bakery'],
  cafe: ['cafe', 'coffee_shop', 'tea_house'],
  sightseeing: ['tourist_attraction', 'point_of_interest', 'natural_feature', 'park'],
  culture: ['museum', 'place_of_worship', 'church', 'temple', 'hindu_temple', 'landmark'],
  shopping: ['shopping_mall', 'store', 'market', 'supermarket', 'clothing_store'],
};

/**
 * Map Google priceLevel → chuỗi hiển thị tiếng Việt
 */
export const PRICE_LEVEL_DISPLAY: Record<string, string> = {
  PRICE_LEVEL_FREE: 'Miễn phí',
  PRICE_LEVEL_INEXPENSIVE: '< 100k',
  PRICE_LEVEL_MODERATE: '100k - 300k',
  PRICE_LEVEL_EXPENSIVE: '300k - 700k',
  PRICE_LEVEL_VERY_EXPENSIVE: '> 700k',
};

export type PlaceFieldMask = typeof NEARBY_SEARCH_FIELDS[number];
export type DetailFieldMask = typeof DETAIL_ONLY_FIELDS[number];
