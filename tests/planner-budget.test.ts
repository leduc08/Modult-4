import assert from 'node:assert/strict';
import { test } from 'node:test';
import { activityCost, referencePriceFor, tripCostSummary } from '../frontend/src/data/plannerPricing';
import type { TripPlace, VerifiedTrip } from '../frontend/src/data/tripPlaces';

const place = (patch: Partial<TripPlace>): TripPlace => ({
  id: 'unknown', name: 'Địa điểm thật chưa có giá', cityId: 'ha-noi', fetchedAt: '2026-09-29',
  coordinates: { lat: 21.03, lng: 105.85 }, address: 'Hà Nội', categoryGroup: 'culture',
  categoryLabel: 'Di tích', dataSource: 'osm', rating: null, reviewCount: null, imageUrl: null,
  isPlaceholderImage: true, phone: null, website: null, openingHours: null, description: null,
  needsReview: false, conflictNote: null, tags: [], ...patch,
});
const unknown = place({});
const temple = place({ id: 'fsq-4e7a8f74922e2de019a55441', name: 'Temple of Literature (Văn Miếu Quốc Tử Giám)', coordinates: { lat: 21.0276, lng: 105.8355 } });
const cafe = place({ id: 'fsq-4da853c24df0af29b70aa963', name: 'Cafe Giảng', coordinates: { lat: 21.0336, lng: 105.8546 }, categoryGroup: 'cafe' });
const trip = (budget: number | null, places: TripPlace[]): VerifiedTrip => ({ id: 'test', cityId: 'ha-noi', startDate: '2026-10-01', days: 1, guests: 2, participants: { adults: 2, children: 0, infants: 0 }, budget, schedule: [{ dayNumber: 1, date: '2026-10-01', places }] });

test('unknown prices stay unknown and zero budget differs from unspecified', () => {
  assert.equal(referencePriceFor(unknown), null);
  assert.equal(activityCost(unknown, trip(null, []).participants).badge, 'Chưa có thông tin giá');
  assert.equal(tripCostSummary(trip(null, [unknown])).budget, null);
  assert.equal(tripCostSummary(trip(0, [unknown])).budget, 0);
  assert.equal(tripCostSummary(trip(0, [unknown])).missingPriceCount, 1);
});

test('ticket and dish units are counted separately with source prices', () => {
  assert.equal(referencePriceFor(temple)?.unit, 'ticket');
  assert.equal(referencePriceFor(cafe)?.unit, 'dish');
  assert.equal(activityCost(temple, trip(null, []).participants).knownVnd, 140000);
  assert.equal(activityCost(cafe, trip(null, []).participants).knownVnd, 80000);
  assert.equal(activityCost(cafe, trip(null, []).participants).incomplete, true);
  const summary = tripCostSummary(trip(200000, [temple, cafe, unknown]));
  assert.equal(summary.knownVnd, 220000);
  assert.equal(summary.exceededVnd, 20000);
  assert.equal(summary.missingPriceCount, 1);
  assert.equal(summary.incompleteCount, 2);
});

test('child tickets are never silently priced as free', () => {
  assert.equal(activityCost(temple, { adults: 1, children: 1, infants: 0 }).knownVnd, 70000);
  assert.equal(activityCost(temple, { adults: 1, children: 1, infants: 0 }).incomplete, true);
});
