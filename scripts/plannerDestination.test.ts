import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { AI_SUPPORTED_CITIES, resolveAIPlannerCity } from '../ai/plannerDestination.ts';
import { resolveChatAction } from '../ai/chatActions.ts';
import { getSuggestedChatActions } from '../ai/suggestedChatActions.ts';
import { PROVINCES } from '../database/vietnamData.ts';
import { createVerifiedPlan } from '../backend/verifiedPlanRoute.ts';

// Read the actual frontend city registry without executing its Vite-only loader.
const citySource = await readFile('frontend/src/data/tripPlaces.ts', 'utf8');
const cityRegistry = citySource.match(/export const CITY_NAMES[^=]*=\s*\{([\s\S]*?)\};/)?.[1];
assert.ok(cityRegistry);
const CITY_NAMES: Record<string, string> = Object.fromEntries([...cityRegistry.matchAll(/'([^']+)'\s*:\s*'([^']+)'/g)].map(match => [match[1], match[2]]));
assert.equal(Object.keys(CITY_NAMES).length, 10);
assert.deepEqual(AI_SUPPORTED_CITIES, CITY_NAMES);

test('all supported city labels and corresponding AI province labels map to existing data', async () => {
  for (const [cityId, name] of Object.entries(CITY_NAMES)) {
    const province = PROVINCES.find(p => p.name.includes(name));
    if (province) assert.equal(resolveAIPlannerCity(province.id, province.name, CITY_NAMES), cityId);
    assert.equal(resolveAIPlannerCity(cityId, name, CITY_NAMES), cityId);
    assert.equal(resolveAIPlannerCity('', name, CITY_NAMES), cityId);
    const data = JSON.parse(await readFile(`frontend/src/data/places/${cityId}.json`, 'utf8'));
    assert.ok(data.places.length > 0);
  }
});

test('cities missing from the legacy province catalog use existing city data for AI actions', async () => {
  for (const [id, name] of [['sa-pa', 'Sa Pa'], ['nha-trang', 'Nha Trang']]) {
    const message = { sender: 'user', text: `Lên lịch trình ${name} 3 ngày 2 người ngân sách 10 triệu` };
    const context = await resolveChatAction([message], null, 'open_planner');
    assert.equal(context?.provinceId, id);
    assert.ok(context?.coordinates.lat);
    assert.ok(getSuggestedChatActions([message], { sender: 'ai', text: 'Mình đã đủ thông tin chuyến đi.', suggestedActions: ['open_planner'] }).some(action => action.action === 'open_planner'));
  }
});

test('Da Lat legacy province creates a three-day plan from existing city data without an AI call', async () => {
  const destination = resolveAIPlannerCity('lam-dong', 'Lâm Đồng (Đà Lạt)', CITY_NAMES);
  assert.equal(destination, 'da-lat');
  const result = await createVerifiedPlan({ destination, days: 3, peopleCount: 2, budget: 10000000 }, null);
  assert.ok('plan' in result);
  if ('plan' in result) {
    assert.equal(result.plan.provinceId, 'da-lat');
    assert.equal(result.plan.days.length, 3);
    assert.equal(result.plan.totalBudget, 10000000);
  }
  assert.equal(resolveAIPlannerCity('ha-giang', 'Hà Giang', CITY_NAMES), undefined);
});
