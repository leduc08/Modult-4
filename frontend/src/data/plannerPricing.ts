import { PROVINCES } from './vietnamData';
import type { Participants, TripPlace, VerifiedTrip } from './tripPlaces';

export type PriceUnit = 'ticket' | 'dish';
export type ReferencePrice = {
  amountVnd: number;
  unit: PriceUnit;
  sourcePlaceId: string;
  sourceName: string;
};

type PriceLink = {
  cityId: string;
  placeId: string;
  sourcePlaceId: string;
  namePart: string;
  maxDistanceMeters: number;
};

// These IDs, names and coordinates were checked against the shared place catalog.
// Compound source records are linked only to the specific venue they price.
const priceLinks: PriceLink[] = [
  { cityId: 'ha-noi', placeId: 'fsq-4bb01e46f964a5201d383ce3', sourcePlaceId: 'hn-poi-1', namePart: 'Đền Ngọc Sơn', maxDistanceMeters: 80 },
  { cityId: 'ha-noi', placeId: 'fsq-4e7a8f74922e2de019a55441', sourcePlaceId: 'hn-poi-2', namePart: 'Văn Miếu', maxDistanceMeters: 180 },
  { cityId: 'ha-noi', placeId: 'fsq-4da853c24df0af29b70aa963', sourcePlaceId: 'hn-food-3', namePart: 'Cafe Giảng', maxDistanceMeters: 80 },
  { cityId: 'da-nang', placeId: 'osm-way-694831926', sourcePlaceId: 'dn-poi-1', namePart: 'Cầu Rồng', maxDistanceMeters: 120 },
  { cityId: 'hoi-an', placeId: 'merged-4e4f9790b61cf637a4f6d002', sourcePlaceId: 'ha-food-2', namePart: 'Bánh Mì Phượng', maxDistanceMeters: 120 },
];

const sourcePlaces = PROVINCES.flatMap(province => [...province.pois, ...province.foods]);
const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');

export const formatVnd = (amount: number) => `${new Intl.NumberFormat('vi-VN').format(amount)} ₫`;

export function referencePriceFor(place: Pick<TripPlace, 'id' | 'name' | 'cityId' | 'coordinates'>): ReferencePrice | null {
  const link = priceLinks.find(item => item.cityId === place.cityId && item.placeId === place.id);
  if (!link || !normalize(place.name).includes(normalize(link.namePart))) return null;
  const source = sourcePlaces.find(item => item.id === link.sourcePlaceId);
  if (!source) return null;
  const meters = Math.hypot((source.coordinates.lat - place.coordinates.lat) * 111_000,
    (source.coordinates.lng - place.coordinates.lng) * 105_000);
  if (meters > link.maxDistanceMeters) return null;
  const isFood = 'avgPrice' in source;
  const amountVnd = isFood ? source.avgPrice : source.ticketPrice;
  if (!Number.isFinite(amountVnd) || amountVnd < 0) return null;
  return { amountVnd, unit: isFood ? 'dish' : 'ticket', sourcePlaceId: source.id, sourceName: source.name };
}

export function activityCost(place: TripPlace, participants?: Participants): {
  knownVnd: number; incomplete: boolean; missingPrice: boolean; badge: string; explanation: string;
} {
  const admin = place.price;
  if (admin?.status === 'unknown') return { knownVnd: 0, incomplete: true, missingPrice: true,
    badge: 'Chưa có thông tin giá', explanation: 'Giá chưa được xác minh cho địa điểm này.' };
  if (admin?.status === 'free') return { knownVnd: 0, incomplete: false, missingPrice: false,
    badge: 'Miễn phí', explanation: 'Địa điểm được VietGo biên tập là miễn phí.' };
  if (admin?.status === 'priced' && admin.minVnd != null && admin.unit) {
    const amount = admin.minVnd;
    const adults = participants?.adults ?? 0;
    const knownVnd = admin.unit === 'group' ? amount : amount * adults;
    const uncertainPeople = !participants || (admin.unit !== 'group' && (participants.children > 0 || participants.infants > 0));
    const incomplete = uncertainPeople || admin.unit === 'dish' || (admin.maxVnd != null && admin.maxVnd > amount);
    const unit = { person: 'người', ticket: 'vé', dish: 'món', group: 'cả nhóm' }[admin.unit];
    const range = admin.maxVnd != null && admin.maxVnd > amount ? `${formatVnd(amount)}–${formatVnd(admin.maxVnd)}` : formatVnd(amount);
    return { knownVnd, incomplete, missingPrice: false, badge: `${range}/${unit}`,
      explanation: `Giá tham khảo ${range}/${unit}. ${admin.unit === 'group' ? 'Tính cho cả nhóm.' : 'Chi phí đã biết tạm tính theo người lớn.'}${incomplete ? ' Chi phí thực tế có thể cao hơn vì khoảng giá, số món hoặc giá trẻ em chưa xác định.' : ''}` };
  }
  const price = place.referencePrice ?? referencePriceFor(place);
  if (!price) return { knownVnd: 0, incomplete: true, missingPrice: true, badge: 'Chưa có thông tin giá', explanation: 'Nguồn địa điểm chưa có giá. Không tính hoạt động này là miễn phí.' };
  const source = `Giá tham khảo từ dữ liệu VietGo: ${price.sourceName} (${price.sourcePlaceId}).`;
  if (price.unit === 'ticket') {
    const adults = participants?.adults ?? 0;
    const incomplete = !participants || participants.children > 0 || participants.infants > 0;
    return {
      knownVnd: price.amountVnd * adults,
      incomplete,
      missingPrice: false,
      badge: price.amountVnd === 0 ? 'Tham quan miễn phí · theo dữ liệu' : `${formatVnd(price.amountVnd)}/vé tham khảo`,
      explanation: `${source} ${price.amountVnd === 0 ? 'Nguồn ghi giá tham quan bằng 0.' : 'Tạm tính một vé/người lớn.'}${incomplete ? ' Chưa có giá vé phù hợp cho trẻ em hoặc chưa biết cơ cấu nhóm.' : ''}`,
    };
  }
  const adults = participants?.adults ?? 0;
  return {
    knownVnd: price.amountVnd * adults,
    incomplete: true,
    missingPrice: false,
    badge: `${formatVnd(price.amountVnd)}/món tham khảo`,
    explanation: `${source} Tạm tính một món/người lớn; số món gọi thêm và khẩu phần trẻ em chưa xác định.`,
  };
}

export function tripCostSummary(trip: VerifiedTrip) {
  const activities = trip.schedule.flatMap(day => day.places);
  const costs = activities.map(place => activityCost(place, trip.participants));
  const knownVnd = costs.reduce((sum, cost) => sum + cost.knownVnd, 0);
  const incompleteCount = costs.filter(cost => cost.incomplete).length;
  const missingPriceCount = costs.filter(cost => cost.missingPrice).length;
  const budget = typeof trip.budget === 'number' && Number.isFinite(trip.budget) ? trip.budget : null;
  return { knownVnd, incompleteCount, missingPriceCount, budget, exceededVnd: budget !== null ? Math.max(0, knownVnd - budget) : 0 };
}
