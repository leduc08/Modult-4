import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { CITY_NAMES, findDuplicates, getAdminPlace, getImage, saveImage, saveManagedPlace, validatePlaceInput } from '../backend/placeStore.ts';

const fields = [
  'name', 'address', 'categoryGroup', 'categoryLabel', 'coordinates', 'description', 'phone',
  'website', 'imageUrl', 'imageSource', 'imageRightsNote', 'publicationStatus',
  'operatingStatus', 'price', 'priceOverride', 'weeklyHours', 'hoursOverride',
  'estimatedDurationMinutes', 'internalNotes', 'infoCheckedAt', 'tags', 'needsReview',
] as const;
type Field = typeof fields[number];
type Values = Partial<Record<Field, unknown>>;
type Change = { kind: 'create'; cityId: string; placeId: string; after: Values } |
  { kind: 'update'; cityId: string; placeId: string; before: Values; after: Values };
type Picture = { id: string; file: string; mime: string; sha256: string };
type Bundle = { format: 'vietgo-place-contribution-v1'; changes: Change[]; images: Picture[] };
const imageUrl = /^\/api\/place-images\/([a-f0-9-]{36})$/;
const placeIdPattern = /^(?:admin-[a-f0-9-]{36}|[a-zA-Z0-9][a-zA-Z0-9._:-]{0,160})$/;
const hash = (bytes: Buffer) => createHash('sha256').update(bytes).digest('hex');
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
const pick = (record: Record<string, unknown>): Values =>
  Object.fromEntries(fields.map(field => [field, record[field] ?? null])) as Values;
const fail = (message: string): never => { throw new Error(message); };
const dbPath = process.env.VIETGO_DB_PATH || path.join(process.cwd(), 'data', 'vietgo.sqlite');

function exportBundle(cityId: string, placeId: string, outDir: string, afterAuditId = 0) {
  if (!Object.hasOwn(CITY_NAMES, cityId) || !placeIdPattern.test(placeId)) fail('Khu vực hoặc ID địa điểm không hợp lệ.');
  if (!Number.isSafeInteger(afterAuditId) || afterAuditId < 0) fail('Mốc audit không hợp lệ.');
  if (!fs.existsSync(dbPath)) fail('Chưa có SQLite địa điểm trên máy này.');
  if (fs.existsSync(outDir)) fail('Thư mục đích đã tồn tại; hãy chọn tên gói mới.');
  const db = new DatabaseSync(dbPath, { readOnly: true });
  let audits: Array<{ id: number; action: string; changes: string }>;
  try {
    audits = db.prepare('SELECT id, action, changes FROM place_audit WHERE city_id = ? AND place_id = ? AND id > ? ORDER BY id')
      .all(cityId, placeId, afterAuditId) as typeof audits;
  } finally { db.close(); }
  if (!audits.length) fail('Địa điểm này không có thay đổi admin sau mốc audit đã chọn.');
  const record = getAdminPlace(cityId, placeId);
  if (!record || record.deletedAt) fail('Chỉ hỗ trợ xuất địa điểm đang tồn tại; gói xóa chưa được hỗ trợ.');
  const current = pick(record);
  const createdHere = audits[0].action === 'create' && afterAuditId === 0 && placeId.startsWith('admin-');
  let change: Change;
  if (createdHere) {
    change = { kind: 'create', cityId, placeId, after: current };
  } else {
    const before: Values = {};
    for (const audit of audits) {
      const changes = JSON.parse(audit.changes) as Record<string, { before: unknown }>;
      for (const field of fields) if (Object.hasOwn(changes, field) && !Object.hasOwn(before, field))
        before[field] = changes[field].before ?? null;
    }
    const after: Values = {};
    for (const field of fields) if (Object.hasOwn(before, field) && !same(before[field], current[field]))
      after[field] = current[field];
    for (const field of fields) if (!Object.hasOwn(after, field)) delete before[field];
    if (!Object.keys(after).length) fail('Không có thay đổi trường dữ liệu cần xuất.');
    change = { kind: 'update', cityId, placeId, before, after };
  }
  const pictures: Array<{ picture: Picture; bytes: Buffer }> = [];
  const imageMatch = String(change.after.imageUrl || '').match(imageUrl);
  if (imageMatch) {
    const id = imageMatch[1];
    const image = getImage(id, true);
    if (!image) fail('Ảnh tải lên của địa điểm không còn trên máy này.');
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[image.mime];
    if (!extension) fail('Loại ảnh không được hỗ trợ.');
    const file = `images/${id}.${extension}`;
    pictures.push({ picture: { id, file, mime: image.mime, sha256: hash(image.bytes) }, bytes: image.bytes });
  }
  fs.mkdirSync(outDir, { recursive: true });
  for (const { picture, bytes } of pictures) {
    fs.mkdirSync(path.join(outDir, 'images'), { recursive: true });
    fs.writeFileSync(path.join(outDir, picture.file), bytes, { flag: 'wx' });
  }
  const bundle: Bundle = { format: 'vietgo-place-contribution-v1', changes: [change], images: pictures.map(item => item.picture) };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(bundle, null, 2) + '\n', { flag: 'wx' });
  console.log(`Đã tạo ${outDir}; audit cuối: ${audits.at(-1)!.id}. Kiểm tra gói trước khi mở PR.`);
}

function importBundle(dir: string, apply: boolean) {
  const manifestPath = path.join(dir, 'manifest.json');
  if (fs.statSync(manifestPath).size > 1024 * 1024) fail('Manifest quá lớn.');
  const bundle = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Bundle;
  if (bundle.format !== 'vietgo-place-contribution-v1' || !Array.isArray(bundle.changes) ||
    bundle.changes.length !== 1 || !Array.isArray(bundle.images) || bundle.images.length > 1)
    fail('Định dạng gói không hợp lệ.');
  const change = bundle.changes[0];
  if (!Object.hasOwn(CITY_NAMES, change.cityId) || !placeIdPattern.test(change.placeId) ||
    !['create', 'update'].includes(change.kind) || !change.after || typeof change.after !== 'object')
    fail('Địa điểm hoặc loại thay đổi không hợp lệ.');
  for (const values of [change.after, change.kind === 'update' ? change.before : {}]) {
    if (!values || typeof values !== 'object' || Array.isArray(values) ||
      Object.keys(values).some(key => !fields.includes(key as Field))) fail('Trường dữ liệu không hợp lệ.');
  }
  if (change.kind === 'update' &&
    (Object.keys(change.after).length === 0 || !same(Object.keys(change.before).sort(), Object.keys(change.after).sort())))
    fail('Gói sửa phải có cùng tập trường trước và sau.');
  if (change.kind === 'create' && !change.placeId.startsWith('admin-')) fail('Địa điểm mới phải có ID admin.');
  const localImages = bundle.images.map(picture => {
    const expectedFile = `images/${picture.id}.${{ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[picture.mime]}`;
    if (!/^[a-f0-9-]{36}$/.test(picture.id) || picture.file !== expectedFile ||
      !/^[a-f0-9]{64}$/.test(picture.sha256)) fail('Thông tin ảnh không hợp lệ.');
    const bytes = fs.readFileSync(path.join(dir, 'images', path.basename(picture.file)));
    if (hash(bytes) !== picture.sha256) fail('Ảnh không khớp SHA-256 trong manifest.');
    return { picture, bytes };
  });
  const referencedImage = String(change.after.imageUrl || '').match(imageUrl)?.[1];
  if (referencedImage && !getImage(referencedImage, true) &&
    !localImages.some(item => item.picture.id === referencedImage))
    fail('Thiếu ảnh được địa điểm tham chiếu.');
  for (const { picture } of localImages) {
    const existing = getImage(picture.id, true);
    if (existing && (existing.mime !== picture.mime || hash(existing.bytes) !== picture.sha256))
      fail('ID ảnh đã tồn tại với nội dung khác.');
  }
  const current = getAdminPlace(change.cityId, change.placeId);
  if (change.kind === 'create') {
    if (current) {
      if (fields.every(field => same(current[field], change.after[field]))) {
        console.log('Đã có cùng địa điểm; bỏ qua.');
        return;
      }
      fail('ID địa điểm mới đã tồn tại với nội dung khác.');
    }
    const duplicates = findDuplicates(change.cityId, change.after);
    if (duplicates.length) fail(`Cần duyệt địa điểm có thể trùng: ${duplicates.map(item => item.id).join(', ')}`);
  } else {
    if (!current || current.deletedAt) fail('Địa điểm cần sửa không tồn tại hoặc đã xóa.');
    for (const field of Object.keys(change.after) as Field[]) {
      if (!same(current[field], change.before[field]) && !same(current[field], change.after[field]))
        fail(`Xung đột trường ${field} tại ${change.cityId}/${change.placeId}.`);
    }
    if (Object.keys(change.after).every(field => same(current[field], change.after[field as Field]))) {
      console.log('Thay đổi đã có trên máy này; bỏ qua.');
      return;
    }
  }
  const input = change.kind === 'create' ? { ...change.after, cityId: change.cityId }
    : { ...pick(current!), ...change.after, cityId: change.cityId, version: current!.version };
  const imageField = String(input.imageUrl || '').match(imageUrl)?.[1];
  const validationInput = imageField && !getImage(imageField, true) ? { ...input, imageUrl: null } : input;
  const validation = validatePlaceInput(validationInput, change.kind === 'update' ? current : undefined);
  if (validation.error) fail(validation.error);
  console.log(`${apply ? 'Nhập' : 'Kiểm tra đạt'}: ${change.kind} ${change.cityId}/${change.placeId}`);
  if (!apply) return;
  for (const { picture, bytes } of localImages) {
    const result = saveImage(bytes, picture.mime, 'git-pr-import', picture.id);
    if (result.error) fail(result.error);
  }
  const result = change.kind === 'create'
    ? saveManagedPlace(input, 'git-pr-import', change.cityId, undefined, change.placeId)
    : saveManagedPlace(input, 'git-pr-import', change.cityId, change.placeId);
  if (result.error) fail(result.error);
  console.log('Đã nhập thành công.');
}

try {
  const [command, ...args] = process.argv.slice(2);
  if (command === 'export' && args.length >= 3 && args.length <= 4)
    exportBundle(args[0], args[1], args[2], args[3] ? Number(args[3]) : 0);
  else if (command === 'import' && args.length >= 1 && args.length <= 2 && (args.length === 1 || args[1] === '--apply'))
    importBundle(args[0], args[1] === '--apply');
  else fail('Dùng: places:export -- <cityId> <placeId> <outDir> [afterAuditId] | places:import -- <bundleDir> [--apply]');
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
