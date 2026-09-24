import test from 'node:test';
import assert from 'node:assert/strict';
import { isInactiveOSM, prunePlaces } from './placeQuality.ts';
import type { MergedPlace } from './mergeEngine.ts';

function place(overrides: Partial<MergedPlace>): MergedPlace {
  return {
    id: 'osm-1', name: 'Quán cà phê', coordinates: { lat: 21, lng: 105 },
    address: '', categoryGroup: 'cafe', categoryLabel: 'Cà phê',
    dataSource: 'osm', rating: null, reviewCount: null,
    imageUrl: null, isPlaceholderImage: true, phone: null, website: null,
    openingHours: null, description: null, needsReview: false,
    conflictNote: null, tags: [], ...overrides,
  };
}

test('prunes businesses with no identifying details and explicit closed names', () => {
  const input = [
    place({ id: 'empty' }),
    place({ id: 'closed', name: 'The Keys Cafe (closed)', address: '54 Lê Lai' }),
    place({ id: 'address', address: '25 Hàng Cá' }),
    place({ id: 'phone', phone: '123', dataSource: 'foursquare' }),
    place({ id: 'website', website: 'https://example.com', dataSource: 'merged' }),
    place({ id: 'landmark', categoryGroup: 'sightseeing' }),
  ];
  const result = prunePlaces(input);
  assert.deepEqual(result.places.map(p => p.id), ['address', 'phone', 'website', 'landmark']);
  assert.equal(result.removed, 2);
  assert.deepEqual(result.stats, {
    total: 4, fromFoursquare: 1, fromOSM: 2, merged: 1, needsReview: 0,
  });
});

test('recognizes explicit inactive OSM tags without rejecting active replacements', () => {
  assert.equal(isInactiveOSM({ shop: 'vacant' }), true);
  assert.equal(isInactiveOSM({ shop: 'bakery', disused: 'yes' }), true);
  assert.equal(isInactiveOSM({ shop: 'bakery', 'disused:shop': 'butcher' }), false);
});
