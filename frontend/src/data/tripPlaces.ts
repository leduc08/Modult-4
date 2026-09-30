import { getAvailableCityIds, loadCityPlaces, type MergedPlaceJSON } from './places';
import { activityCost, referencePriceFor, type ReferencePrice } from './plannerPricing';

export const CITY_NAMES: Record<string, string> = {
  'ha-noi': 'Hà Nội', 'da-nang': 'Đà Nẵng', 'hoi-an': 'Hội An',
  'hue': 'Huế', 'ninh-binh': 'Ninh Bình', 'da-lat': 'Đà Lạt',
  'sa-pa': 'Sa Pa', 'phu-quoc': 'Phú Quốc', 'nha-trang': 'Nha Trang',
  'tp-hcm': 'TP. Hồ Chí Minh',
};

export const SUPPORTED_CITIES = getAvailableCityIds().filter(id => CITY_NAMES[id]).map(id => ({ id, name: CITY_NAMES[id] }));
export type TripPlace = MergedPlaceJSON & { cityId: string; fetchedAt: string; referencePrice?: ReferencePrice | null; plannedStartTime?: string; plannedDurationMinutes?: number };
export type TripDay = { dayNumber: number; date: string; places: TripPlace[] };
export type Participants = { adults: number; children: number; infants: number };
export type VerifiedTrip = { id: string; cityId: string; startDate: string; endDate?: string; days: number; guests: number; participants?: Participants; budget?: number | null; interest?: string; pace?: string; schedule: TripDay[]; savedAt?: string };

const isUsefulPlace = (place: MergedPlaceJSON) =>
  !place.needsReview && Boolean(place.name?.trim() && place.address?.trim()) &&
  Number.isFinite(place.coordinates?.lat) && Number.isFinite(place.coordinates?.lng) &&
  !/^\d+\s|^(unnamed|không tên|restaurant|cafe|coffee)$/i.test(place.name.trim());

export async function getCityTripPlaces(cityId: string): Promise<{ places: TripPlace[]; fetchedAt: string } | null> {
  const data = await loadCityPlaces(cityId);
  if (!data) return null;
  const places = data.places.filter(isUsefulPlace).filter(place =>
    ['sightseeing', 'culture', 'food', 'cafe'].includes(place.categoryGroup)
  ).map(place => {
    const result = { ...place, cityId, fetchedAt: data.fetchedAt };
    return { ...result, referencePrice: referencePriceFor(result) };
  });
  return { places, fetchedAt: data.fetchedAt };
}

type Slot = { category: 'sight' | 'food'; start: string; duration: number };
const slotsFor = (pace?: string): Slot[] => pace === 'thư thả'
  ? [{ category: 'sight', start: '09:00', duration: 120 }, { category: 'food', start: '12:00', duration: 75 }]
  : pace === 'nhiều điểm'
    ? [{ category: 'sight', start: '09:00', duration: 120 }, { category: 'food', start: '12:00', duration: 75 }, { category: 'sight', start: '15:00', duration: 120 }, { category: 'food', start: '19:00', duration: 75 }]
    : [{ category: 'sight', start: '09:00', duration: 120 }, { category: 'food', start: '12:00', duration: 75 }, { category: 'sight', start: '15:00', duration: 120 }];

const minutes = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};

/** Only uncomplicated daily hours can be checked reliably without interpreting an OSM ruleset. */
export function openingCompatibility(hours: string | null, start: string, duration: number, date?: string, weeklyHours?: TripPlace['weeklyHours']): 'open' | 'closed' | 'unknown' {
  if (weeklyHours && date) {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const entry = weeklyHours[days[weekday]];
    if (entry?.status === 'closed') return 'closed';
    if (entry?.status === 'all_day') return 'open';
    if (entry?.status === 'unknown') return 'unknown';
    if (entry?.status === 'open') return entry.open && entry.close && minutes(start) >= minutes(entry.open) && minutes(start) + duration <= minutes(entry.close) ? 'open' : 'closed';
  }
  if (!hours) return 'unknown';
  if (/^\s*cả ngày\b|^\s*24\/7\b/i.test(hours)) return 'open';
  if (/\b(Mo|Tu|We|Th|Fr|Sa|Su)\b/i.test(hours) && !/Mo-Su/i.test(hours)) return 'unknown';
  const match = hours.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!match) return 'unknown';
  const open = Number(match[1]) * 60 + Number(match[2]);
  const close = Number(match[3]) * 60 + Number(match[4]);
  if (close <= open) return 'unknown';
  return minutes(start) >= open && minutes(start) + duration <= close ? 'open' : 'closed';
}

export function makeTrip(input: { cityId: string; startDate: string; endDate?: string; days: number; guests: number; participants?: Participants; budget?: number | null; interest?: string; pace?: string }, places: TripPlace[]): VerifiedTrip | null {
  const slots = slotsFor(input.pace);
  const sightsNeeded = slots.filter(slot => slot.category === 'sight').length * input.days;
  const foodsNeeded = slots.filter(slot => slot.category === 'food').length * input.days;
  const useful = places.filter(place => !place.needsReview && place.operatingStatus !== 'temporarily_closed' && place.operatingStatus !== 'permanently_closed' && place.name?.trim() && place.address?.trim()
    && Number.isFinite(place.coordinates?.lat) && Number.isFinite(place.coordinates?.lng));
  const sights = useful.filter(place => ['sightseeing', 'culture'].includes(place.categoryGroup));
  const foods = useful.filter(place => place.categoryGroup === 'food');
  if (sights.length < sightsNeeded || foods.length < foodsNeeded) return null;
  const used = new Set<string>();
  const schedule: TripDay[] = [];
  let knownSpent = 0;
  let previousDayAnchor: TripPlace | null = null;
  const budget = typeof input.budget === 'number' && Number.isFinite(input.budget) ? input.budget : null;

  for (let dayIndex = 0; dayIndex < input.days; dayIndex++) {
    const date = new Date(`${input.startDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + dayIndex);
    const selected: TripPlace[] = [];
    for (const slot of slots) {
      const pool = slot.category === 'sight' ? sights : foods;
      const anchor = selected.at(-1) || previousDayAnchor;
      const remainingSlots = (input.days - dayIndex - 1) * slots.length + slots.length - selected.length;
      const targetPerSlot = budget === null ? null : Math.max(0, budget - knownSpent) / Math.max(1, remainingSlots);
      const candidates = pool.filter(place => !used.has(place.id)
        && openingCompatibility(place.openingHours, slot.start, slot.duration, date.toISOString().slice(0, 10), place.weeklyHours) !== 'closed');
      const ranked = candidates.map(place => {
        const cost = activityCost(place, input.participants);
        const priced = place.price?.status === 'free' || place.price?.status === 'priced' || (!place.price && Boolean(place.referencePrice ?? referencePriceFor(place)));
        const quality = (['foursquare', 'merged', 'admin'].includes(place.dataSource) ? 8 : 0)
          + (place.imageUrl && !place.isPlaceholderImage ? 3 : 0)
          + (openingCompatibility(place.openingHours, slot.start, slot.duration, date.toISOString().slice(0, 10), place.weeklyHours) === 'open' ? 3 : 0)
          + (place.categoryGroup === input.interest ? 12 : 0);
        const proximity = anchor ? Math.min(30, estimateDistanceKm(anchor, place)) * 0.8 : 0;
        // A documented affordable price beats an unknown price, without pretending unknown means free.
        const affordability = targetPerSlot === null ? 0 : !priced ? -5
          : cost.knownVnd <= targetPerSlot ? 17 - Math.min(6, cost.knownVnd / Math.max(1, targetPerSlot) * 6)
            : -Math.min(24, (cost.knownVnd - targetPerSlot) / Math.max(1, targetPerSlot) * 8);
        return { place, score: quality + affordability - proximity };
      }).sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name, 'vi'));
      const choice = ranked[0]?.place;
      if (!choice) return null;
      const place = { ...choice, plannedStartTime: slot.start, plannedDurationMinutes: slot.duration };
      selected.push(place);
      used.add(place.id);
      knownSpent += activityCost(place, input.participants).knownVnd;
    }
    previousDayAnchor = selected[0];
    schedule.push({ dayNumber: dayIndex + 1, date: date.toISOString().slice(0, 10), places: selected });
  }
  return { ...input, budget, id: `trip-${Date.now()}`, schedule };
}

export function estimateTravelMinutes(a: TripPlace, b: TripPlace): number {
  const radians = (n: number) => n * Math.PI / 180;
  const dLat = radians(b.coordinates.lat - a.coordinates.lat);
  const dLng = radians(b.coordinates.lng - a.coordinates.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.coordinates.lat)) * Math.cos(radians(b.coordinates.lat)) * Math.sin(dLng / 2) ** 2;
  const km = 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return Math.max(10, Math.ceil(km / 25 * 60 / 5) * 5);
}

export function estimateDistanceKm(a: TripPlace, b: TripPlace): number {
  const radians = (n: number) => n * Math.PI / 180;
  const dLat = radians(b.coordinates.lat - a.coordinates.lat);
  const dLng = radians(b.coordinates.lng - a.coordinates.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.coordinates.lat)) * Math.cos(radians(b.coordinates.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)) * 10) / 10;
}
