/**
 * places/index.ts — Loader và filter cho dữ liệu pre-fetched (Foursquare + OSM)
 *
 * Dữ liệu JSON được tạo bởi scripts/fetch-places.ts
 * Frontend load JSON khi user chọn thành phố, filter client-side theo vị trí/bán kính.
 * KHÔNG gọi API nào khi user tương tác.
 */

import type { NearbyPlace, PlaceCategoryGroup } from '../../services/nearbyPlacesService';
import { calculateDistanceKm, formatDistanceKm } from '../../services/nearbyPlacesService';
import type { DetailItem } from '../../components/ItemDetailModal';

// ---------------------------------------------------------------------------
// Types — matching output of scripts/mergeEngine.ts
// ---------------------------------------------------------------------------

export interface MergedPlaceJSON {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  address: string;
  categoryGroup: PlaceCategoryGroup;
  categoryLabel: string;
  foursquareId?: string;
  osmId?: string;
  dataSource: 'foursquare' | 'osm' | 'merged';
  rating: number | null;
  reviewCount: number | null;
  imageUrl: string | null;
  isPlaceholderImage: boolean;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  description: string | null;
  needsReview: boolean;
  conflictNote: string | null;
  tags: string[];
}

export interface MergeStats {
  total: number;
  fromFoursquare: number;
  fromOSM: number;
  merged: number;
  needsReview: number;
}

export interface CityPlacesData {
  cityId: string;
  cityName: string;
  center: { lat: number; lng: number };
  fetchedAt: string;
  sources: {
    foursquare: { count: number; fetchedAt: string };
    osm: { count: number; fetchedAt: string };
  };
  stats: MergeStats;
  places: MergedPlaceJSON[];
  attribution: {
    foursquare: string;
    osm: string;
  };
}

// ---------------------------------------------------------------------------
// Loader — dynamic import of JSON files via Vite glob
// ---------------------------------------------------------------------------

/**
 * Vite import.meta.glob discovers JSON files at build time.
 * If no JSON files exist yet (script hasn't been run), this will be empty.
 */
const cityModules: Record<string, () => Promise<{ default: CityPlacesData }>> =
  import.meta.glob('./*.json') as any;

/** Cache loaded city data to avoid re-importing */
const cityCache = new Map<string, CityPlacesData>();

/** List of available city IDs (based on existing JSON files) */
export function getAvailableCityIds(): string[] {
  return Object.keys(cityModules).map(key =>
    key.replace('./', '').replace('.json', '')
  );
}

/** Check if pre-fetched data is available for any city */
export function hasPreFetchedData(): boolean {
  return Object.keys(cityModules).length > 0;
}

/**
 * Load pre-fetched data for a specific city.
 * Returns null if no data file exists for this city.
 */
export async function loadCityPlaces(cityId: string): Promise<CityPlacesData | null> {
  // Check cache first
  if (cityCache.has(cityId)) {
    return cityCache.get(cityId)!;
  }

  const key = `./${cityId}.json`;
  if (!(key in cityModules)) {
    return null;
  }

  try {
    const mod = await cityModules[key]();
    const data = mod.default;
    cityCache.set(cityId, data);
    return data;
  } catch (err) {
    console.warn(`Failed to load places data for ${cityId}:`, err);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Converter — MergedPlaceJSON → NearbyPlace
// ---------------------------------------------------------------------------

function mergedToNearbyPlace(
  mp: MergedPlaceJSON,
  searchCenter: { lat: number; lng: number }
): NearbyPlace {
  const isStay = /campground|camping|hotel|hostel|homestay|guesthouse|guest house|lodging|resort|motel/i.test(mp.categoryLabel);
  const categoryGroup = isStay ? 'stay' : mp.categoryGroup;
  const categoryLabel = isStay ? 'Lưu trú' : mp.categoryLabel === 'Vietnamese Restaurant' ? 'Nhà hàng Việt' : mp.categoryLabel;
  const imageUrl = mp.isPlaceholderImage && categoryGroup === 'food' ? '/images/food-placeholder.svg'
    : mp.isPlaceholderImage && categoryGroup === 'stay' ? '/images/stay-placeholder.svg' : mp.imageUrl || '';
  const distKm = calculateDistanceKm(
    searchCenter.lat, searchCenter.lng,
    mp.coordinates.lat, mp.coordinates.lng
  );

  // Construct a minimal DetailItem (sourceItem) for compatibility with existing UI
  const sourceItem: DetailItem = {
    itemType: 'poi',
    id: mp.id,
    name: mp.name,
    category: categoryLabel as any,
    coordinates: mp.coordinates,
    address: mp.address,
    openingHours: mp.openingHours || '',
    ticketPrice: undefined,
    estimatedTime: '',
    description: mp.description || '',
    imageUrl,
    tags: mp.tags,
    localTips: '',
    rating: mp.rating,
    reviewCount: mp.reviewCount,
    isPlaceholderImage: mp.isPlaceholderImage,
    dataSource: mp.dataSource,
    phone: mp.phone,
    website: mp.website,
  } as any;

  return {
    id: mp.id,
    name: mp.name,
    subtitle: categoryLabel,
    categoryGroup,
    categoryLabel,
    coordinates: mp.coordinates,
    address: mp.address,
    provinceName: '',
    provinceId: '',
    imageUrl,
    rating: mp.rating,
    reviewCount: mp.reviewCount,
    openingHours: mp.openingHours ?? undefined,
    isOpenNow: undefined, // pre-fetched data doesn't know current status
    priceDisplay: undefined,
    description: mp.description || '',
    tags: mp.tags,
    distanceKm: distKm,
    distanceText: formatDistanceKm(distKm),
    sourceItem,
    // New fields
    dataSource: mp.dataSource,
    foursquareId: mp.foursquareId,
    osmId: mp.osmId,
    isPlaceholderImage: mp.isPlaceholderImage,
    needsReview: mp.needsReview,
    phone: mp.phone ?? undefined,
    website: mp.website ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// Filter — client-side filtering of loaded data
// ---------------------------------------------------------------------------

export interface FilterOptions {
  center: { lat: number; lng: number };
  radiusKm: number | 'all';
  category: PlaceCategoryGroup;
  searchQuery?: string;
  sortBy: 'nearest' | 'rating';
  onlyOpenNow?: boolean;
}

/**
 * Filter and sort pre-fetched places.
 * All filtering happens client-side — no API calls.
 */
export function filterCityPlaces(
  data: CityPlacesData,
  options: FilterOptions
): NearbyPlace[] {
  const { center, radiusKm, category, searchQuery, sortBy, onlyOpenNow } = options;
  const queryLower = (searchQuery || '').trim().toLowerCase();

  // Convert and calculate distances
  let places = data.places.map(mp => mergedToNearbyPlace(mp, center));

  // Filter
  places = places.filter(place => {
    // 1. Search query
    if (queryLower) {
      const matchName = place.name.toLowerCase().includes(queryLower);
      const matchSubtitle = (place.subtitle || '').toLowerCase().includes(queryLower);
      const matchAddr = place.address.toLowerCase().includes(queryLower);
      const matchTags = place.tags.some(t => t.toLowerCase().includes(queryLower));
      if (!matchName && !matchSubtitle && !matchAddr && !matchTags) return false;
    }

    // 2. Category
    if (category !== 'all' && place.categoryGroup !== category) return false;

    // 3. Radius
    if (radiusKm !== 'all' && place.distanceKm !== undefined) {
      if (place.distanceKm > radiusKm) return false;
    }

    if (onlyOpenNow && place.isOpenNow !== true) return false;
    return true;
  });

  // Sort
  places.sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating || 0) - (a.rating || 0);
    }
    return (a.distanceKm || 0) - (b.distanceKm || 0);
  });

  return places;
}
