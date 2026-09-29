import test from 'node:test';
import assert from 'node:assert/strict';
import { DeepSeekClient } from '../ai/deepseekClient.ts';
import { analyzeAssistantImage, validateAssistantImage } from '../ai/imageAnalysis.ts';
import { normalizeAIReceipt } from '../database/aiReceiptTypes.ts';

const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==';

test('assistant rejects malformed, unsupported and oversized images', () => {
  assert.equal(validateAssistantImage(png), png);
  for (const value of [undefined, 'https://example.com/photo.jpg', 'data:image/svg+xml;base64,PHN2Zz4=',
    'data:image/png;base64,aGVsbG8=', 'data:image/jpeg;base64,aGVsbG8=']) {
    assert.throws(() => validateAssistantImage(value));
  }
  const bytes = Buffer.alloc(3 * 1024 * 1024 + 1); bytes.set([137,80,78,71,13,10,26,10]);
  assert.throws(() => validateAssistantImage(`data:image/png;base64,${bytes.toString('base64')}`), /3MB/);
});

test('image analysis sends an actual image block, limits tokens and handles all categories', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const [category, label] of Object.entries({ receipt: 'Hóa đơn', landscape: 'Phong cảnh', food: 'Đồ ăn', other: 'Ảnh khác' })) {
      globalThis.fetch = async (_url, init) => {
        const body = JSON.parse(String(init?.body));
        assert.equal(body.model, 'deepseek-flash');
        assert.deepEqual(body.thinking, { type: 'disabled' });
        assert.equal(body.max_tokens, 1350);
        assert.match(body.messages[0].content, /không cần phải đọc được biển hiệu/);
        assert.match(body.messages[0].content, /Cầu Vàng ở Bà Nà Hills, Đà Nẵng/);
        const last = body.messages.at(-1);
        assert.equal(last.role, 'user');
        assert.equal(last.content[1].type, 'image_url');
        assert.equal(last.content[1].image_url.url, png);
        return new Response(JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
          category, summary: 'Mô tả kiểm thử', details: ['Chi tiết'], warnings: ['Cần xác minh'],
          dishName: category === 'food' ? 'Phở bò' : '', dishConfidence: category === 'food' ? 'high' : 'low',
          foodSearchTerms: category === 'food' ? ['Phở bò'] : [],
          landmarkGuess: category === 'landscape' ? 'Động Tiên Sơn' : '', provinceGuess: category === 'landscape' ? 'Quảng Bình' : '',
          locationConfidence: category === 'landscape' ? 'medium' : 'low',
          placeSearchTerms: category === 'landscape' ? ['hang động', 'thạch nhũ'] : [],
          visualClues: category === 'landscape' ? ['trần hang rộng', 'lối đi kim loại'] : [],
          ...(category === 'receipt' ? { receipt: {
            store: 'Quán ăn kiểm thử', totalAmount: 250000, currency: 'VND', date: '2026-09-29', category: 'food', paymentMethod: 'card',
          } } : {}),
        }) } }] }));
      };
      const question = category === 'landscape' ? 'Ảnh này chụp ở đâu?' : 'Phân tích giúp tôi';
      const result = await analyzeAssistantImage(png, question, new DeepSeekClient('test-key'));
      assert.equal(result.category, category);
      assert.ok(result.text.includes(label));
      assert.ok(result.text.includes('Cần xác minh'));
      if (category === 'receipt') {
        assert.equal(result.receiptDraft?.amount, 250000);
        assert.equal(result.receiptDraft?.title, 'Quán ăn kiểm thử');
        assert.equal(result.receiptDraft?.date, '2026-09-29');
      } else assert.equal(result.receiptDraft, undefined);
      if (category === 'food') {
        assert.equal(result.dishName, 'Phở bò');
        assert.match(result.text, /Món có thể là: Phở bò/);
      }
      if (category === 'landscape') {
        assert.equal(result.landmarkGuess, 'Động Tiên Sơn');
        assert.match(result.text, /Địa danh có thể là: Động Tiên Sơn — Quảng Bình/);
      }
    }
  } finally { globalThis.fetch = originalFetch; }
});

test('receipt drafts require valid VND totals and calendar dates before pre-filling expenses', () => {
  for (const totalAmount of [0, -1, 12.5, 1_000_000_001, '250000', undefined]) {
    assert.equal(normalizeAIReceipt({ totalAmount, currency: 'VND' }).amount, null);
  }
  assert.equal(normalizeAIReceipt({ totalAmount: 100, currency: 'USD' }).amount, null);
  assert.equal(normalizeAIReceipt({ totalAmount: 100 }).amount, null);
  assert.equal(normalizeAIReceipt({ date: '2026-02-30' }).date, '');
  assert.equal(normalizeAIReceipt({ date: '2026-09-29' }).date, '2026-09-29');
  assert.equal(normalizeAIReceipt(undefined).title, '');
});

test('generic scenery is described as uncertain instead of claiming a place', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
      category: 'landscape', summary: 'Một khoang hang rộng.', details: [], warnings: [],
      dishName: '', dishConfidence: 'low', foodSearchTerms: [], landmarkGuess: '', provinceGuess: '',
      locationConfidence: 'low', placeSearchTerms: ['hang động', 'thạch nhũ'], visualClues: ['trần hang rộng'],
    }) } }] }));
    const result = await analyzeAssistantImage(png, 'Ảnh này chụp ở đâu?', new DeepSeekClient('test-key'));
    assert.match(result.text, /chưa có dấu hiệu đủ riêng biệt/);
    assert.equal(result.landmarkGuess, '');
  } finally { globalThis.fetch = originalFetch; }
});

test('distinctive stone hands supporting a bridge recover the Golden Bridge landmark', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
      category: 'landscape',
      summary: 'Cầu có bàn tay đá khổng lồ nâng đỡ nhịp cầu, xung quanh là đồi núi và cây xanh.',
      details: ['Nhiều người đi bộ trên cầu.'], warnings: [],
      dishName: '', dishConfidence: 'low', foodSearchTerms: [], landmarkGuess: '', provinceGuess: '',
      locationConfidence: 'low', placeSearchTerms: [], visualClues: [],
    }) } }] }));
    const result = await analyzeAssistantImage(png, 'Ảnh này chụp ở đâu?', new DeepSeekClient('test-key'));
    assert.equal(result.landmarkGuess, 'Cầu Vàng (Golden Bridge), Bà Nà Hills');
    assert.equal(result.provinceGuess, 'Đà Nẵng');
    assert.equal(result.locationConfidence, 'medium');
    assert.ok(result.placeSearchTerms.includes('Cầu Vàng'));
    assert.ok(result.placeSearchTerms.includes('Bà Nà Hills'));
    assert.match(result.text, /Địa danh có thể là: Cầu Vàng \(Golden Bridge\), Bà Nà Hills — Đà Nẵng \(độ chắc chắn vừa/);
    assert.match(result.text, /Dấu hiệu AI nhận thấy: đôi bàn tay đá khổng lồ nâng đỡ cây cầu/);
  } finally { globalThis.fetch = originalFetch; }
});

test('invalid category or provider failure is not presented as a successful analysis', async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const category of ['unknown', 'toString', '__proto__']) {
      globalThis.fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({
        category, summary: 'Test', details: [], warnings: [],
        dishName: '', dishConfidence: 'low', foodSearchTerms: [], landmarkGuess: '', provinceGuess: '',
        locationConfidence: 'low', placeSearchTerms: [], visualClues: [],
      }) } }] }));
      await assert.rejects(() => analyzeAssistantImage(png, '', new DeepSeekClient('test-key')), /phân loại/);
    }
    globalThis.fetch = async () => new Response('{}', { status: 401 });
    await assert.rejects(() => analyzeAssistantImage(png, '', new DeepSeekClient('test-key')), /401/);
  } finally { globalThis.fetch = originalFetch; }
});
