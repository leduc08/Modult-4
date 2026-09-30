import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

export const CITY_NAMES: Record<string, string> = {
  'ha-noi': 'Hà Nội', 'da-nang': 'Đà Nẵng', 'hoi-an': 'Hội An', hue: 'Huế',
  'ninh-binh': 'Ninh Bình', 'da-lat': 'Đà Lạt', 'sa-pa': 'Sa Pa',
  'phu-quoc': 'Phú Quốc', 'nha-trang': 'Nha Trang', 'tp-hcm': 'TP. Hồ Chí Minh',
};

const categories = new Set(['food', 'cafe', 'sightseeing', 'culture', 'shopping', 'stay']);
const statuses = new Set(['unverified', 'active', 'temporarily_closed', 'permanently_closed']);
const priceUnits = new Set(['person', 'ticket', 'dish', 'group']);
const week = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const publicFields = ['id', 'name', 'coordinates', 'address', 'categoryGroup', 'categoryLabel', 'foursquareId', 'osmId', 'dataSource', 'rating', 'reviewCount', 'imageUrl', 'isPlaceholderImage', 'phone', 'website', 'openingHours', 'weeklyHours', 'description', 'needsReview', 'conflictNote', 'tags', 'price', 'estimatedDurationMinutes', 'operatingStatus', 'updatedAt'];
type Row = { city_id: string; place_id: string; payload: string; updated_at: string; version: number; deleted_at: string | null };
let db: DatabaseSync | null = null;

function database(): DatabaseSync {
  if (db) return db;
  const dbPath = process.env.VIETGO_DB_PATH || path.join(process.cwd(), 'data', 'vietgo.sqlite');
  if (dbPath !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(dbPath)), { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec(`CREATE TABLE IF NOT EXISTS place_overrides (
    city_id TEXT NOT NULL, place_id TEXT NOT NULL, payload TEXT NOT NULL,
    updated_at TEXT NOT NULL, PRIMARY KEY (city_id, place_id)
  )`);
  const columns = db.prepare('PRAGMA table_info(place_overrides)').all() as Array<{ name: string }>;
  if (!columns.some(column => column.name === 'version')) db.exec('ALTER TABLE place_overrides ADD COLUMN version INTEGER NOT NULL DEFAULT 1');
  if (!columns.some(column => column.name === 'deleted_at')) db.exec('ALTER TABLE place_overrides ADD COLUMN deleted_at TEXT');
  db.exec(`CREATE TABLE IF NOT EXISTS place_audit (
    id INTEGER PRIMARY KEY AUTOINCREMENT, actor_sub TEXT NOT NULL, at TEXT NOT NULL,
    action TEXT NOT NULL, city_id TEXT NOT NULL, place_id TEXT NOT NULL, changes TEXT NOT NULL
  )`);
  db.exec(`CREATE TABLE IF NOT EXISTS place_images (
    id TEXT PRIMARY KEY, filename TEXT NOT NULL, mime TEXT NOT NULL, bytes INTEGER NOT NULL,
    actor_sub TEXT NOT NULL, created_at TEXT NOT NULL
  )`);
  return db;
}

const baseFile = (cityId: string) => Object.hasOwn(CITY_NAMES, cityId)
  ? path.join(process.cwd(), 'frontend', 'src', 'data', 'places', `${cityId}.json`) : null;
function baseData(cityId: string): any | null {
  const file = baseFile(cityId);
  return file && fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}
const rowsFor = (cityId: string) => database().prepare('SELECT * FROM place_overrides WHERE city_id = ?').all(cityId) as Row[];
const rowFor = (cityId: string, id: string) => database().prepare('SELECT * FROM place_overrides WHERE city_id = ? AND place_id = ?').get(cityId, id) as Row | undefined;
const text = (value: unknown, max: number) => typeof value === 'string' ? value.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, max) : '';
const optional = (value: unknown, max: number) => text(value, max) || null;
const validTime = (value: string) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
const validDate = (value: unknown) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
function url(value: unknown, max = 1000): string | null {
  const raw = optional(value, max);
  if (!raw) return null;
  try {
    const parsed = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
    return ['http:', 'https:'].includes(parsed.protocol) && parsed.hostname && !parsed.username && !parsed.password ? parsed.href : null;
  } catch { return null; }
}
function defaultMeta(raw: boolean) {
  return { publicationStatus: raw ? 'published' : 'draft', operatingStatus: 'unverified',
    price: { status: 'unknown', minVnd: null, maxVnd: null, unit: null, note: null, source: null, checkedAt: null },
    weeklyHours: Object.fromEntries(week.map(day => [day, { status: 'unknown', open: null, close: null }])),
    estimatedDurationMinutes: null, imageSource: null, imageRightsNote: null, internalNotes: null, infoCheckedAt: null };
}
function materialize(raw: any | null, row: Row | undefined, cityId?: string): any {
  const payload = row ? JSON.parse(row.payload) : null;
  const patch = payload?.fields || payload || {};
  const legacy = Boolean(row && !payload?.fields);
  const base = raw || payload?.sourceSnapshot || { id: row?.place_id, dataSource: 'admin', rating: null, reviewCount: null, foursquareId: undefined, osmId: undefined, conflictNote: null };
  const record = { ...base, ...patch, id: base.id || row?.place_id, cityId: row?.city_id || patch.cityId || cityId,
    dataSource: raw?.dataSource || base.dataSource || 'admin', foursquareId: raw?.foursquareId || base.foursquareId, osmId: raw?.osmId || base.osmId,
    rating: raw?.rating ?? null, reviewCount: raw?.reviewCount ?? null,
    ...defaultMeta(Boolean(raw) || legacy), ...(patch.publicationStatus ? { publicationStatus: patch.publicationStatus } : {}),
    operatingStatus: patch.operatingStatus || 'unverified',
    price: { ...defaultMeta(Boolean(raw)).price, ...patch.price }, priceOverride: Object.hasOwn(patch, 'price'),
    weeklyHours: { ...defaultMeta(Boolean(raw)).weeklyHours, ...patch.weeklyHours }, hoursOverride: Object.hasOwn(patch, 'weeklyHours'),
    version: row?.version || 0, updatedAt: row?.updated_at || null, deletedAt: row?.deleted_at || null };
  return record;
}
function cityRecords(cityId: string): { data: any; records: any[] } | null {
  const data = baseData(cityId);
  if (!data) return null;
  const rows = new Map(rowsFor(cityId).map(row => [row.place_id, row]));
  const records = data.places.map((raw: any) => { const row = rows.get(raw.id); rows.delete(raw.id); return materialize(raw, row, cityId); });
  for (const row of rows.values()) records.push(materialize(null, row, cityId));
  return { data, records };
}
const validCoordinates = (point: any) => point && typeof point.lat === 'number' && typeof point.lng === 'number'
  && Number.isFinite(point.lat) && Number.isFinite(point.lng) && point.lat >= -90 && point.lat <= 90 && point.lng >= -180 && point.lng <= 180;
const publicPlace = (place: any) => Object.fromEntries(publicFields.map(field => [field,
  (field === 'price' && !place.priceOverride) || (field === 'weeklyHours' && !place.hoursOverride) ? null
    : field === 'price' && place.price ? {
      status: place.price.status, minVnd: place.price.minVnd, maxVnd: place.price.maxVnd,
      unit: place.price.unit, note: place.price.note, checkedAt: place.price.checkedAt,
    } : place[field] ?? null]));
const isPublic = (place: any) => !place.deletedAt && place.publicationStatus === 'published'
  && place.operatingStatus !== 'permanently_closed' && validCoordinates(place.coordinates);

export function getCityPlaces(cityId: string): any | null {
  const loaded = cityRecords(cityId);
  if (!loaded) return null;
  const { data, records } = loaded;
  data.places = records.filter(isPublic).map(publicPlace);
  data.fetchedAt = records.reduce((latest, record) => record.updatedAt && record.updatedAt > latest ? record.updatedAt : latest, data.fetchedAt);
  data.stats = { ...data.stats, total: data.places.length };
  return data;
}

export function listAdminPlaces(filters: Record<string, unknown>) {
  const city = text(filters.cityId, 40);
  const cityIds = city && Object.hasOwn(CITY_NAMES, city) ? [city] : Object.keys(CITY_NAMES);
  let items = cityIds.flatMap(id => cityRecords(id)?.records || []);
  const query = text(filters.query, 200).toLocaleLowerCase('vi');
  if (query) items = items.filter(place => `${place.name} ${place.address || ''}`.toLocaleLowerCase('vi').includes(query));
  if (filters.category && filters.category !== 'all') items = items.filter(place => place.categoryGroup === filters.category);
  if (filters.source && filters.source !== 'all') items = items.filter(place => place.dataSource === filters.source);
  if (filters.status === 'deleted') items = items.filter(place => Boolean(place.deletedAt));
  else if (filters.status && filters.status !== 'all') items = items.filter(place => !place.deletedAt && place.publicationStatus === filters.status);
  else items = items.filter(place => !place.deletedAt);
  const quality = String(filters.quality || '');
  if (quality === 'image') items = items.filter(place => !place.imageUrl || place.isPlaceholderImage);
  if (quality === 'price') items = items.filter(place => place.price?.status === 'unknown');
  if (quality === 'hours') items = items.filter(place => !place.openingHours && Object.values(place.weeklyHours || {}).every((day: any) => day.status === 'unknown'));
  if (quality === 'address') items = items.filter(place => !place.address);
  if (quality === 'coordinates') items = items.filter(place => !validCoordinates(place.coordinates) || place.needsReview);
  items.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '') || a.name.localeCompare(b.name, 'vi'));
  const pageSize = 25;
  const page = Math.max(1, Math.min(100000, Number(filters.page) || 1));
  return { items: items.slice((page - 1) * pageSize, page * pageSize), total: items.length, page, pageSize };
}
export function getAdminPlace(cityId: string, id: string): any | null {
  return cityRecords(cityId)?.records.find(place => place.id === id) || null;
}
const normalize = (value: string) => value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]/g, '');
export function findDuplicates(cityId: string, input: any, excludeId?: string) {
  const name = normalize(text(input.name, 160));
  const address = normalize(text(input.address, 300));
  const point = input.coordinates;
  return (cityRecords(cityId)?.records || []).filter(place => place.id !== excludeId && !place.deletedAt && (
    Boolean(name && normalize(place.name || '') === name)
    || Boolean(address && normalize(place.address || '') === address)
    || (validCoordinates(point) && validCoordinates(place.coordinates)
      && Math.hypot((point.lat - place.coordinates.lat) * 111000, (point.lng - place.coordinates.lng) * 105000) < 70)
  )).slice(0, 8).map(place => ({ id: place.id, name: place.name, address: place.address, cityId }));
}

export function validatePlaceInput(input: Record<string, unknown>, existing?: any): { value?: any; error?: string } {
  const name = text(input.name, 160);
  const cityId = text(input.cityId, 40);
  const categoryGroup = text(input.categoryGroup, 40);
  const address = text(input.address, 300);
  if (!name || !Object.hasOwn(CITY_NAMES, cityId) || !categories.has(categoryGroup)) return { error: 'Tên, khu vực và danh mục hợp lệ là bắt buộc.' };
  if (input.publicationStatus != null && !['draft', 'published'].includes(String(input.publicationStatus))) return { error: 'Trạng thái xuất bản không hợp lệ.' };
  const publicationStatus = input.publicationStatus === 'published' ? 'published' : 'draft';
  const latValue = (input.coordinates as any)?.lat;
  const lngValue = (input.coordinates as any)?.lng;
  const coordinates = latValue === '' || latValue == null || lngValue === '' || lngValue == null ? null : { lat: Number(latValue), lng: Number(lngValue) };
  if (coordinates && !validCoordinates(coordinates)) return { error: 'Vĩ độ phải từ -90 đến 90, kinh độ từ -180 đến 180.' };
  if (publicationStatus === 'published' && !coordinates) return { error: 'Địa điểm xuất bản cần tọa độ hợp lệ.' };
  const operatingStatus = text(input.operatingStatus, 40) || 'unverified';
  if (!statuses.has(operatingStatus)) return { error: 'Tình trạng hoạt động không hợp lệ.' };
  const priceInput = (input.price || {}) as any;
  if (priceInput.status != null && !['unknown', 'free', 'priced'].includes(priceInput.status)) return { error: 'Trạng thái giá không hợp lệ.' };
  const priceStatus = priceInput.status || 'unknown';
  const min = priceInput.minVnd === '' || priceInput.minVnd == null ? null : Number(priceInput.minVnd);
  const max = priceInput.maxVnd === '' || priceInput.maxVnd == null ? null : Number(priceInput.maxVnd);
  if (priceStatus === 'priced' && (min == null || !Number.isSafeInteger(min) || min < 0 || (max != null && (!Number.isSafeInteger(max) || max < min)) || !priceUnits.has(priceInput.unit))) return { error: 'Giá hoặc đơn vị giá không hợp lệ.' };
  const price = { status: priceStatus, minVnd: priceStatus === 'free' ? 0 : priceStatus === 'priced' ? min : null,
    maxVnd: priceStatus === 'free' ? 0 : priceStatus === 'priced' ? max : null,
    unit: priceStatus === 'priced' ? priceInput.unit : null,
    note: optional(priceInput.note, 500), source: optional(priceInput.source, 300), checkedAt: optional(priceInput.checkedAt, 10) };
  const weeklyInput = (input.weeklyHours || {}) as Record<string, any>;
  const weeklyHours: Record<string, any> = {};
  for (const day of week) {
    const entry = weeklyInput[day] || { status: 'unknown' };
    if (!['unknown', 'closed', 'open', 'all_day'].includes(entry.status)) return { error: 'Giờ mở cửa theo tuần không hợp lệ.' };
    if (entry.status === 'open' && (!validTime(entry.open) || !validTime(entry.close) || entry.open >= entry.close)) return { error: 'Giờ mở cửa phải có dạng HH:mm và giờ đóng sau giờ mở.' };
    weeklyHours[day] = { status: entry.status, open: entry.status === 'open' ? entry.open : null, close: entry.status === 'open' ? entry.close : null };
  }
  const timeValue = input.estimatedDurationMinutes;
  const estimatedDurationMinutes = timeValue === '' || timeValue == null ? null : Number(timeValue);
  if (estimatedDurationMinutes !== null && (!Number.isInteger(estimatedDurationMinutes) || estimatedDurationMinutes <= 0 || estimatedDurationMinutes > 1440)) return { error: 'Thời lượng dự kiến phải lớn hơn 0 và không quá 1440 phút.' };
  const imageInput = text(input.imageUrl, 1000);
  const imageUrl = imageInput.startsWith('/api/place-images/') && /^\/api\/place-images\/[a-f0-9-]{36}$/.test(imageInput)
    ? imageInput : /^\/images\/[a-zA-Z0-9._/-]+$/.test(imageInput) && !imageInput.includes('..')
    ? imageInput : imageInput ? url(imageInput) : null;
  if (imageInput && !imageUrl) return { error: 'URL ảnh không hợp lệ.' };
  if (imageUrl?.startsWith('/api/place-images/') && !getImage(imageUrl.split('/').at(-1)!, true)) return { error: 'Ảnh tải lên không tồn tại.' };
  const websiteInput = text(input.website, 1000);
  const website = websiteInput ? url(websiteInput) : null;
  if (websiteInput && !website) return { error: 'URL website không hợp lệ.' };
  for (const date of [priceInput.checkedAt, input.infoCheckedAt]) if (date && !validDate(date)) return { error: 'Ngày kiểm tra không hợp lệ.' };
  const summary = week.map(day => ({ day, ...weeklyHours[day] })).filter(item => item.status !== 'unknown');
  const hoursOverride = input.hoursOverride === true || existing?.hoursOverride === true
    || (input.hoursOverride !== false && Object.hasOwn(input, 'weeklyHours'));
  const priceOverride = input.priceOverride === true || existing?.priceOverride === true
    || (input.priceOverride !== false && Object.hasOwn(input, 'price'));
  const openingHours = hoursOverride
    ? summary.length ? summary.map(item => `${item.day}: ${item.status === 'closed' ? 'Đóng cửa' : item.status === 'all_day' ? '24 giờ' : `${item.open}–${item.close}`}`).join('; ') : null
    : existing?.openingHours || null;
  return { value: { cityId, name, address, categoryGroup, categoryLabel: text(input.categoryLabel, 100) || categoryGroup,
    coordinates, description: optional(input.description, 2000), phone: optional(input.phone, 50), website,
    imageUrl, isPlaceholderImage: !imageUrl, imageSource: optional(input.imageSource, 300), imageRightsNote: optional(input.imageRightsNote, 500),
    publicationStatus, operatingStatus, ...(priceOverride ? { price } : {}),
    ...(hoursOverride ? { weeklyHours, openingHours } : {}), estimatedDurationMinutes,
    internalNotes: optional(input.internalNotes, 2000), infoCheckedAt: optional(input.infoCheckedAt, 10),
    tags: Array.isArray(input.tags) ? input.tags.filter((tag): tag is string => typeof tag === 'string').slice(0, 20).map(tag => text(tag, 60)).filter(Boolean) : existing?.tags || [],
    needsReview: input.needsReview === true } };
}

function audit(actor: string, action: string, cityId: string, id: string, before: any, after: any) {
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  for (const key of new Set([...Object.keys(before || {}), ...Object.keys(after || {})])) {
    if (['updatedAt', 'version'].includes(key)) continue;
    if (JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key])) changes[key] = { before: before?.[key] ?? null, after: after?.[key] ?? null };
  }
  database().prepare('INSERT INTO place_audit (actor_sub, at, action, city_id, place_id, changes) VALUES (?, ?, ?, ?, ?, ?)')
    .run(actor, new Date().toISOString(), action, cityId, id, JSON.stringify(changes));
}
function transaction<T>(run: () => T): T {
  const connection = database();
  connection.exec('BEGIN IMMEDIATE');
  try { const result = run(); connection.exec('COMMIT'); return result; }
  catch (error) { connection.exec('ROLLBACK'); throw error; }
}
export function saveManagedPlace(input: Record<string, unknown>, actor: string, cityId?: string, id?: string, createId?: string): { place?: any; error?: string; status?: number; duplicates?: any[] } {
  const targetCity = cityId || text(input.cityId, 40);
  const loaded = cityRecords(targetCity);
  if (!loaded) return { error: 'Khu vực không tồn tại.', status: 404 };
  const existing = id ? loaded.records.find(place => place.id === id) : null;
  if (id && !existing) return { error: 'Không tìm thấy địa điểm.', status: 404 };
  if (existing?.deletedAt) return { error: 'Cần khôi phục địa điểm trước khi sửa.', status: 409 };
  const validated = validatePlaceInput({ ...input, cityId: targetCity }, existing);
  if (!validated.value) return { error: validated.error, status: 422 };
  if (id && Number(input.version) !== existing.version) return { error: 'Bản ghi đã được phiên khác thay đổi. Hãy tải lại trước khi lưu.', status: 409 };
  if (createId && (!/^admin-[a-f0-9-]{36}$/.test(createId) || loaded.records.some(place => place.id === createId)))
    return { error: 'ID địa điểm nhập không hợp lệ hoặc đã tồn tại.', status: 409 };
  const placeId = id || createId || `admin-${randomUUID()}`;
  const raw = loaded.data.places.find((place: any) => place.id === placeId);
  const now = new Date().toISOString();
  const fields = { ...validated.value };
  delete fields.cityId;
  const sourceSnapshot = raw ? { id: raw.id, dataSource: raw.dataSource, foursquareId: raw.foursquareId, osmId: raw.osmId,
    rating: raw.rating, reviewCount: raw.reviewCount, conflictNote: raw.conflictNote } : undefined;
  const payload = JSON.stringify({ fields, sourceSnapshot });
  return transaction(() => {
    const currentRow = rowFor(targetCity, placeId);
    if (currentRow) {
      const changed = database().prepare('UPDATE place_overrides SET payload = ?, updated_at = ?, version = version + 1 WHERE city_id = ? AND place_id = ? AND version = ?')
        .run(payload, now, targetCity, placeId, Number(input.version));
      if (!changed.changes) return { error: 'Bản ghi đã được phiên khác thay đổi.', status: 409 };
    } else {
      const inserted = database().prepare('INSERT OR IGNORE INTO place_overrides (city_id, place_id, payload, updated_at, version) VALUES (?, ?, ?, ?, 1)')
        .run(targetCity, placeId, payload, now);
      if (!inserted.changes) return { error: 'Bản ghi đã được phiên khác thay đổi.', status: 409 };
    }
    const place = materialize(raw, rowFor(targetCity, placeId));
    audit(actor, id ? 'update' : 'create', targetCity, placeId, existing, place);
    return { place, duplicates: findDuplicates(targetCity, place, placeId) };
  });
}
export function setDeleted(cityId: string, id: string, version: number, deleted: boolean, actor: string) {
  const before = getAdminPlace(cityId, id);
  if (!before) return { error: 'Không tìm thấy địa điểm.', status: 404 };
  if (before.version !== version) return { error: 'Bản ghi đã được phiên khác thay đổi.', status: 409 };
  const now = new Date().toISOString();
  const deletedAt = deleted ? now : null;
  return transaction(() => {
    const row = rowFor(cityId, id);
    if (row) {
      const changed = database().prepare('UPDATE place_overrides SET deleted_at = ?, updated_at = ?, version = version + 1 WHERE city_id = ? AND place_id = ? AND version = ?')
        .run(deletedAt, now, cityId, id, version);
      if (!changed.changes) return { error: 'Bản ghi đã được phiên khác thay đổi.', status: 409 };
    } else {
      const inserted = database().prepare('INSERT OR IGNORE INTO place_overrides (city_id, place_id, payload, updated_at, version, deleted_at) VALUES (?, ?, ?, ?, 1, ?)')
        .run(cityId, id, JSON.stringify({ fields: {} }), now, deletedAt);
      if (!inserted.changes) return { error: 'Bản ghi đã được phiên khác thay đổi.', status: 409 };
    }
    const place = getAdminPlace(cityId, id);
    audit(actor, deleted ? 'delete' : 'restore', cityId, id, before, place);
    return { place };
  });
}
export function listAudit(filters: Record<string, unknown>) {
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = 50;
  const rows = database().prepare('SELECT * FROM place_audit ORDER BY id DESC LIMIT ? OFFSET ?').all(limit, (page - 1) * limit) as any[];
  return { items: rows.map(row => ({ id: row.id, actorSub: row.actor_sub, at: row.at, action: row.action, cityId: row.city_id, placeId: row.place_id, changes: JSON.parse(row.changes) })), page, pageSize: limit };
}

const uploadDir = () => path.resolve(process.env.VIETGO_UPLOAD_DIR || path.join(process.cwd(), 'data', 'place-images'));
export function saveImage(bytes: Buffer, mime: string, actor: string, preserveId?: string) {
  const extension = mime === 'image/jpeg' ? '.jpg' : mime === 'image/png' ? '.png' : mime === 'image/webp' ? '.webp' : null;
  if (!extension || bytes.length === 0 || bytes.length > 5 * 1024 * 1024) return { error: 'Chỉ nhận JPEG, PNG hoặc WebP, tối đa 5 MB.' };
  const valid = mime === 'image/jpeg' ? bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))
    : mime === 'image/png' ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!valid) return { error: 'Nội dung ảnh không khớp loại file.' };
  if (preserveId && !/^[a-f0-9-]{36}$/.test(preserveId)) return { error: 'ID ảnh không hợp lệ.' };
  const id = preserveId || randomUUID();
  if (preserveId) {
    const existing = getImage(id, true);
    if (existing) return existing.mime === mime && existing.bytes.equals(bytes)
      ? { id, url: `/api/place-images/${id}` } : { error: 'ID ảnh đã tồn tại với nội dung khác.' };
    if (database().prepare('SELECT id FROM place_images WHERE id = ?').get(id)) return { error: 'Bản ghi ảnh đã tồn tại nhưng thiếu file.' };
  }
  fs.mkdirSync(uploadDir(), { recursive: true });
  const filename = id + extension;
  fs.writeFileSync(path.join(uploadDir(), filename), bytes, { flag: 'wx' });
  database().prepare('INSERT INTO place_images (id, filename, mime, bytes, actor_sub, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, filename, mime, bytes.length, actor, new Date().toISOString());
  return { id, url: `/api/place-images/${id}` };
}
export function getImage(id: string, admin = false): { bytes: Buffer; mime: string } | null {
  if (!/^[a-f0-9-]{36}$/.test(id)) return null;
  const row = database().prepare('SELECT filename, mime FROM place_images WHERE id = ?').get(id) as { filename: string; mime: string } | undefined;
  if (!row) return null;
  if (!admin) {
    const referenced = Object.keys(CITY_NAMES).some(cityId => getCityPlaces(cityId)?.places.some((place: any) => place.imageUrl === `/api/place-images/${id}`));
    if (!referenced) return null;
  }
  const file = path.join(uploadDir(), row.filename);
  return fs.existsSync(file) ? { bytes: fs.readFileSync(file), mime: row.mime } : null;
}

// Compatibility for the earlier protected endpoints. New forms use saveManagedPlace directly.
export function savePlace(cityId: string, input: Record<string, unknown>, placeId?: string, actor = 'legacy-admin') {
  return saveManagedPlace({ ...input, cityId, publicationStatus: 'published' }, actor, cityId, placeId);
}
