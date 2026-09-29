import assert from 'node:assert/strict';
import test from 'node:test';
import { extractChatBudget } from '../ai/chatBudget.ts';

test('budget supports Vietnamese units, decimal millions and full VND amounts', () => {
  for (const [text, expected] of [
    ['Ngân sách 6 triệu', 6000000], ['6tr', 6000000], ['1,5 triệu', 1500000],
    ['600k', 600000], ['600 nghìn', 600000], ['6.000.000đ', 6000000],
    ['6,000,000 VND', 6000000], ['6000000 đồng', 6000000],
  ] as const) assert.equal(extractChatBudget([text]), expected, text);
});

test('budget persists across follow-ups and uses the latest update', () => {
  assert.equal(extractChatBudget(['Đà Lạt ngân sách 6 triệu', 'Đi 3 ngày']), 6000000);
  assert.equal(extractChatBudget(['Ngân sách 6 triệu', 'Đổi ngân sách thành 8 triệu']), 8000000);
  assert.equal(extractChatBudget(['Đà Lạt 3 ngày cho 3 khách']), undefined);
});
