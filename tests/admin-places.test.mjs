import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { spawn } from 'node:child_process';
import net from 'node:net';
import test from 'node:test';

async function freePort() {
  const server = net.createServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

test('admin place API requires one signed session and publishes validated edits', async () => {
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const sub = '123456789012345678901';
  const secret = '0123456789abcdef0123456789abcdef';
  const child = spawn(process.execPath, ['dist/server.cjs'], {
    cwd: process.cwd(), env: {
      ...process.env, NODE_ENV: 'production', PORT: String(port), GOOGLE_CLIENT_ID: 'test-client-id',
      ADMIN_GOOGLE_SUB: sub, ADMIN_SESSION_SECRET: secret, VIETGO_DB_PATH: ':memory:',
    }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stderr.on('data', data => { output += data.toString(); });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (child.exitCode !== null) break;
      try { if ((await fetch(`${base}/api/health`)).ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.ok(ready, `Server did not start: ${output}`);
    const status = await (await fetch(`${base}/api/admin/session`)).json();
    assert.deepEqual(status, { authenticated: false, isAdmin: false, configured: true });
    const original = await (await fetch(`${base}/api/places/da-nang`)).json();
    const body = { name: 'Địa điểm kiểm thử', address: 'Đà Nẵng', categoryGroup: 'sightseeing',
      categoryLabel: 'Danh thắng', coordinates: { lat: 16.06, lng: 108.21 }, description: 'Mô tả kiểm thử' };
    const endpoint = `${base}/api/admin/places/da-nang`;
    const send = (url, method, payload, headers = {}) => fetch(url, { method,
      headers: { 'Content-Type': 'application/json', Origin: base, ...headers }, body: JSON.stringify(payload),
    });
    assert.equal((await send(endpoint, 'POST', body)).status, 403);
    const expiry = String(Date.now() + 60_000);
    const signature = createHmac('sha256', secret).update(`${sub}.${expiry}`).digest('hex');
    const cookie = `vietgo_admin_session=${sub}.${expiry}.${signature}`;
    assert.equal((await send(endpoint, 'POST', body, { Cookie: `${cookie}broken` })).status, 403);
    assert.equal((await send(endpoint, 'POST', body, { Cookie: cookie, Origin: 'https://other.example' })).status, 403);
    assert.equal((await send(endpoint, 'POST', { ...body, coordinates: { lat: 999, lng: 0 } }, { Cookie: cookie })).status, 422);
    const createdResponse = await send(endpoint, 'POST', body, { Cookie: cookie });
    assert.equal(createdResponse.status, 201);
    const created = await createdResponse.json();
    assert.match(created.id, /^admin-/);
    let updated = await (await fetch(`${base}/api/places/da-nang`)).json();
    assert.equal(updated.places.length, original.places.length + 1);
    assert.equal(updated.places.find(place => place.id === created.id).name, body.name);
    const edit = await send(`${endpoint}/${created.id}`, 'PUT', { ...body, version: 1, name: 'Đã chỉnh sửa' }, { Cookie: cookie });
    assert.equal(edit.status, 200);
    updated = await (await fetch(`${base}/api/places/da-nang`)).json();
    assert.equal(updated.places.find(place => place.id === created.id).name, 'Đã chỉnh sửa');
    assert.equal(updated.places.length, original.places.length + 1);
    const existing = original.places[0];
    const existingEdit = await send(`${endpoint}/${existing.id}`, 'PUT', {
      ...existing, version: 0, name: 'Tên đã được admin sửa',
    }, { Cookie: cookie });
    assert.equal(existingEdit.status, 200, JSON.stringify(await existingEdit.json()));
    updated = await (await fetch(`${base}/api/places/da-nang`)).json();
    assert.equal(updated.places.find(place => place.id === existing.id).name, 'Tên đã được admin sửa');
    assert.equal(updated.places.length, original.places.length + 1);
  } finally {
    child.kill();
  }
});
