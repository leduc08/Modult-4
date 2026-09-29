import test from 'node:test';
import assert from 'node:assert/strict';
import { getSuggestedChatActions } from '../ai/suggestedChatActions.ts';
const history = [{ sender: 'user', text: 'Muốn đi Hà Nội 3 ngày 2 người ngân sách 2 triệu' }, { sender: 'user', text: 'thấy chán chán' }];
const reply = (extra = {}) => ({ sender: 'ai', text: 'Gợi ý trải nghiệm tại Hà Nội.', ...extra });
test('only explicit DeepSeek proposals show buttons, never keywords or old chat', () => {
  assert.deepEqual(getSuggestedChatActions(history, reply()), []);
  assert.deepEqual(getSuggestedChatActions(history, reply({ suggestedActions: [] })), []);
  assert.equal(getSuggestedChatActions(history, reply({ suggestedActions: ['open_planner'] }))[0]?.action, 'open_planner');
});
test('planner proposals require complete customer details, not AI assumptions', () => {
  assert.deepEqual(getSuggestedChatActions([{ sender: 'user', text: 'Hà Nội 3 ngày 2 triệu' }], reply({ text: 'Đi 2 người nhé', suggestedActions: ['open_planner'] })), []);
  for (const text of ['Đổi sang Hà Giang', '10 ngày', 'Ngân sách 5-7 triệu']) {
    assert.deepEqual(getSuggestedChatActions([...history, {sender:'user',text}], reply({suggestedActions:['open_planner']})), []);
  }
});
test('map and food proposals require backend-verified place targets', () => {
  const proposals = { suggestedActions: ['open_map', 'open_food'] };
  assert.deepEqual(getSuggestedChatActions(history, reply(proposals)), []);
  assert.deepEqual(getSuggestedChatActions(history, reply({...proposals, verifiedActions:['open_map']})).map(x => x.action), ['open_map']);
  assert.deepEqual(getSuggestedChatActions(history, reply({...proposals, verifiedActions:['open_map','open_food']})).map(x => x.action), ['open_map','open_food']);
});
test('unknown, duplicate and model-supplied labels are sanitized', () => {
  const result = getSuggestedChatActions(history, reply({suggestedActions:['delete_data','open_planner',{action:'open_planner',label:'unsafe'},null]}));
  assert.deepEqual(result, [{action:'open_planner',label:'📅 Tạo lịch trình chi tiết'}]);
});
test('errors, images, welcome and preview messages cannot show chat proposals', () => {
  for (const extra of [{actionsUnavailable:true},{id:'ai-image-1'},{id:'welcome-1'},{richData:{tripPreview:{}}}]) {
    assert.deepEqual(getSuggestedChatActions(history, reply({suggestedActions:['open_planner'],...extra})), []);
  }
});
