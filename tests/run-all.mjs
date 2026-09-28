// Chạy toàn bộ kiểm thử: build → server riêng cổng 3100 → unit → API → E2E → tổng hợp
// Dùng: cd tests && npm install && npm test
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TESTS = fileURLToPath(new URL('.', import.meta.url));
const PORT = process.env.TEST_PORT || '3100';
const run = (cmd, args, cwd = ROOT, env = {}) =>
  spawnSync(cmd, args, { cwd, stdio: 'inherit', shell: true, env: { ...process.env, ...env } }).status;

console.log('① Build frontend…');
if (run('npx', ['vite', 'build', 'frontend', '--config', 'frontend/vite.config.ts']) !== 0) process.exit(1);

console.log(`② Khởi động server test ở cổng ${PORT}…`);
const server = spawn('npx', ['tsx', 'backend/server.ts'], {
  cwd: ROOT,
  shell: true,
  env: { ...process.env, NODE_ENV: 'production', PORT, GOOGLE_CLIENT_ID: 'test-client-123.apps.googleusercontent.com', GEMINI_API_KEY: '' }
});
const stopServer = () => spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'], { shell: true }) || server.kill();
process.on('exit', stopServer);

let up = false;
for (let i = 0; i < 60 && !up; i++) {
  try { up = (await fetch(`http://localhost:${PORT}/api/health`)).ok; } catch {}
  if (!up) await new Promise((r) => setTimeout(r, 500));
}
if (!up) { console.error('Server không khởi động được'); process.exit(1); }

const env = { TEST_BASE: `http://localhost:${PORT}` };
console.log('③ Unit – tài khoản');   run('npx', ['--prefix', '..', 'tsx', 'unit-auth.mts'], TESTS, env);
console.log('④ Unit – chi tiêu');    run('npx', ['--prefix', '..', 'tsx', 'unit-budget.mts'], TESTS, env);
console.log('⑤ API');               run('node', ['api.mjs'], TESTS, env);
console.log('⑥ E2E trên Chrome');   run('node', ['e2e.mjs'], TESTS, env);
stopServer();

// Tổng hợp
const suites = ['unit-auth', 'unit-budget', 'api', 'e2e']
  .map((n) => new URL(`./reports/report-${n}.json`, import.meta.url))
  .filter((u) => existsSync(u))
  .map((u) => JSON.parse(readFileSync(u, 'utf8')));
const total = suites.reduce((a, s) => a + s.total, 0);
const pass = suites.reduce((a, s) => a + s.pass, 0);
const summary = { runAt: new Date().toISOString(), total, pass, fail: total - pass, suites: suites.map(({ title, total, pass, fail, groups }) => ({ title, total, pass, fail, groups })) };
writeFileSync(new URL('./reports/summary.json', import.meta.url), JSON.stringify(summary, null, 2));

console.log('\n══════════════ TỔNG KẾT ══════════════');
for (const s of suites) console.log(`${s.title.padEnd(28)} ${String(s.pass).padStart(3)}/${String(s.total).padEnd(3)} PASS`);
console.log(`${'TỔNG'.padEnd(28)} ${String(pass).padStart(3)}/${String(total).padEnd(3)} PASS (${((pass / total) * 100).toFixed(1)}%)`);
const fails = suites.flatMap((s) => s.results.filter((r) => r.status === 'FAIL'));
if (fails.length) {
  console.log('\nCase lỗi:');
  for (const f of fails) console.log(`  ❌ ${f.id} ${f.name}\n     → ${f.error.split('\n')[0]}`);
}
process.exit(fails.length ? 1 : 0);
