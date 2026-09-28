// Mini test harness dùng chung cho unit / API / E2E (không cần framework)
import { mkdirSync } from 'node:fs';

export const REPORT_DIR = new URL('./reports/', import.meta.url);
mkdirSync(new URL('./screenshots/', REPORT_DIR), { recursive: true });

export const results = [];
let currentGroup = 'Chung';
export const group = (name) => {
  currentGroup = name;
  console.log(`\n▸ ${name}`);
};

export const test = async (id, name, fn) => {
  const start = Date.now();
  try {
    await fn();
    results.push({ id, group: currentGroup, name, status: 'PASS', ms: Date.now() - start });
    console.log(`  ✅ ${id} ${name}`);
  } catch (e) {
    results.push({ id, group: currentGroup, name, status: 'FAIL', error: e.message, ms: Date.now() - start });
    try { await globalThis.__shot?.(id); } catch {}
    console.log(`  ❌ ${id} ${name}\n       → ${e.message.split('\n')[0]}`);
  }
};

export const expect = (actual) => ({
  toBe: (exp) => { if (actual !== exp) throw new Error(`mong đợi ${JSON.stringify(exp)}, nhận ${JSON.stringify(actual)}`); },
  toBeTruthy: () => { if (!actual) throw new Error(`mong đợi truthy, nhận ${JSON.stringify(actual)}`); },
  toBeFalsy: () => { if (actual) throw new Error(`mong đợi falsy, nhận ${JSON.stringify(actual)}`); },
  toContain: (s) => { if (!String(actual).includes(s)) throw new Error(`"${String(actual).slice(0, 160)}" không chứa "${s}"`); },
  notToContain: (s) => { if (String(actual).includes(s)) throw new Error(`"${String(actual).slice(0, 160)}" không được chứa "${s}"`); },
  toMatch: (re) => { if (!re.test(String(actual))) throw new Error(`"${actual}" không khớp ${re}`); },
  toBeLessThan: (n) => { if (!(actual < n)) throw new Error(`mong đợi < ${n}, nhận ${actual}`); }
});

export const expectThrow = async (fn, contains) => {
  try { await fn(); } catch (e) {
    if (contains && !e.message.includes(contains)) throw new Error(`lỗi sai nội dung: "${e.message}" (mong đợi chứa "${contains}")`);
    return e.message;
  }
  throw new Error(`mong đợi báo lỗi${contains ? ` "${contains}"` : ''} nhưng không có lỗi`);
};

export const summary = (title) => {
  const groups = {};
  for (const r of results) {
    groups[r.group] ??= { pass: 0, fail: 0 };
    groups[r.group][r.status === 'PASS' ? 'pass' : 'fail']++;
  }
  const pass = results.filter((r) => r.status === 'PASS').length;
  console.log(`\n=== ${title}: ${pass}/${results.length} PASS ===`);
  for (const [g, c] of Object.entries(groups)) console.log(`  ${g}: ${c.pass} pass, ${c.fail} fail`);
  return { title, total: results.length, pass, fail: results.length - pass, groups, results, finishedAt: new Date().toISOString() };
};
