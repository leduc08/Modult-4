import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTripState } from '../ai/tripState.ts';
import { resolveChatAction } from '../ai/chatActions.ts';
import { getSuggestedChatActions } from '../ai/suggestedChatActions.ts';

const base = 'Lên lịch trình Đà Nẵng 3 ngày 2 người ngân sách 10 triệu';
const messages = (...texts: string[]) => texts.map(text => ({ sender: 'user', text }));
const planner = (...texts: string[]) => getSuggestedChatActions(messages(...texts), { sender: 'ai', text: 'Mình đã tổng hợp thông tin chuyến đi.', suggestedActions: ['open_planner'] }).some(a => a.action === 'open_planner');

test('unaccented budget and contextual money share one extraction for button and preview', async () => {
  const text = 'Muon di Da Nang 3 ngay 2 nguoi ngan sach 10 trieu';
  assert.equal(extractTripState(messages(text)).budget, 10000000);
  assert.ok(planner(text));
  const result = await resolveChatAction(messages(text), null, 'open_planner');
  assert.equal(result?.budget, 10000000);
});

test('meal and ticket prices cannot replace a trip budget across follow-ups', async () => {
  const history = messages(base, 'Quán mì có món 50k không?', 'Vé vào cửa giá 200k', 'Tiếp tục lịch trình');
  assert.equal(extractTripState(history).budget, 10000000);
  assert.equal((await resolveChatAction(history, null, 'open_planner'))?.budget, 10000000);
});

test('latest unsupported destination blocks old city reuse in both policy and execution', async () => {
  for (const text of ['Muốn đi Hà Giang 3 ngày', 'Lên lịch trình Hà Giang 3 ngày']) {
    const state = extractTripState(messages(base, text));
    assert.match(state.destination || '', /Hà Giang/i);
    assert.equal(state.cityId, undefined);
    assert.ok(!planner(base, text));
    await assert.rejects(resolveChatAction(messages(base, text), null, 'open_planner'), /Hà Giang/i);
    assert.equal(extractTripState(messages(base, text, 'Đổi sang Đà Lạt 3 ngày')).cityId, 'da-lat');
  }
});

test('per-person budget is converted to group total and recalculated when group changes', async () => {
  const text = 'Muốn đi Đà Nẵng 3 ngày 3 người ngân sách 5 triệu mỗi người';
  assert.equal(extractTripState(messages(text)).budget, 15000000);
  assert.equal(extractTripState(messages(text, 'Đi 4 người nhé')).budget, 20000000);
  assert.equal((await resolveChatAction(messages(text), null, 'open_planner'))?.budget, 15000000);
});

test('budget ranges require a concrete follow-up instead of choosing an endpoint', async () => {
  const text = 'Muốn đi Đà Nẵng 3 ngày 2 người ngân sách 5-7 triệu';
  assert.ok(!planner(text));
  await assert.rejects(resolveChatAction(messages(text), null, 'open_planner'), /ngân sách cụ thể/);
  assert.ok(planner(text, 'Chốt ngân sách 6 triệu'));
  assert.equal(extractTripState(messages(text, 'Chốt ngân sách 6 triệu')).budget, 6000000);
});

test('family totals include children and infants, including separate updates', async () => {
  const text = 'Muốn đi Đà Nẵng 3 ngày 2 người lớn 1 trẻ em ngân sách 10 triệu';
  assert.equal(extractTripState(messages(text)).guests, 3);
  assert.equal(extractTripState(messages(text, 'Có 1 em bé')).guests, 4);
  assert.equal((await resolveChatAction(messages(text), null, 'open_planner'))?.guests, 3);
});

test('ten days stays ten in state, is blocked explicitly and can be corrected', async () => {
  const text = 'Muốn đi Đà Nẵng 10 ngày 2 người ngân sách 10 triệu';
  assert.equal(extractTripState(messages(text)).days, 10);
  assert.ok(!planner(text));
  await assert.rejects(resolveChatAction(messages(text), null, 'open_planner'), /1 đến 7 ngày/);
  assert.ok(planner(text, 'Đổi thành 7 ngày'));
  assert.equal((await resolveChatAction(messages(text, 'Đổi thành 7 ngày'), null, 'open_planner'))?.days, 7);
});
