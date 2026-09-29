import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveChatAction } from '../ai/chatActions.ts';
import { PROVINCES } from '../database/vietnamData.ts';
import { DeepSeekClient } from '../ai/deepseekClient.ts';

test('actions use the latest requested destination, trip parameters and recommended places', async () => {
  const dalat = PROVINCES.find(p => p.name.includes('Đà Lạt'))!;
  const result = await resolveChatAction([
    { sender: 'user', text: 'Tư vấn Đà Nẵng' },
    { sender: 'ai', text: 'Bạn muốn đi đâu tiếp?' },
    { sender: 'user', text: 'Đà Lạt 2 ngày cho 4 người, ngân sách 5 triệu' },
    { sender: 'ai', text: `${dalat.pois[0].name}. Ăn ${dalat.foods[0].dishName}.` },
  ], null);
  assert.equal(result?.provinceId, dalat.id);
  assert.equal(result?.days, 2);
  assert.equal(result?.guests, 4);
  assert.equal(result?.budget, 5000000);
  assert.ok(result?.poiIds.includes(dalat.pois[0].id));
  assert.ok(result?.foodIds.includes(dalat.foods[0].id));
});

test('a chat without a destination does not silently navigate to Da Nang', async () => {
  assert.equal(await resolveChatAction([{ sender: 'user', text: 'Xin chào' }], null), null);
});

test('latest explicit user details override inconsistent model extraction', async () => {
  const ai = new DeepSeekClient('test-key');
  ai.generateContent = async () => ({ text: JSON.stringify({ provinceId: 'ha-noi', days: 5, guests: 2, budget: 5000000, style: '' }) });
  const result = await resolveChatAction([
    { sender: 'user', text: 'Muốn đi Đà Nẵng 3 ngày 2 đêm chi phí 10 triệu' },
    { sender: 'user', text: 'Đi 3 người nhé' },
    { sender: 'user', text: 'Đổi thành 4 ngày, ngân sách 12 triệu' },
  ], ai, 'open_planner');
  assert.equal(result?.provinceId, PROVINCES.find(p => p.name === 'Đà Nẵng')?.id);
  assert.equal(result?.days, 4);
  assert.equal(result?.guests, 3);
  assert.equal(result?.budget, 12000000);
});

test('map action carries verified main-branch place IDs into the map focus', async () => {
  const result = await resolveChatAction([
    { sender: 'user', text: 'Gợi ý quán ăn Hà Nội' },
    { sender: 'ai', text: 'Địa điểm có trong dữ liệu VietGo tại Hà Nội:\n• Quán A — Hà Nội (ID: osm-node-123; nguồn: osm; giờ mở cửa: chưa có)' },
  ], null, 'open_food');
  assert.deepEqual(result?.foodIds, ['osm-node-123']);
});

test('continuing a trip preserves destination and guests across follow-up messages', async () => {
  const result = await resolveChatAction([
    { sender: 'user', text: 'Lên lịch trình Đà Lạt 3 ngày cho 3 khách, ngân sách 6 triệu' },
    { sender: 'ai', text: 'Mình sẽ tư vấn chuyến Đà Lạt của bạn.' },
    { sender: 'user', text: 'Đổi thành 2 ngày nhé' },
    { sender: 'ai', text: 'Đã đổi chuyến đi thành 2 ngày cho 3 khách.' },
  ], null);
  assert.ok(result?.destination.includes('Đà Lạt'));
  assert.equal(result?.days, 2);
  assert.equal(result?.guests, 3);
  assert.equal(result?.budget, 6000000);
});

test('summary updates fields independently, retaining older details beyond ten messages', async () => {
  const messages = [
    { sender: 'user', text: 'Hà Nội 3 ngày cho 2 khách ngân sách 4 triệu, khám phá văn hóa' },
    ...Array.from({ length: 12 }, () => ({ sender: 'ai', text: 'Thông tin tham khảo.' })),
    { sender: 'user', text: 'Đổi thành Đà Lạt 5 ngày' },
    { sender: 'user', text: 'Đi 3 người và ngân sách 7 triệu nhé' },
    { sender: 'user', text: 'Ưu tiên nghỉ dưỡng' },
  ];
  const result = await resolveChatAction(messages, null);
  assert.ok(result?.destination.includes('Đà Lạt'));
  assert.equal(result?.days, 5);
  assert.equal(result?.guests, 3);
  assert.equal(result?.budget, 7000000);
  assert.equal(result?.style, 'Nghỉ dưỡng & Chill');
  const retained = await resolveChatAction(messages.slice(0, -3), null);
  assert.ok(retained?.destination.includes('Hà Nội'));
  assert.equal(retained?.budget, 4000000);
});
