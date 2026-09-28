// Test API backend trên server riêng (mặc định cổng 3100 — chạy qua run-all.mjs)
import { writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { group, test, expect, summary } from './harness.mjs';

const BASE = process.env.TEST_BASE || 'http://localhost:3100';
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const post = (path, body, base = BASE) =>
  fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const fakeJwt = (payload) => `${b64({ alg: 'RS256', kid: 'x', typ: 'JWT' })}.${b64(payload)}.${Buffer.from('chu-ky-gia').toString('base64url')}`;

group('H. API xác thực Google');
await test('A01', 'GET /api/auth/google/config trả Client ID đã cấu hình', async () => {
  const r = await fetch(`${BASE}/api/auth/google/config`);
  expect((await r.json()).clientId).toBe('test-client-123.apps.googleusercontent.com');
});
await test('A02', 'Thiếu credential → 400', async () => expect((await post('/api/auth/google', {})).status).toBe(400));
await test('A03', 'credential không phải chuỗi → 400', async () => expect((await post('/api/auth/google', { credential: 123 })).status).toBe(400));
await test('A04', 'credential sai định dạng JWT → 400', async () => expect((await post('/api/auth/google', { credential: 'abc.def' })).status).toBe(400));
await test('A05', 'JSON hỏng trong body → không sập server (4xx)', async () => {
  const s = (await post('/api/auth/google', '{hỏng')).status;
  if (s < 400 || s >= 500) throw new Error(`status ${s}`);
});
await test('A06', 'JWT giả mạo (payload đúng aud, chữ ký giả) → 401', async () => {
  const token = fakeJwt({ iss: 'https://accounts.google.com', aud: 'test-client-123.apps.googleusercontent.com', sub: '1', email: 'hacker@gmail.com', email_verified: true, exp: Math.floor(Date.now() / 1000) + 3600 });
  const r = await post('/api/auth/google', { credential: token });
  if (r.status === 502) throw new Error('502: server không kết nối được Google (kiểm tra mạng)');
  expect(r.status).toBe(401);
});
await test('A07', 'JWT "alg: none" (không chữ ký) → 401', async () => {
  const token = `${b64({ alg: 'none' })}.${b64({ aud: 'test-client-123.apps.googleusercontent.com', email: 'x@gmail.com', email_verified: true })}.`;
  const r = await post('/api/auth/google', { credential: token });
  expect([400, 401].includes(r.status)).toBeTruthy();
});
await test('A08', 'Server vẫn hoạt động sau các request tấn công', async () => expect((await fetch(`${BASE}/api/health`)).status).toBe(200));

await test('A09', 'Server chưa có GOOGLE_CLIENT_ID → config rỗng + 503 khi đăng nhập', async () => {
  const env = { ...process.env, NODE_ENV: 'production', PORT: '3101', GOOGLE_CLIENT_ID: '', GEMINI_API_KEY: '' };
  const child = spawn('npx', ['tsx', 'backend/server.ts'], { cwd: ROOT, env, shell: true });
  try {
    for (let i = 0; i < 40; i++) {
      try { if ((await fetch('http://localhost:3101/api/health')).ok) break; } catch {}
      await new Promise((r) => setTimeout(r, 500));
    }
    expect((await (await fetch('http://localhost:3101/api/auth/google/config')).json()).clientId).toBe('');
    expect((await post('/api/auth/google', { credential: 'a.b.c' }, 'http://localhost:3101')).status).toBe(503);
  } finally {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { shell: true });
  }
});

group('I. API quét hóa đơn (Quản lý chi tiêu)');
const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
let scanStatus = 0;
await test('S01', 'Không có Gemini key → 503 + mã AI_UNAVAILABLE, KHÔNG trả dữ liệu giả', async () => {
  const r = await post('/api/scan-receipt', { imageBase64: tinyPng });
  scanStatus = r.status;
  const body = await r.json().catch(() => ({}));
  if (body.data) throw new Error(`vẫn trả dữ liệu hóa đơn: ${JSON.stringify(body.data).slice(0, 120)}`);
  expect(r.status).toBe(503);
  expect(body.code).toBe('AI_UNAVAILABLE');
  expect(body.error).toContain('nhập số tiền thủ công');
});
await test('S02', 'Thiếu ảnh → 400', async () => expect((await post('/api/scan-receipt', {})).status).toBe(400));
await test('S03', 'Ảnh không phải chuỗi → 400', async () => expect((await post('/api/scan-receipt', { imageBase64: 12345 })).status).toBe(400));
await test('S04', 'Định dạng GIF → 415 (chỉ nhận JPG/PNG/WEBP/HEIC)', async () => {
  const r = await post('/api/scan-receipt', { imageBase64: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=' });
  expect(r.status).toBe(415);
});
await test('S05', 'SVG (có thể chứa script) → 415', async () => {
  const r = await post('/api/scan-receipt', { imageBase64: 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=' });
  expect(r.status).toBe(415);
});
await test('S06', 'Ảnh > 8MB → 413', async () => {
  const big = 'data:image/jpeg;base64,' + 'A'.repeat(12 * 1024 * 1024);
  expect((await post('/api/scan-receipt', { imageBase64: big })).status).toBe(413);
});
await test('S07', 'Server vẫn chạy sau các request lỗi', async () => expect((await fetch(`${BASE}/api/health`)).status).toBe(200));

const report = summary('API');
report.meta = { scanStatus };
writeFileSync(new URL('./reports/report-api.json', import.meta.url), JSON.stringify(report, null, 2));
