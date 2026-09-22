import assert from 'node:assert/strict';
import test from 'node:test';
import { mergePlaces, normalizeName, type MergedPlace } from './mergeEngine.ts';

function place(source: 'foursquare' | 'osm', overrides: Partial<MergedPlace> = {}): MergedPlace {
  return {
    id: source, name: 'Cà phê Đà Nẵng', coordinates: { lat: 16.0544, lng: 108.2022 },
    address: '', categoryGroup: 'cafe', categoryLabel: 'Cafe', dataSource: source,
    foursquareId: source === 'foursquare' ? 'fsq-1' : undefined,
    osmId: source === 'osm' ? 'node/1' : undefined,
    rating: null, reviewCount: null, imageUrl: null, isPlaceholderImage: true,
    phone: null, website: null, openingHours: null, description: null,
    needsReview: false, conflictNote: null, tags: [], ...overrides,
  };
}

test('Vietnamese normalization preserves d and strips accents', () => {
  assert.equal(normalizeName('  CÀ PHÊ Đà Nẵng! '), 'ca phe da nang');
});

test('matching sources keep both IDs and unknown ratings, supplement missing fields', () => {
  const fsq = place('foursquare', { phone: '123' });
  const osm = place('osm', { phone: '456', website: 'https://example.com' });
  const { places, stats } = mergePlaces([fsq], [osm]);
  assert.equal(stats.merged, 1);
  assert.equal(places[0].foursquareId, 'fsq-1');
  assert.equal(places[0].osmId, 'node/1');
  assert.equal(places[0].rating, null);
  assert.equal(places[0].phone, '123');
  assert.equal(places[0].website, 'https://example.com');
});

test('conflicting addresses stay separate and both records are flagged', () => {
  const fsq = place('foursquare', { address: '12 Bach Dang' });
  const osm = place('osm', { address: '900 Nguyen Van Linh' });
  const result = mergePlaces([fsq], [osm]);
  assert.equal(result.stats.merged, 0);
  assert.equal(result.stats.total, 2);
  assert.equal(result.stats.needsReview, 2);
  assert.equal(fsq.needsReview, false);
  assert.equal(osm.needsReview, false);
});

test('coordinate conflict above 100m is flagged without merging', () => {
  const result = mergePlaces([place('foursquare')], [place('osm', {
    coordinates: { lat: 16.0564, lng: 108.2022 },
  })]);
  assert.equal(result.stats.merged, 0);
  assert.equal(result.stats.needsReview, 2);
});

test('nearby different names are not merged, 50-100m matches stay separate', () => {
  assert.equal(mergePlaces([place('foursquare')], [place('osm', { name: 'Museum' })]).stats.merged, 0);
  const result = mergePlaces([place('foursquare')], [place('osm', {
    coordinates: { lat: 16.0551, lng: 108.2022 },
  })]);
  assert.equal(result.stats.total, 2);
  assert.equal(result.stats.needsReview, 0);
});

test('one source record cannot be consumed by two merges', () => {
  const result = mergePlaces([place('foursquare')], [place('osm'), place('osm', { id: 'osm-2', osmId: 'node/2' })]);
  assert.equal(result.stats.merged, 1);
  assert.equal(result.stats.fromOSM, 1);
  assert.equal(result.stats.total, 2);
});
