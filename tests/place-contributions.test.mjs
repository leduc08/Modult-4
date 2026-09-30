import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();
const scratchRoot = path.resolve(root, 'data');
const command = (env, args) => {
  const result = spawnSync(process.execPath, ['--import', 'tsx', ...args], {
    cwd: root, env: { ...process.env, ...env }, encoding: 'utf8',
  });
  return { code: result.status, output: result.stdout + result.stderr };
};
const run = (env, code) => command(env, ['--input-type=module', '-e', code]);
const cli = (env, ...args) => command(env, ['scripts/place-contributions.ts', ...args]);

test('PR bundles preserve IDs, merge separate fields, and reject conflicting edits', () => {
  const scratch = fs.mkdtempSync(path.join(scratchRoot, 'test-contrib-'));
  const local = { VIETGO_DB_PATH: path.join(scratch, 'local.sqlite'), VIETGO_UPLOAD_DIR: path.join(scratch, 'local-images') };
  const host = { VIETGO_DB_PATH: path.join(scratch, 'host.sqlite'), VIETGO_UPLOAD_DIR: path.join(scratch, 'host-images') };
  try {
    const created = run(local, `const {saveManagedPlace,saveImage}=await import('./backend/placeStore.ts');
      const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+XcZkAAAAASUVORK5CYII=','base64');
      const image=saveImage(png,'image/png','local-admin'); if(image.error) throw Error(image.error);
      const r=saveManagedPlace({cityId:'da-nang',name:'Test PR place',categoryGroup:'culture',
        address:'First address',publicationStatus:'draft',imageUrl:image.url},'local-admin');
      if(r.error) throw Error(r.error); console.log(r.place.id);`);
    assert.equal(created.code, 0, created.output);
    const id = created.output.trim().split(/\s+/).at(-1);
    assert.match(id, /^admin-/);
    const first = path.join(scratch, 'first');
    assert.equal(cli(local, 'export', 'da-nang', id, first).code, 0);
    assert.equal(cli(host, 'import', first).code, 0);
    assert.equal(cli(host, 'import', first, '--apply').code, 0);
    assert.match(cli(host, 'import', first, '--apply').output, /bỏ qua/);
    const imported = run(host, `const {getAdminPlace}=await import('./backend/placeStore.ts');
      console.log(JSON.stringify(getAdminPlace('da-nang','${id}')));`);
    assert.equal(imported.code, 0, imported.output);
    assert.equal(JSON.parse(imported.output.trim()).address, 'First address');
    assert.equal(fs.readdirSync(host.VIETGO_UPLOAD_DIR).length, 1);

    const changeLocal = run(local, `const {getAdminPlace,saveManagedPlace}=await import('./backend/placeStore.ts');
      const p=getAdminPlace('da-nang','${id}'); const r=saveManagedPlace({...p,description:'From contributor',
        version:p.version},'local-admin','da-nang','${id}'); if(r.error) throw Error(r.error);`);
    assert.equal(changeLocal.code, 0, changeLocal.output);
    const second = path.join(scratch, 'second');
    assert.equal(cli(local, 'export', 'da-nang', id, second, '1').code, 0);
    const changeHost = run(host, `const {getAdminPlace,saveManagedPlace}=await import('./backend/placeStore.ts');
      const p=getAdminPlace('da-nang','${id}'); const r=saveManagedPlace({...p,address:'Host address',
        version:p.version},'host-admin','da-nang','${id}'); if(r.error) throw Error(r.error);`);
    assert.equal(changeHost.code, 0, changeHost.output);
    assert.equal(cli(host, 'import', second, '--apply').code, 0);
    const merged = run(host, `const {getAdminPlace}=await import('./backend/placeStore.ts');
      console.log(JSON.stringify(getAdminPlace('da-nang','${id}')));`);
    const place = JSON.parse(merged.output.trim());
    assert.equal(place.address, 'Host address');
    assert.equal(place.description, 'From contributor');

    const conflicting = run(local, `const {getAdminPlace,saveManagedPlace}=await import('./backend/placeStore.ts');
      const p=getAdminPlace('da-nang','${id}'); const r=saveManagedPlace({...p,address:'Contributor address',
        version:p.version},'local-admin','da-nang','${id}'); if(r.error) throw Error(r.error);`);
    assert.equal(conflicting.code, 0, conflicting.output);
    const third = path.join(scratch, 'third');
    assert.equal(cli(local, 'export', 'da-nang', id, third, '2').code, 0);
    const rejected = cli(host, 'import', third, '--apply');
    assert.equal(rejected.code, 1);
    assert.match(rejected.output, /Xung đột trường address/);
  } finally {
    const resolved = path.resolve(scratch);
    if (resolved.startsWith(scratchRoot + path.sep)) fs.rmSync(resolved, { recursive: true, force: true });
  }
});

test('edits to a source catalog place import as updates', () => {
  const scratch = fs.mkdtempSync(path.join(scratchRoot, 'test-contrib-'));
  const local = { VIETGO_DB_PATH: path.join(scratch, 'local.sqlite') };
  const host = { VIETGO_DB_PATH: path.join(scratch, 'host.sqlite') };
  const id = JSON.parse(fs.readFileSync(path.join(root, 'frontend/src/data/places/da-nang.json'), 'utf8')).places[0].id;
  try {
    const edited = run(local, `const {getAdminPlace,saveManagedPlace}=await import('./backend/placeStore.ts');
      const p=getAdminPlace('da-nang','${id}'); const r=saveManagedPlace({...p,description:'PR verified description',
        version:p.version},'local-admin','da-nang','${id}'); if(r.error) throw Error(r.error);`);
    assert.equal(edited.code, 0, edited.output);
    const bundle = path.join(scratch, 'source-edit');
    assert.equal(cli(local, 'export', 'da-nang', id, bundle).code, 0);
    assert.equal(JSON.parse(fs.readFileSync(path.join(bundle, 'manifest.json'), 'utf8')).changes[0].kind, 'update');
    assert.equal(cli(host, 'import', bundle, '--apply').code, 0);
    const imported = run(host, `const {getAdminPlace}=await import('./backend/placeStore.ts');
      console.log(JSON.stringify(getAdminPlace('da-nang','${id}')));`);
    assert.equal(JSON.parse(imported.output.trim()).description, 'PR verified description');
  } finally {
    const resolved = path.resolve(scratch);
    if (resolved.startsWith(scratchRoot + path.sep)) fs.rmSync(resolved, { recursive: true, force: true });
  }
});
