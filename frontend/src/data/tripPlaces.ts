import { getAvailableCityIds, loadCityPlaces, type MergedPlaceJSON } from './places';

export const CITY_NAMES: Record<string, string> = {
  'ha-noi': 'Hà Nội', 'da-nang': 'Đà Nẵng', 'hoi-an': 'Hội An',
  'hue': 'Huế', 'ninh-binh': 'Ninh Bình', 'da-lat': 'Đà Lạt',
  'sa-pa': 'Sa Pa', 'phu-quoc': 'Phú Quốc', 'nha-trang': 'Nha Trang',
  'tp-hcm': 'TP. Hồ Chí Minh',
};

export const SUPPORTED_CITIES = getAvailableCityIds().filter(id => CITY_NAMES[id]).map(id => ({ id, name: CITY_NAMES[id] }));
export type TripPlace = MergedPlaceJSON & { cityId: string; fetchedAt: string; plannedStartTime?: string; plannedDurationMinutes?: number };
export type TripDay = { dayNumber: number; date: string; places: TripPlace[] };
export type Participants = { adults: number; children: number; infants: number };
export type VerifiedTrip = { id: string; cityId: string; startDate: string; endDate?: string; days: number; guests: number; participants?: Participants; budget?: number; interest?: string; pace?: string; schedule: TripDay[]; savedAt?: string };

const isUsefulPlace = (place: MergedPlaceJSON) =>
  !place.needsReview && Boolean(place.name?.trim() && place.address?.trim()) &&
  Number.isFinite(place.coordinates?.lat) && Number.isFinite(place.coordinates?.lng) &&
  !/^\d+\s|^(unnamed|không tên|restaurant|cafe|coffee)$/i.test(place.name.trim());

export async function getCityTripPlaces(cityId: string): Promise<{ places: TripPlace[]; fetchedAt: string } | null> {
  const data = await loadCityPlaces(cityId);
  if (!data) return null;
  const places = data.places.filter(isUsefulPlace).filter(place =>
    ['sightseeing', 'culture', 'food', 'cafe'].includes(place.categoryGroup)
  ).map(place => ({ ...place, cityId, fetchedAt: data.fetchedAt }));
  return { places, fetchedAt: data.fetchedAt };
}

export function makeTrip(input: { cityId: string; startDate: string; endDate?: string; days: number; guests: number; participants?: Participants; budget?: number; interest?: string; pace?: string }, places: TripPlace[]): VerifiedTrip | null {
  const sights = places.filter(p => ['sightseeing', 'culture'].includes(p.categoryGroup));
  const foods = places.filter(p => ['food', 'cafe'].includes(p.categoryGroup));
  const sightsPerDay = input.pace === 'nhiều điểm' ? 2 : 1;
  const foodsPerDay = input.pace === 'thư thả' ? 1 : 2;
  if (sights.length < input.days * sightsPerDay || foods.length < input.days * foodsPerDay) return null;
  const rank = (a: TripPlace, b: TripPlace) => Number(b.dataSource === 'foursquare' || b.dataSource === 'merged') - Number(a.dataSource === 'foursquare' || a.dataSource === 'merged') ||
    Number(Boolean(b.openingHours)) - Number(Boolean(a.openingHours)) ||
    Number(Boolean(b.imageUrl && !b.isPlaceholderImage)) - Number(Boolean(a.imageUrl && !a.isPlaceholderImage)) || a.name.localeCompare(b.name, 'vi');
  sights.sort((a, b) => Number(b.categoryGroup === input.interest) - Number(a.categoryGroup === input.interest) || rank(a, b));
  foods.sort((a, b) => Number(b.categoryGroup === input.interest) - Number(a.categoryGroup === input.interest) || rank(a, b));
  const schedule = Array.from({ length: input.days }, (_, index) => {
    const date = new Date(`${input.startDate}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index);
    const daySights = sights.slice(index * sightsPerDay, (index + 1) * sightsPerDay);
    const dayFoods = foods.slice(index * foodsPerDay, (index + 1) * foodsPerDay);
    const dailyPlaces = input.pace === 'nhiều điểm' ? [daySights[0], dayFoods[0], daySights[1], dayFoods[1]] : input.pace === 'thư thả' ? [daySights[0], dayFoods[0]] : [daySights[0], dayFoods[0], dayFoods[1]];
    const sightTimes = ['09:00', '15:00', '17:00'];
    const foodTimes = ['12:00', '19:00', '16:00'];
    let sightIndex = 0;
    let foodIndex = 0;
    const placesWithTimes = dailyPlaces.map(place => {
      if (!place) return place;
      const isFood = ['food', 'cafe'].includes(place.categoryGroup);
      const startTime = isFood ? foodTimes[Math.min(foodIndex++, foodTimes.length - 1)] : sightTimes[Math.min(sightIndex++, sightTimes.length - 1)];
      return { ...place, plannedStartTime: startTime, plannedDurationMinutes: isFood ? (place.categoryGroup === 'cafe' ? 60 : 75) : 120 };
    });
    return { dayNumber: index + 1, date: date.toISOString().slice(0, 10), places: placesWithTimes };
  });
  return { ...input, id: `trip-${Date.now()}`, schedule };
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
