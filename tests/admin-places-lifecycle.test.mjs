import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import test from 'node:test';

async function freePort() {
  const socket = net.createServer();
  await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port;
  await new Promise(resolve => socket.close(resolve));
  return port;
}
const sub = 'admin-test-sub';
const secret = '0123456789abcdef0123456789abcdef';
const cookieFor = (subject, admin = false) => {
  const expiry = String(Date.now() + 600000);
  const value = admin ? `${subject}.${expiry}` : `user.${subject}.${expiry}`;
  const signature = createHmac('sha256', secret).update(value).digest('hex');
  return `${admin ? 'vietgo_admin_session' : 'vietgo_google_session'}=${subject}.${expiry}.${signature}`;
};
async function start(dbPath) {
  const port = await freePort();
  const base = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, ['dist/server.cjs'], { cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: 'production', PORT: String(port), GOOGLE_CLIENT_ID: 'test-client',
      ADMIN_GOOGLE_SUB: sub, ADMIN_SESSION_SECRET: secret, VIETGO_DB_PATH: dbPath,
      VIETGO_UPLOAD_DIR: path.join(process.cwd(), 'data', 'test-upload-' + path.basename(dbPath)) },
    stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = ''; child.stderr.on('data', data => { stderr += data; });
  for (let i = 0; i < 100; i++) {
    if (child.exitCode !== null) break;
    try { if ((await fetch(`${base}/api/health`)).ok) return { base, child }; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  child.kill(); throw new Error('Server failed: ' + stderr);
}
const send = (base, route, method = 'GET', body, cookie) => fetch(base + route, {
  method, headers: { Origin: base, ...(cookie ? { Cookie: cookie } : {}), ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

test('admin lifecycle protects draft, audit, images, edits and soft deletion', async () => {
  const dbPath = path.join(process.cwd(), 'data', `test-places-${randomUUID()}.sqlite`);
  const imageDir = path.join(process.cwd(), 'data', 'test-upload-' + path.basename(dbPath));
  let service;
  try {
    service = await start(dbPath);
    const { base } = service;
    const admin = cookieFor(sub, true);
    const ordinary = cookieFor('ordinary-user');
    const draft = { cityId: 'da-nang', name: 'Địa điểm thử quản trị', categoryGroup: 'culture', categoryLabel: 'Văn hóa',
      address: '', coordinates: null, publicationStatus: 'draft', operatingStatus: 'unverified', internalNotes: 'Chỉ admin đọc',
      price: { status: 'unknown' }, weeklyHours: {}, isAdmin: true };
    for (const route of ['/api/admin/place-records', '/api/admin/place-records/audit']) {
      assert.equal((await send(base, route)).status, 403);
      assert.equal((await send(base, route, 'GET', undefined, ordinary)).status, 403);
    }
    const normalStatus = await (await send(base, '/api/admin/session', 'GET', undefined, ordinary)).json();
    assert.equal(normalStatus.authenticated, true);
    assert.equal(normalStatus.isAdmin, false);
    assert.equal((await send(base, '/api/admin/place-records', 'POST', draft)).status, 403);
    assert.equal((await send(base, '/api/admin/place-records', 'POST', draft, ordinary)).status, 403);
    const create = await send(base, '/api/admin/place-records', 'POST', draft, admin);
    assert.equal(create.status, 201, JSON.stringify(await create.clone().json()));
    let place = (await create.json()).place;
    assert.match(place.id, /^admin-/);
    assert.equal(place.version, 1);
    const publicRoute = '/api/places/da-nang';
    let publicData = await (await send(base, publicRoute)).json();
    assert.equal(publicData.places.some(item => item.id === place.id), false);
    const adminList = await (await send(base, '/api/admin/place-records?query=Địa%20điểm%20thử&status=draft', 'GET', undefined, admin)).json();
    assert.equal(adminList.items.some(item => item.id === place.id), true);
    const badPublish = await send(base, `/api/admin/place-records/da-nang/${place.id}`, 'PUT', { ...draft, publicationStatus: 'published', version: 1 }, admin);
    assert.equal(badPublish.status, 422);

    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+XcZkAAAAASUVORK5CYII=', 'base64');
    assert.equal((await fetch(base + '/api/admin/place-images', { method: 'POST', headers: { 'Content-Type': 'image/png' }, body: png })).status, 403);
    const upload = await fetch(base + '/api/admin/place-images', { method: 'POST', headers: { 'Content-Type': 'image/png', Cookie: admin, Origin: base }, body: png });
    assert.equal(upload.status, 201, await upload.clone().text());
    const uploaded = await upload.json();
    assert.ok(uploaded?.url);
    assert.equal((await send(base, uploaded.url)).status, 404);
    assert.equal((await send(base, `/api/admin/place-images/${uploaded.id}`, 'GET', undefined, admin)).status, 200);

    const publish = await send(base, `/api/admin/place-records/da-nang/${place.id}`, 'PUT', {
      ...draft, version: 1, publicationStatus: 'published', coordinates: { lat: 16.07, lng: 108.22 },
      address: 'Đà Nẵng', imageUrl: uploaded.url, price: { status: 'unknown' }, internalNotes: 'Không được lộ',
    }, admin);
    assert.equal(publish.status, 200, JSON.stringify(await publish.clone().json()));
    place = (await publish.json()).place;
    assert.equal(place.version, 2);
    assert.equal((await send(base, `/api/admin/place-records/da-nang/${place.id}`, 'PUT', { ...draft, version: 1 }, admin)).status, 409);
    publicData = await (await send(base, publicRoute)).json();
    const shown = publicData.places.find(item => item.id === place.id);
    assert.equal(shown.price.status, 'unknown');
    assert.equal(Object.hasOwn(shown, 'internalNotes'), false);
    assert.equal(Object.hasOwn(shown, 'publicationStatus'), false);
    assert.equal((await send(base, uploaded.url)).status, 200);

    const audit = await (await send(base, '/api/admin/place-records/audit', 'GET', undefined, admin)).json();
    assert.equal(audit.items[0].actorSub, sub);
    assert.equal(audit.items[0].action, 'update');
    assert.ok(audit.items[0].changes.name || audit.items[0].changes.address);
    assert.equal((await send(base, `/api/admin/place-records/da-nang/${place.id}`, 'DELETE', { version: 2 }, ordinary)).status, 403);
    const deletion = await send(base, `/api/admin/place-records/da-nang/${place.id}`, 'DELETE', { version: 2 }, admin);
    assert.equal(deletion.status, 200);
    place = (await deletion.json()).place;
    assert.ok(place.deletedAt);
    publicData = await (await send(base, publicRoute)).json();
    assert.equal(publicData.places.some(item => item.id === place.id), false);
    assert.equal((await send(base, uploaded.url)).status, 404);
    const deleted = await (await send(base, '/api/admin/place-records?status=deleted', 'GET', undefined, admin)).json();
    assert.equal(deleted.items.some(item => item.id === place.id), true);
    const restored = await send(base, `/api/admin/place-records/da-nang/${place.id}/restore`, 'POST', { version: place.version }, admin);
    assert.equal(restored.status, 200);
    place = (await restored.json()).place;
    assert.equal(place.deletedAt, null);
    assert.equal((await send(base, publicRoute)).status, 200);

    const sourceFile = path.join(process.cwd(), 'frontend', 'src', 'data', 'places', 'da-nang.json');
    const sourceBefore = fs.readFileSync(sourceFile, 'utf8');
    const sourcePlace = publicData.places.find(item => !item.id.startsWith('admin-') && item.coordinates);
    assert.ok(sourcePlace);
    const sourceEdit = await send(base, `/api/admin/place-records/da-nang/${sourcePlace.id}`, 'PUT', {
      cityId: 'da-nang', version: 0, name: `${sourcePlace.name} (đã kiểm tra)`,
      categoryGroup: sourcePlace.categoryGroup, categoryLabel: sourcePlace.categoryLabel,
      address: sourcePlace.address || '', coordinates: sourcePlace.coordinates,
      publicationStatus: 'published',
    }, admin);
    assert.equal(sourceEdit.status, 200, await sourceEdit.clone().text());
    assert.equal(fs.readFileSync(sourceFile, 'utf8'), sourceBefore);
    const sourceUpdated = (await sourceEdit.json()).place;
    assert.equal(sourceUpdated.id, sourcePlace.id);
    assert.equal(sourceUpdated.dataSource, sourcePlace.dataSource);
    assert.equal(sourceUpdated.priceOverride, false);
    assert.equal(sourceUpdated.hoursOverride, false);

    service.child.kill();
    await new Promise(resolve => service.child.once('exit', resolve));
    service = await start(dbPath);
    publicData = await (await send(service.base, publicRoute)).json();
    assert.equal(publicData.places.some(item => item.id === place.id), true);
    assert.equal(publicData.places.find(item => item.id === sourcePlace.id).name, sourceUpdated.name);
  } finally {
    if (service?.child.exitCode === null) {
      service.child.kill();
      await new Promise(resolve => service.child.once('exit', resolve));
    }
    for (const suffix of ['', '-wal', '-shm']) { const file = dbPath + suffix; if (fs.existsSync(file)) fs.rmSync(file); }
    const testDataRoot = path.resolve(process.cwd(), 'data') + path.sep;
    if (path.resolve(imageDir).startsWith(testDataRoot) && path.basename(imageDir).startsWith('test-upload-test-places-') && fs.existsSync(imageDir)) fs.rmSync(imageDir, { recursive: true, force: true });
  }
});
