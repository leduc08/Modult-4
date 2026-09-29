import test from 'node:test';
import assert from 'node:assert/strict';
import type { FoodSpot, POI } from '../database/types.ts';
import { getImageRecommendations } from '../ai/imageRecommendations.ts';
import type { AssistantImageAnalysis } from '../ai/imageAnalysis.ts';
import { searchTourismCatalogForImage } from '../ai/supabaseKnowledge.ts';
import type { TourismCatalogResult } from '../ai/supabaseKnowledge.ts';

const poi: POI = {
  id: 'poi-cave', name: 'Động Tiên Sơn', category: 'Thiên nhiên',
  coordinates: { lat: 17.56, lng: 106.29 }, address: 'Phong Nha, Quảng Bình',
  openingHours: 'Chưa xác minh', ticketPrice: 0, estimatedTime: '2 giờ',
  description: 'Hang đá vôi có thạch nhũ và các khoang rộng.', imageUrl: 'https://example.com/cave.jpg',
  tags: ['hang động', 'thạch nhũ'], localTips: 'Kiểm tra thông tin trước chuyến đi.', rating: 4.5, reviewCount: 10,
};

const food: FoodSpot = {
  id: 'food-mi-quang', name: 'Quán Mì Quảng Bà An', dishName: 'Mì Quảng', category: 'Món chính',
  address: 'Đà Nẵng', coordinates: { lat: 16.06, lng: 108.22 }, priceRange: 'Chưa cập nhật', avgPrice: 0,
  bestTime: 'Chưa cập nhật', isMustTry: false, isSeasonal: false, isLocalFavorite: true,
  description: 'Quán có phục vụ mì Quảng.', imageUrl: 'https://example.com/food.jpg', rating: 4.6,
  reviewCount: 20, signatureDish: 'Mì Quảng gà',
};

const row = (type: string, name: string, payload: object): TourismCatalogResult => ({
  record_id: `${type}/test`, record_type: type, province_name: 'Đà Nẵng', name, category: null,
  payload: payload as Record<string, unknown>, relevance: 0.05,
});

const analysis = (values: Partial<AssistantImageAnalysis>): AssistantImageAnalysis => ({
  category: 'other', text: '', dishName: '', dishConfidence: 'low', foodSearchTerms: [],
  landmarkGuess: '', provinceGuess: '', locationConfidence: 'low', placeSearchTerms: [], visualClues: [],
  ...values,
});

test('food recognition returns only matching food records as chat cards', async () => {
  const result = await getImageRecommendations(analysis({
    category: 'food', dishName: 'Mì Quảng', dishConfidence: 'high', foodSearchTerms: ['Mì Quảng gà'],
  }), async (_query, type) => {
    assert.equal(type, 'food');
    return [row('food', food.dishName, food), row('poi', poi.name, poi)];
  });
  assert.deepEqual(result.richData.foods.map(item => item.id), [food.id]);
  assert.deepEqual(result.richData.pois, []);
  assert.equal(result.knowledgeSources[0]?.title, 'Mì Quảng — Đà Nẵng');
});

test('a named scenic guess only returns a matching catalog landmark', async () => {
  const result = await getImageRecommendations(analysis({
    category: 'landscape', landmarkGuess: 'Động Tiên Sơn', provinceGuess: 'Quảng Bình',
    locationConfidence: 'medium', placeSearchTerms: ['hang động', 'thạch nhũ'],
  }), async () => [row('poi', poi.name, poi)]);
  assert.equal(result.placeMatch, 'possible_landmark');
  assert.deepEqual(result.richData.pois.map(item => item.id), [poi.id]);
});

test('uncertain scenery yields similar place suggestions, never a claimed landmark', async () => {
  const result = await getImageRecommendations(analysis({
    category: 'landscape', placeSearchTerms: ['hang động', 'thạch nhũ'], visualClues: ['khoang hang rộng'],
  }), async () => [row('poi', poi.name, poi)]);
  assert.equal(result.placeMatch, 'similar_places');
  assert.deepEqual(result.richData.pois.map(item => item.id), [poi.id]);
});

test('low-confidence dish guesses do not trigger restaurant recommendations', async () => {
  let searched = false;
  const result = await getImageRecommendations(analysis({
    category: 'food', dishName: 'Có thể là món Việt', dishConfidence: 'low', foodSearchTerms: ['món Việt'],
  }), async () => { searched = true; return [row('food', food.dishName, food)]; });
  assert.equal(searched, false);
  assert.deepEqual(result.richData.foods, []);
});

test('image catalog retrieval sends text search terms and filters to the requested record type', async () => {
  const oldUrl = process.env.SUPABASE_URL;
  const oldKey = process.env.SUPABASE_SECRET_KEY;
  const originalFetch = globalThis.fetch;
  try {
    process.env.SUPABASE_URL = 'https://unit-test.supabase.co';
    process.env.SUPABASE_SECRET_KEY = 'unit-test-key';
    globalThis.fetch = async (url, init) => {
      assert.equal(url, 'https://unit-test.supabase.co/rest/v1/rpc/search_tourism_catalog');
      assert.match(String(init?.headers && (init.headers as Record<string, string>).Authorization), /^Bearer /);
      const body = JSON.parse(String(init?.body));
      assert.ok(body.search_terms.includes('quảng'));
      assert.equal(body.result_limit, 12);
      return new Response(JSON.stringify([
        { ...row('food', food.dishName, food), relevance: 0.05 },
        { ...row('poi', poi.name, poi), relevance: 0.05 },
      ]));
    };
    const rows = await searchTourismCatalogForImage('Mì Quảng Đà Nẵng', 'food');
    assert.deepEqual(rows.map(item => item.record_type), ['food']);
  } finally {
    globalThis.fetch = originalFetch;
    if (oldUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = oldUrl;
    if (oldKey === undefined) delete process.env.SUPABASE_SECRET_KEY; else process.env.SUPABASE_SECRET_KEY = oldKey;
  }
});
