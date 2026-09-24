/**
 * mergeEngine.ts — Merge & Dedup engine cho Foursquare + OSM data
 *
 * Chạy offline trong scripts/fetch-places.ts, KHÔNG chạy trong frontend.
 * Quy tắc:
 *   - Giữ cả hai ID (foursquareId, osmId) để đối chiếu
 *   - Ưu tiên Foursquare cho tên/địa chỉ/tọa độ; OSM bổ sung website, SĐT, giờ mở cửa
 *   - KHÔNG tự tạo rating, ảnh, giờ mở cửa — thiếu thì null
 *   - Conflict (tọa độ > 100m hoặc địa chỉ khác biệt lớn) → needsReview = true, không gộp
 *   - Chỉ merge khi normalizedSimilarity ≥ 0.7 VÀ khoảng cách < 50m
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PlaceCategoryGroup = 'all' | 'food' | 'cafe' | 'sightseeing' | 'culture' | 'shopping' | 'stay';

export interface MergedPlace {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  address: string;
  categoryGroup: PlaceCategoryGroup;
  categoryLabel: string;

  // Nguồn gốc — giữ cả hai
  foursquareId?: string;
  osmId?: string;
  dataSource: 'foursquare' | 'osm' | 'merged';

  // Thông tin — chỉ có khi nguồn cung cấp, KHÔNG fabricate
  rating: number | null;
  reviewCount: number | null;
  imageUrl: string | null;
  isPlaceholderImage: boolean;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  description: string | null;

  // Merge metadata
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
  places: MergedPlace[];
  attribution: {
    foursquare: string;
    osm: string;
  };
}

// ---------------------------------------------------------------------------
// Normalization — bỏ dấu tiếng Việt, lowercase, bỏ ký tự đặc biệt
// ---------------------------------------------------------------------------

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // bỏ dấu
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Levenshtein distance → similarity ratio (0..1)
// ---------------------------------------------------------------------------

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

export function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

// ---------------------------------------------------------------------------
// Haversine distance (km)
// ---------------------------------------------------------------------------

const EARTH_RADIUS_KM = 6371;

export function haversineDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

// ---------------------------------------------------------------------------
// Placeholder images — theo category, ghi rõ "Ảnh minh họa"
// ---------------------------------------------------------------------------

const PLACEHOLDER_IMAGES: Record<PlaceCategoryGroup, string> = {
  food: '/images/food-placeholder.svg',
  cafe: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&q=80&auto=format&fit=crop',
  sightseeing: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80&auto=format&fit=crop',
  culture: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&q=80&auto=format&fit=crop',
  shopping: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80&auto=format&fit=crop',
  stay: '/images/stay-placeholder.svg',
  all: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80&auto=format&fit=crop',
};

export function getPlaceholderImage(group: PlaceCategoryGroup): string {
  return PLACEHOLDER_IMAGES[group] || PLACEHOLDER_IMAGES.all;
}

// ---------------------------------------------------------------------------
// Core Merge Logic
// ---------------------------------------------------------------------------

const SIMILARITY_THRESHOLD = 0.7;
const DISTANCE_THRESHOLD_KM = 0.05; // 50m
const CONFLICT_DISTANCE_KM = 0.1;   // 100m — nếu > 100m thì flag needsReview

interface MatchResult {
  fsqIndex: number;
  similarity: number;
  distanceKm: number;
}

function findBestMatch(
  osmPlace: MergedPlace,
  foursquarePlaces: MergedPlace[],
  usedFsqIndices: Set<number>
): MatchResult | null {
  let bestMatch: MatchResult | null = null;

  const normOsm = normalizeName(osmPlace.name);

  for (let i = 0; i < foursquarePlaces.length; i++) {
    if (usedFsqIndices.has(i)) continue;

    const fsq = foursquarePlaces[i];
    const normFsq = normalizeName(fsq.name);
    const sim = calculateSimilarity(normOsm, normFsq);

    if (sim < SIMILARITY_THRESHOLD) continue;

    const dist = haversineDistanceKm(
      osmPlace.coordinates.lat, osmPlace.coordinates.lng,
      fsq.coordinates.lat, fsq.coordinates.lng
    );

    // Keep nearby ambiguous candidates for review, without joining distant branches.
    if (dist > 1) continue;

    if (!bestMatch || dist < bestMatch.distanceKm ||
        (dist === bestMatch.distanceKm && sim > bestMatch.similarity)) {
      bestMatch = { fsqIndex: i, similarity: sim, distanceKm: dist };
    }
  }

  return bestMatch;
}

/**
 * Merge hai danh sách place từ Foursquare và OSM.
 *
 * Quy tắc:
 * 1. Quán chỉ có ở Foursquare → giữ nguyên, dataSource = 'foursquare'
 * 2. Quán chỉ có ở OSM → giữ nguyên, dataSource = 'osm'
 * 3. Quán match (tên ≥ 0.7 similarity + khoảng cách < 50m) → merge, dataSource = 'merged'
 *    - Ưu tiên FSQ cho tên, địa chỉ, tọa độ
 *    - OSM bổ sung website, SĐT, giờ mở cửa nếu FSQ thiếu
 *    - Nếu tọa độ > 100m hoặc địa chỉ khác biệt lớn → needsReview = true
 */
export function mergePlaces(
  foursquarePlaces: MergedPlace[],
  osmPlaces: MergedPlace[]
): { places: MergedPlace[]; stats: MergeStats } {
  const result: MergedPlace[] = [];
  const usedFsqIndices = new Set<number>();
  let mergedCount = 0;
  const conflicts = new Map<number, string>();

  // Pass 1: For each OSM place, find best match in Foursquare
  for (const osmPlace of osmPlaces) {
    const match = findBestMatch(osmPlace, foursquarePlaces, usedFsqIndices);

    if (match) {
      // Merge: FSQ primary, OSM supplement
      const fsqPlace = foursquarePlaces[match.fsqIndex];

      // Check for conflicts
      const coordDist = haversineDistanceKm(
        fsqPlace.coordinates.lat, fsqPlace.coordinates.lng,
        osmPlace.coordinates.lat, osmPlace.coordinates.lng
      );

      const addressMismatch = Boolean(
        fsqPlace.address && osmPlace.address &&
        calculateSimilarity(normalizeName(fsqPlace.address), normalizeName(osmPlace.address)) < 0.5
      );

      const hasConflict = coordDist > CONFLICT_DISTANCE_KM || addressMismatch;

      if (hasConflict) {
        const note = `Tọa độ cách ${(coordDist * 1000).toFixed(0)}m${addressMismatch ? '; địa chỉ khác biệt' : ''} giữa FSQ và OSM`;
        conflicts.set(match.fsqIndex, note);
        result.push({ ...osmPlace, needsReview: true, conflictNote: note });
        continue;
      }

      if (coordDist >= DISTANCE_THRESHOLD_KM) {
        result.push({ ...osmPlace });
        continue;
      }
      usedFsqIndices.add(match.fsqIndex);

      const merged: MergedPlace = {
        id: `merged-${fsqPlace.foursquareId || osmPlace.osmId}`,
        // Ưu tiên FSQ cho tên, địa chỉ, tọa độ
        name: fsqPlace.name,
        coordinates: fsqPlace.coordinates,
        address: fsqPlace.address || osmPlace.address,
        categoryGroup: fsqPlace.categoryGroup,
        categoryLabel: fsqPlace.categoryLabel || osmPlace.categoryLabel,

        foursquareId: fsqPlace.foursquareId,
        osmId: osmPlace.osmId,
        dataSource: 'merged',

        // Giữ FSQ rating nếu có; KHÔNG fabricate
        rating: fsqPlace.rating,
        reviewCount: fsqPlace.reviewCount,
        imageUrl: fsqPlace.imageUrl,
        isPlaceholderImage: fsqPlace.isPlaceholderImage,

        // OSM bổ sung các trường FSQ thiếu
        phone: fsqPlace.phone || osmPlace.phone,
        website: fsqPlace.website || osmPlace.website,
        openingHours: fsqPlace.openingHours || osmPlace.openingHours,
        description: fsqPlace.description || osmPlace.description,

        needsReview: fsqPlace.needsReview || osmPlace.needsReview || conflicts.has(match.fsqIndex),
        conflictNote: conflicts.get(match.fsqIndex) || fsqPlace.conflictNote || osmPlace.conflictNote,
        tags: [...new Set([...(fsqPlace.tags || []), ...(osmPlace.tags || [])])],
      };

      result.push(merged);
      mergedCount++;
    } else {
      // OSM only — giữ nguyên
      result.push(osmPlace);
    }
  }

  // Pass 2: Add unmatched Foursquare places
  for (let i = 0; i < foursquarePlaces.length; i++) {
    if (!usedFsqIndices.has(i)) {
      const note = conflicts.get(i);
      result.push(note
        ? { ...foursquarePlaces[i], needsReview: true, conflictNote: note }
        : { ...foursquarePlaces[i] });
    }
  }

  const unmatchedFsq = foursquarePlaces.length - usedFsqIndices.size;
  const unmatchedOsm = osmPlaces.length - mergedCount;

  const stats: MergeStats = {
    total: result.length,
    fromFoursquare: unmatchedFsq,
    fromOSM: unmatchedOsm,
    merged: mergedCount,
    needsReview: result.filter(place => place.needsReview).length,
  };

  // Sort by name for consistent output
  result.sort((a, b) => a.name.localeCompare(b.name, 'vi'));

  return { places: result, stats };
}
