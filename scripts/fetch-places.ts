/**
 * fetch-places.ts — Script CLI tải dữ liệu từ Foursquare + OSM Overpass API
 *
 * Usage:
 *   npx tsx scripts/fetch-places.ts              # Tải tất cả thành phố
 *   npx tsx scripts/fetch-places.ts da-nang       # Tải riêng Đà Nẵng
 *   npx tsx scripts/fetch-places.ts da-nang hue   # Tải Đà Nẵng + Huế
 *
 * Output: frontend/src/data/places/{city-id}.json
 *
 * Giấy phép:
 *   - Foursquare: Places API (see provider terms)
 *   - OSM: ODbL (OpenStreetMap contributors)
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import {
  type MergedPlace,
  type CityPlacesData,
  type PlaceCategoryGroup,
  mergePlaces,
  getPlaceholderImage,
} from './mergeEngine.ts';
import { isInactiveOSM, prunePlaces } from './placeQuality.ts';

dotenv.config();

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const FSQ_API_KEY = process.env.FOURSQUARE_API_KEY || process.env.VITE_FOURSQUARE_API_KEY || '';
const FSQ_BASE = 'https://places-api.foursquare.com';
const OVERPASS_BASES = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];

const OUTPUT_DIR = path.resolve(process.cwd(), 'frontend/src/data/places');

/** 10 khu vực phổ biến — tương ứng POPULAR_AREAS trong NearbyPage */
const CITIES = [
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

// ---------------------------------------------------------------------------
// Foursquare category mapping
// ---------------------------------------------------------------------------

const FSQ_CATEGORIES: Record<string, { categoryId: string; group: PlaceCategoryGroup; label: string }> = {
  cafe: { categoryId: '4bf58dd8d48988d1e0931735,4bf58dd8d48988d16d941735', group: 'cafe', label: 'Cà phê & Đồ uống' },
  food: { categoryId: '4d4b7105d754a06374d81259', group: 'food', label: 'Ẩm thực' },
  sightseeing: { categoryId: '4d4b7105d754a06377d81259', group: 'sightseeing', label: 'Tham quan' },
  culture: { categoryId: '4bf58dd8d48988d181941735,4bf58dd8d48988d12d941735', group: 'culture', label: 'Văn hóa & Di sản' },
  shopping: { categoryId: '4d4b7105d754a06378d81259', group: 'shopping', label: 'Mua sắm' },
};

// ---------------------------------------------------------------------------
// OSM tag → category mapping
// ---------------------------------------------------------------------------

function osmTagsToCategory(tags: Record<string, string>): { group: PlaceCategoryGroup; label: string } {
  const amenity = tags.amenity || '';
  const tourism = tags.tourism || '';
  const shop = tags.shop || '';
  const historic = tags.historic || '';
  const leisure = tags.leisure || '';

  if (['hotel', 'hostel', 'guest_house', 'motel', 'camp_site', 'chalet', 'apartment', 'resort'].includes(tourism)) {
    return { group: 'stay', label: 'Lưu trú' };
  }

  if (['restaurant', 'fast_food', 'food_court', 'bbq'].includes(amenity)) {
    return { group: 'food', label: tags.cuisine ? `Ẩm thực (${tags.cuisine})` : 'Ẩm thực' };
  }
  if (['cafe', 'bar', 'pub', 'ice_cream'].includes(amenity)) {
    return { group: 'cafe', label: amenity === 'cafe' ? 'Cà phê' : 'Đồ uống' };
  }
  if (amenity === 'place_of_worship' || historic || ['museum', 'gallery'].includes(tourism)) {
    return { group: 'culture', label: historic ? 'Di tích lịch sử' : 'Văn hóa' };
  }
  if (['attraction', 'viewpoint'].includes(tourism) || ['park', 'garden', 'beach_resort'].includes(leisure)) {
    return { group: 'sightseeing', label: 'Tham quan' };
  }
  if (shop) {
    return { group: 'shopping', label: 'Mua sắm' };
  }
  return { group: 'sightseeing', label: 'Địa điểm' };
}

// ---------------------------------------------------------------------------
// Foursquare fetcher
// ---------------------------------------------------------------------------

interface FoursquareResult {
  fsq_place_id: string;
  name: string;
  latitude: number;
  longitude: number;
  categories?: { fsq_category_id: string; name: string }[];
  location?: {
    address?: string;
    formatted_address?: string;
    locality?: string;
  };
  tel?: string;
  website?: string;
  rating?: number;
  stats?: { total_ratings?: number };
  hours?: { display?: string; open_now?: boolean };
  description?: string;
}

async function fetchFoursquareCategory(
  city: typeof CITIES[0],
  catKey: string,
  limit = 20
): Promise<MergedPlace[]> {
  if (!FSQ_API_KEY) return [];

  const cat = FSQ_CATEGORIES[catKey];
  if (!cat) return [];

  const params = new URLSearchParams({
    ll: `${city.lat},${city.lng}`,
    radius: '10000',
    fsq_category_ids: cat.categoryId,
    limit: String(limit),
  });

  try {
    const res = await fetch(`${FSQ_BASE}/places/search?${params}`, {
      signal: AbortSignal.timeout(45000),
      headers: {
        Authorization: FSQ_API_KEY.startsWith('Bearer') ? FSQ_API_KEY : `Bearer ${FSQ_API_KEY}`,
        Accept: 'application/json',
        'X-Places-Api-Version': '2025-06-17',
      },
    });

    if (!res.ok) {
      throw new Error(`Foursquare [${catKey}] HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const results: FoursquareResult[] = data.results ?? [];

    return results.filter(p => p.fsq_place_id && p.name &&
      Number.isFinite(p.latitude) && Number.isFinite(p.longitude)).map((p): MergedPlace => {
      const categoryName = p.categories?.[0]?.name || cat.label;
      const isStay = /campground|camping|hotel|hostel|homestay|guesthouse|guest house|lodging|resort|motel/i.test(categoryName);
      const group = isStay ? 'stay' : cat.group;
      return {
        id: `fsq-${p.fsq_place_id}`,
        name: p.name,
        coordinates: { lat: p.latitude, lng: p.longitude },
        address: p.location?.formatted_address || p.location?.address || '',
        categoryGroup: group,
        categoryLabel: categoryName === 'Vietnamese Restaurant' ? 'Nhà hàng Việt' : isStay ? 'Lưu trú' : categoryName,
        foursquareId: p.fsq_place_id,
        osmId: undefined,
        dataSource: 'foursquare',
        // Rating Foursquare: 0–10 → 0–5
        rating: p.rating != null ? Math.round((p.rating / 2) * 10) / 10 : null,
        reviewCount: p.stats?.total_ratings ?? null,
        imageUrl: null,
        isPlaceholderImage: true,
        phone: p.tel || null,
        website: p.website || null,
        openingHours: p.hours?.display || null,
        description: p.description || null,
        needsReview: false,
        conflictNote: null,
        tags: p.categories?.map(c => c.name) || [],
      };
    });
  } catch (err) {
    console.warn(`  ⚠ Foursquare [${catKey}] error:`, (err as Error).message);
    throw err;
  }
}

async function fetchAllFoursquare(city: typeof CITIES[0]): Promise<MergedPlace[]> {
  const allPlaces: MergedPlace[] = [];
  const seenIds = new Set<string>();

  for (const catKey of Object.keys(FSQ_CATEGORIES)) {
    const places = await fetchFoursquareCategory(city, catKey);
    for (const p of places) {
      if (!seenIds.has(p.foursquareId!)) {
        seenIds.add(p.foursquareId!);
        allPlaces.push(p);
      }
    }
    // Rate limiting — tránh overwhelm Foursquare
    await sleep(300);
  }

  return allPlaces;
}

// ---------------------------------------------------------------------------
// OSM Overpass fetcher
// ---------------------------------------------------------------------------

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function buildOverpassQuery(lat: number, lng: number, radiusMeters = 10000): string {
  return `
[out:json][timeout:30];
(
  node["amenity"~"restaurant|cafe|fast_food|bar|pub|food_court|ice_cream"][name](around:${radiusMeters},${lat},${lng});
  node["tourism"~"attraction|museum|viewpoint|gallery|information"][name](around:${radiusMeters},${lat},${lng});
  node["historic"][name](around:${radiusMeters},${lat},${lng});
  node["shop"][name](around:${radiusMeters},${lat},${lng});
  node["leisure"~"park|garden"][name](around:${radiusMeters},${lat},${lng});
  node["amenity"="place_of_worship"][name](around:${radiusMeters},${lat},${lng});
  way["amenity"~"restaurant|cafe|fast_food"][name](around:${radiusMeters},${lat},${lng});
  way["tourism"~"attraction|museum"][name](around:${radiusMeters},${lat},${lng});
  way["shop"][name](around:${radiusMeters},${lat},${lng});
);
out center body;
  `.trim();
}

function parseOSMAddress(tags: Record<string, string>): string {
  const parts: string[] = [];
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:suburb'] || tags['addr:quarter']) {
    parts.push(tags['addr:suburb'] || tags['addr:quarter']);
  }
  if (tags['addr:city'] || tags['addr:district']) {
    parts.push(tags['addr:city'] || tags['addr:district']);
  }
  return parts.join(', ');
}

async function fetchOverpassElements(query: string): Promise<OverpassElement[]> {
  let lastError: unknown;
  for (const endpoint of OVERPASS_BASES) {
    try {
      const res = await fetch(endpoint, {
        signal: AbortSignal.timeout(30000),
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'VietGo/1.0',
        },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (!res.ok) {
        throw new Error(`Overpass HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.remark || !Array.isArray(data.elements)) {
        throw new Error(`Incomplete Overpass response: ${data.remark || 'missing elements'}`);
      }
      return data.elements;
    } catch (err) {
      lastError = err;
      console.warn(`  ⚠ Overpass ${new URL(endpoint).host}: ${(err as Error).message}`);
    }
  }
  throw lastError;
}

function withinRadiusKm(lat: number, lng: number, centerLat: number, centerLng: number, radiusKm: number): boolean {
  const toRadians = Math.PI / 180;
  const dLat = (lat - centerLat) * toRadians;
  const dLng = (lng - centerLng) * toRadians;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(centerLat * toRadians) * Math.cos(lat * toRadians) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= radiusKm;
}

function isTransientOverpassError(err: unknown): boolean {
  return /Overpass HTTP (429|502|503|504)|timeout|aborted/i.test(String(err));
}

async function fetchOverpassArea(
  lat: number, lng: number, radiusMeters: number, depth = 0,
): Promise<OverpassElement[]> {
  try {
    return await fetchOverpassElements(buildOverpassQuery(lat, lng, radiusMeters));
  } catch (err) {
    if (!isTransientOverpassError(err) || depth >= 2) throw err;
    const offsetKm = radiusMeters / 2000;
    const latOffset = offsetKm / 111.32;
    const lngOffset = offsetKm / (111.32 * Math.cos(lat * Math.PI / 180));
    const childRadius = Math.ceil(radiusMeters * 0.75);
    console.warn(`  ⚠ Splitting ${radiusMeters}m Overpass area into four ${childRadius}m areas`);
    const byId = new Map<string, OverpassElement>();
    for (const latSign of [-1, 1]) {
      for (const lngSign of [-1, 1]) {
        const tile = await fetchOverpassArea(
          lat + latSign * latOffset,
          lng + lngSign * lngOffset,
          childRadius,
          depth + 1,
        );
        for (const element of tile) byId.set(`${element.type}/${element.id}`, element);
        await sleep(1000);
      }
    }
    return [...byId.values()];
  }
}

async function fetchOSMPlaces(city: typeof CITIES[0]): Promise<MergedPlace[]> {
  try {
    let elements: OverpassElement[];
    try {
      elements = await fetchOverpassElements(buildOverpassQuery(city.lat, city.lng));
    } catch (err) {
      if (!isTransientOverpassError(err)) throw err;
      console.warn(`  ⚠ Overpass timed out for ${city.name}; retrying as nine smaller areas`);
      const byId = new Map<string, OverpassElement>();
      const latStep = 5 / 111.32;
      const lngStep = 5 / (111.32 * Math.cos(city.lat * Math.PI / 180));
      for (const latOffset of [-1, 0, 1]) {
        for (const lngOffset of [-1, 0, 1]) {
          const tile = await fetchOverpassArea(
            city.lat + latOffset * latStep,
            city.lng + lngOffset * lngStep,
            5100,
          );
          for (const element of tile) {
            const lat = element.lat ?? element.center?.lat;
            const lng = element.lon ?? element.center?.lon;
            if (lat !== undefined && lng !== undefined &&
                withinRadiusKm(lat, lng, city.lat, city.lng, 10)) {
              byId.set(`${element.type}/${element.id}`, element);
            }
          }
          console.log(`  🧩 Overpass area ${byId.size} unique places so far`);
          await sleep(1000);
        }
      }
      elements = [...byId.values()];
    }

    return elements
      .filter(el => {
        // Chỉ giữ các element có tên
        return (el.tags?.name || el.tags?.['name:vi'] || el.tags?.['name:en']) &&
          Number.isFinite(el.lat ?? el.center?.lat) && Number.isFinite(el.lon ?? el.center?.lon) &&
          !isInactiveOSM(el.tags || {});
      })
      .map((el): MergedPlace => {
        const tags = el.tags || {};
        const lat = (el.lat ?? el.center?.lat)!;
        const lng = (el.lon ?? el.center?.lon)!;
        const name = tags['name:vi'] || tags.name || tags['name:en'] || 'Không rõ tên';
        const { group, label } = osmTagsToCategory(tags);
        const address = parseOSMAddress(tags);

        return {
          id: `osm-${el.type}-${el.id}`,
          name,
          coordinates: { lat, lng },
          address,
          categoryGroup: group,
          categoryLabel: label,
          foursquareId: undefined,
          osmId: `${el.type}/${el.id}`,
          dataSource: 'osm',
          rating: null,       // OSM không có rating — KHÔNG fabricate
          reviewCount: null,
          imageUrl: null,
          isPlaceholderImage: true,
          phone: tags.phone || tags['contact:phone'] || null,
          website: tags.website || tags['contact:website'] || null,
          openingHours: tags.opening_hours || null,
          description: tags.description || tags['description:vi'] || null,
          needsReview: false,
          conflictNote: null,
          tags: [
            tags.cuisine, tags.amenity, tags.tourism, tags.shop,
            tags.historic, tags.leisure,
          ].filter(Boolean) as string[],
        };
      });
  } catch (err) {
    console.warn(`  ⚠ Overpass error:`, (err as Error).message);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Process a single city
// ---------------------------------------------------------------------------

async function processCity(city: typeof CITIES[0]): Promise<CityPlacesData> {
  console.log(`\n🏙️  ${city.name} (${city.id})`);

  // Fetch from both sources in parallel
  const [fsqResult, osmResult] = await Promise.allSettled([
    fetchAllFoursquare(city),
    fetchOSMPlaces(city),
  ]);

  const fsqPlaces = fsqResult.status === 'fulfilled' ? fsqResult.value : [];
  const osmPlaces = osmResult.status === 'fulfilled' ? osmResult.value : [];

  console.log(`  📦 Foursquare: ${fsqPlaces.length} địa điểm`);
  console.log(`  📦 OSM: ${osmPlaces.length} địa điểm`);

  if (fsqResult.status === 'rejected') {
    console.warn(`  ❌ Foursquare failed:`, fsqResult.reason);
  }
  if (osmResult.status === 'rejected') {
    console.warn(`  ❌ OSM failed:`, osmResult.reason);
  }
  if (fsqResult.status === 'rejected' || osmResult.status === 'rejected') {
    throw new Error('Source fetch failed; existing city JSON has been preserved.');
  }

  // Merge & dedup
  const merged = mergePlaces(fsqPlaces, osmPlaces);
  const { places, stats, removed } = prunePlaces(merged.places);

  // Assign placeholder images for places without photos
  for (const place of places) {
    if (!place.imageUrl) {
      place.imageUrl = getPlaceholderImage(place.categoryGroup);
      place.isPlaceholderImage = true;
    }
  }

  console.log(`  ✅ Kết quả: ${stats.total} tổng (${stats.fromFoursquare} FSQ, ${stats.fromOSM} OSM, ${stats.merged} merged, ${stats.needsReview} cần kiểm tra)`);
  console.log(`  🧹 Đã loại ${removed} địa điểm thiếu thông tin hoặc ghi rõ đã đóng cửa`);

  const now = new Date().toISOString();

  return {
    cityId: city.id,
    cityName: city.name,
    center: { lat: city.lat, lng: city.lng },
    fetchedAt: now,
    sources: {
      foursquare: { count: fsqPlaces.length, fetchedAt: now },
      osm: { count: osmPlaces.length, fetchedAt: now },
    },
    stats,
    places,
    attribution: {
      foursquare: FSQ_API_KEY ? 'Foursquare Places API' : '',
      osm: 'Data © OpenStreetMap contributors (ODbL)',
    },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🚀 VietGo Places Pre-fetcher');
  console.log('============================');

  if (!FSQ_API_KEY) {
    console.warn('⚠️  VITE_FOURSQUARE_API_KEY not set in .env — will only fetch from OSM');
  }

  // Determine which cities to process
  const args = process.argv.slice(2);
  const unknown = args.filter(id => !CITIES.some(city => city.id === id));
  if (unknown.length) throw new Error(`Unknown city IDs: ${unknown.join(', ')}`);
  const targetCities = args.length > 0
    ? CITIES.filter(c => args.includes(c.id))
    : CITIES;

  if (targetCities.length === 0) {
    console.error('❌ No valid city IDs provided. Available:', CITIES.map(c => c.id).join(', '));
    process.exit(1);
  }

  console.log(`📍 Thành phố: ${targetCities.map(c => c.name).join(', ')}`);

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Process each city
  for (const city of targetCities) {
    try {
      const data = await processCity(city);

      const outputFile = path.join(OUTPUT_DIR, `${city.id}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`  💾 Saved → ${path.relative(process.cwd(), outputFile)}`);
    } catch (err) {
      console.error(`  ❌ Failed to process ${city.name}:`, err);
      process.exitCode = 1;
    }

    // Rate limiting between cities
    await sleep(1000);
  }

  console.log('\n✨ Done!');
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});
