import assert from 'node:assert/strict';
import test from 'node:test';
import { TOURISM_KNOWLEDGE_STATS, searchTourismKnowledge } from '../database/tourismKnowledge.ts';
import { buildRAGContext } from '../ai/ragContext.ts';
import { getTourismSearchTerms } from '../ai/supabaseKnowledge.ts';

test('loads the original training corpus without using validation questions', () => {
  assert.deepEqual(TOURISM_KNOWLEDGE_STATS, {
    dataset: 'vuonglsts/vietnam-tourism-v2', version: 1, split: 'train',
    articles: 139, passages: 1386, questions: 10588,
  });
});

test('finds Ha Giang knowledge beyond the original map provinces', () => {
  const results = searchTourismKnowledge('Kinh nghiệm đi mô tô vòng Hà Giang');
  assert.ok(results.some(result => result.title.includes('Hà Giang')));
  assert.ok(results.every(result => result.id.startsWith('kaggle-train-')));
});

test('Vietnamese queries work with and without diacritics', () => {
  assert.deepEqual(
    searchTourismKnowledge('Phố cổ Hội An').map(result => result.id),
    searchTourismKnowledge('Pho co Hoi An').map(result => result.id),
  );
});

test('Supabase search terms remove common Vietnamese stop words and duplicates', () => {
  assert.deepEqual(getTourismSearchTerms('Tôi muốn tìm địa điểm ở Đà Nẵng Đà Nẵng'), ['địa', 'điểm', 'đà', 'nẵng']);
});

test('empty or unrelated queries do not return arbitrary passages', () => {
  assert.deepEqual(searchTourismKnowledge(''), []);
  assert.deepEqual(searchTourismKnowledge('zzzzxxxxqqqq'), []);
  assert.equal(searchTourismKnowledge('Hà Nội', 2).length, 2);
});

test('chat context contains source attribution and is bounded', () => {
  const context = buildRAGContext('Kinh nghiệm đi mô tô vòng Hà Giang');
  assert.ok(context.includes('KAGGLE VIETNAM TOURISM V2'));
  assert.ok(context.includes('https://www.kaggle.com/datasets/vuonglsts/vietnam-tourism-v2'));
  assert.ok(context.includes('Hà Giang'));
  assert.ok(context.length < 12000);
  assert.ok(!context.includes('--- [TỈNH/THÀNH]: Hà Nội'));
});
