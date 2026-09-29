import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getChatSystemInstruction, getTripPlannerPrompt } from '../ai/systemPrompt.ts';

test('chat loads Markdown style while preserving grounding and requested language', () => {
  const style = readFileSync('ai/AI_RESPONSE_STYLE.md', 'utf8').trim();
  assert.ok(style.length > 0);
  for (const [language, expected] of [['vi', 'Tiếng Việt'], ['en', 'English'], ['ko', '한국어'], ['ja', '日本語'], ['zh', '中文'], ['unknown', 'Tiếng Việt']]) {
    const prompt = getChatSystemInstruction(language);
    assert.ok(prompt.endsWith(style));
    assert.ok(prompt.includes(`Ngôn ngữ phản hồi: ${expected}`));
    assert.ok(prompt.includes('Ưu tiên dữ liệu tourism_catalog trong Supabase'));
    assert.ok(prompt.includes('không bịa giá'));
    assert.ok(prompt.includes('hỏi một thông tin quan trọng nhất mỗi lượt'));
    assert.ok(prompt.includes('giao diện hiện hiển thị văn bản thuần'));
    assert.ok(!prompt.includes('in đậm tên quán/địa điểm, giá tiền'));
  }
});

test('chat style does not alter itinerary JSON prompt', () => {
  const prompt = getTripPlannerPrompt({ numDays: 3, provinceName: 'Hà Nội', totalBudget: 4000000,
    count: 2, companions: 'Cặp đôi', style: 'Văn hóa', poisInfo: 'Điểm A', foodsInfo: 'Món B' });
  assert.ok(prompt.includes('output dạng JSON chính xác theo Schema'));
  assert.ok(!prompt.includes('Phong cách trả lời của VietGo AI'));
});
