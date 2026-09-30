import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { GoogleSignInButton } from './GoogleSignInButton';

const CITIES = [
  ['ha-noi', 'Hà Nội'], ['da-nang', 'Đà Nẵng'], ['hoi-an', 'Hội An'], ['hue', 'Huế'],
  ['ninh-binh', 'Ninh Bình'], ['da-lat', 'Đà Lạt'], ['sa-pa', 'Sa Pa'],
  ['phu-quoc', 'Phú Quốc'], ['nha-trang', 'Nha Trang'], ['tp-hcm', 'TP. Hồ Chí Minh'],
];
const CATEGORIES = [
  ['sightseeing', 'Tham quan'], ['culture', 'Văn hóa'], ['food', 'Ăn uống'],
  ['cafe', 'Cà phê'], ['shopping', 'Mua sắm'], ['stay', 'Lưu trú'],
];
const DAYS = [ ['mon', 'Thứ 2'], ['tue', 'Thứ 3'], ['wed', 'Thứ 4'], ['thu', 'Thứ 5'], ['fri', 'Thứ 6'], ['sat', 'Thứ 7'], ['sun', 'Chủ nhật'] ];
type Hours = { status: 'unknown' | 'closed' | 'open' | 'all_day'; open: string; close: string };
type Draft = {
  cityId: string; name: string; address: string; categoryGroup: string; categoryLabel: string;
  lat: string; lng: string; description: string; phone: string; website: string; tags: string;
  imageUrl: string; imageSource: string; imageRightsNote: string;
  publicationStatus: 'draft' | 'published'; operatingStatus: string; needsReview: boolean;
  priceStatus: 'unknown' | 'free' | 'priced'; priceMin: string; priceMax: string; priceUnit: string;
  priceNote: string; priceSource: string; priceCheckedAt: string; priceOverride: boolean;
  weeklyHours: Record<string, Hours>; hoursOverride: boolean;
  estimatedDurationMinutes: string; internalNotes: string; infoCheckedAt: string;
};
type AdminPlace = Record<string, any> & { id: string; cityId: string; name: string; version: number; deletedAt: string | null };
type Page = { items: AdminPlace[]; total: number; page: number; pageSize: number };
type Session = { authenticated: boolean; isAdmin: boolean; configured: boolean };
const weeklyBlank = () => Object.fromEntries(DAYS.map(([id]) => [id, { status: 'unknown', open: '', close: '' }])) as Record<string, Hours>;
const emptyDraft = (cityId: string): Draft => ({ cityId, name: '', address: '', categoryGroup: 'sightseeing', categoryLabel: 'Tham quan',
  lat: '', lng: '', description: '', phone: '', website: '', tags: '', imageUrl: '', imageSource: '', imageRightsNote: '',
  publicationStatus: 'draft', operatingStatus: 'unverified', needsReview: false,
  priceStatus: 'unknown', priceMin: '', priceMax: '', priceUnit: 'ticket', priceNote: '', priceSource: '', priceCheckedAt: '', priceOverride: false,
  weeklyHours: weeklyBlank(), hoursOverride: false, estimatedDurationMinutes: '', internalNotes: '', infoCheckedAt: '' });
const fromPlace = (place: AdminPlace): Draft => ({
  cityId: place.cityId, name: place.name || '', address: place.address || '', categoryGroup: place.categoryGroup,
  categoryLabel: place.categoryLabel || '', lat: place.coordinates?.lat == null ? '' : String(place.coordinates.lat),
  lng: place.coordinates?.lng == null ? '' : String(place.coordinates.lng), description: place.description || '',
  phone: place.phone || '', website: place.website || '', tags: (place.tags || []).join(', '),
  imageUrl: place.imageUrl || '', imageSource: place.imageSource || '', imageRightsNote: place.imageRightsNote || '',
  publicationStatus: place.publicationStatus, operatingStatus: place.operatingStatus || 'unverified', needsReview: place.needsReview === true,
  priceStatus: place.price?.status || 'unknown', priceMin: place.price?.minVnd == null ? '' : String(place.price.minVnd),
  priceMax: place.price?.maxVnd == null ? '' : String(place.price.maxVnd), priceUnit: place.price?.unit || 'ticket',
  priceNote: place.price?.note || '', priceSource: place.price?.source || '', priceCheckedAt: place.price?.checkedAt || '', priceOverride: place.priceOverride === true,
  weeklyHours: Object.fromEntries(DAYS.map(([id]) => [id, { status: place.weeklyHours?.[id]?.status || 'unknown', open: place.weeklyHours?.[id]?.open || '', close: place.weeklyHours?.[id]?.close || '' }])) as Record<string, Hours>,
  hoursOverride: place.hoursOverride === true,
  estimatedDurationMinutes: place.estimatedDurationMinutes == null ? '' : String(place.estimatedDurationMinutes),
  internalNotes: place.internalNotes || '', infoCheckedAt: place.infoCheckedAt || '',
});
const imagePreview = (url: string) => url.startsWith('/api/place-images/') ? url.replace('/api/place-images/', '/api/admin/place-images/')
  : url.startsWith('/') || /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
const issueLabels = (place: AdminPlace) => [
  (!place.imageUrl || place.isPlaceholderImage) && 'Thiếu ảnh', place.price?.status === 'unknown' && 'Thiếu giá',
  !place.openingHours && 'Thiếu giờ', !place.address && 'Thiếu địa chỉ',
  (!place.coordinates || place.needsReview) && 'Kiểm tra tọa độ',
].filter(Boolean) as string[];

function LocationPicker({ lat, lng, onPick }: { lat: string; lng: string; onPick: (lat: number, lng: number) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const marker = useRef<L.Marker | null>(null);
  const onPickRef = useRef(onPick); onPickRef.current = onPick;
  useEffect(() => {
    if (!host.current) return;
    const instance = L.map(host.current).setView([Number(lat) || 16.0544, Number(lng) || 108.2022], 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(instance);
    instance.on('click', event => onPickRef.current(Number(event.latlng.lat.toFixed(6)), Number(event.latlng.lng.toFixed(6))));
    map.current = instance; window.setTimeout(() => instance.invalidateSize(), 0);
    return () => { instance.remove(); map.current = null; marker.current = null; };
  }, []);
  useEffect(() => {
    const latitude = Number(lat), longitude = Number(lng);
    if (!map.current || !lat || !lng || !Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return;
    if (!marker.current) {
      marker.current = L.marker([latitude, longitude], { draggable: true,
        icon: L.divIcon({ className: '', iconSize: [24, 24], iconAnchor: [12, 12], html: '<span style="display:block;width:24px;height:24px;border:3px solid white;border-radius:50%;background:#ff385c;box-shadow:0 2px 8px #0008"></span>' }) }).addTo(map.current);
      marker.current.on('dragend', () => { const point = marker.current!.getLatLng(); onPickRef.current(Number(point.lat.toFixed(6)), Number(point.lng.toFixed(6))); });
    } else marker.current.setLatLng([latitude, longitude]);
    map.current.panTo([latitude, longitude]);
  }, [lat, lng]);
  return <div ref={host} className="h-64 w-full rounded-2xl" aria-label="Chọn vị trí trên bản đồ; có thể kéo marker" />;
}

export function AdminPlacesPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [filters, setFilters] = useState({ query: '', cityId: 'all', category: 'all', source: 'all', status: 'all', quality: 'all', page: 1 });
  const [list, setList] = useState<Page>({ items: [], total: 0, page: 1, pageSize: 25 });
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [selected, setSelected] = useState<AdminPlace | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft('da-nang'));
  const [initial, setInitial] = useState(JSON.stringify(emptyDraft('da-nang')));
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [duplicates, setDuplicates] = useState<Array<{ id: string; name: string; address: string }>>([]);
  const [auditOpen, setAuditOpen] = useState(false);
  const [audit, setAudit] = useState<any[]>([]);
  const dirty = editing && JSON.stringify(draft) !== initial;
  const field = (key: keyof Draft, value: Draft[keyof Draft]) => setDraft(current => ({ ...current, [key]: value,
    ...(String(key).startsWith('price') && key !== 'priceOverride' ? { priceOverride: true } : {}) }));
  const filter = (key: keyof typeof filters, value: string | number) => setFilters(current => ({ ...current, [key]: value, page: key === 'page' ? Number(value) : 1 }));

  useEffect(() => {
    fetch('/api/admin/session', { cache: 'no-store' }).then(response => response.json()).then((value: Session) => {
      setSession(value);
      if (!value.authenticated && window.location.pathname !== '/admin/places/login') window.history.replaceState(null, '', '/admin/places/login');
      if (value.isAdmin && window.location.pathname !== '/admin/places') window.history.replaceState(null, '', '/admin/places');
    }).catch(() => setSession({ authenticated: false, isAdmin: false, configured: false }));
  }, []);
  useEffect(() => {
    if (!session?.isAdmin) return;
    const controller = new AbortController();
    setListLoading(true); setListError('');
    fetch(`/api/admin/place-records?${new URLSearchParams(Object.entries(filters).map(([key, value]) => [key, String(value)]))}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('Không tải được danh sách quản trị.'); return response.json(); })
      .then(setList).catch(error => { if (error.name !== 'AbortError') setListError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setListLoading(false); });
    return () => controller.abort();
  }, [session?.isAdmin, filters, refresh]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => {
    if (!session?.isAdmin || !editing || !draft.name.trim()) { setDuplicates([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams({ cityId: draft.cityId, name: draft.name, address: draft.address,
        lat: draft.lat, lng: draft.lng, excludeId: selected?.id || '' });
      fetch(`/api/admin/place-records/duplicates?${params}`, { signal: controller.signal, cache: 'no-store' })
        .then(response => response.json()).then(result => setDuplicates(result.items || [])).catch(() => {});
    }, 400);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [session?.isAdmin, editing, draft.cityId, draft.name, draft.address, draft.lat, draft.lng, selected?.id]);
  const confirmLeave = () => !dirty || window.confirm('Bạn có thay đổi chưa lưu. Rời biểu mẫu và bỏ các thay đổi này?');
  const beginNew = () => { if (!confirmLeave()) return; const next = emptyDraft(filters.cityId === 'all' ? 'da-nang' : filters.cityId); setSelected(null); setDraft(next); setInitial(JSON.stringify(next)); setAuditOpen(false); setEditing(true); setMessage(''); };
  const open = async (item: AdminPlace) => {
    if (!confirmLeave()) return;
    setMessage('');
    try {
      const response = await fetch(`/api/admin/place-records/${item.cityId}/${encodeURIComponent(item.id)}`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Không tải được địa điểm.');
      const place = await response.json() as AdminPlace;
      const next = fromPlace(place); setSelected(place); setDraft(next); setInitial(JSON.stringify(next)); setEditing(true);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Không tải được địa điểm.'); }
  };
  const validate = () => {
    if (!draft.name.trim() || !draft.cityId || !draft.categoryGroup) return 'Tên, khu vực và danh mục là bắt buộc.';
    if (draft.lat || draft.lng) {
      const lat = Number(draft.lat), lng = Number(draft.lng);
      if (!draft.lat || !draft.lng || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return 'Tọa độ không hợp lệ.';
    } else if (draft.publicationStatus === 'published') return 'Địa điểm xuất bản cần tọa độ hợp lệ.';
    if (draft.priceStatus === 'priced' && (!draft.priceMin || Number(draft.priceMin) < 0 || (draft.priceMax && Number(draft.priceMax) < Number(draft.priceMin)))) return 'Khoảng giá không hợp lệ.';
    if (draft.estimatedDurationMinutes && Number(draft.estimatedDurationMinutes) <= 0) return 'Thời lượng phải lớn hơn 0.';
    for (const day of Object.values(draft.weeklyHours) as Hours[]) if (day.status === 'open' && (!day.open || !day.close || day.open >= day.close)) return 'Giờ đóng cửa phải sau giờ mở cửa.';
    for (const value of [draft.website, draft.imageUrl]) if (value && !value.startsWith('/api/place-images/') && !value.startsWith('/images/')) {
      try { if (!['http:', 'https:'].includes(new URL(/^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`).protocol)) return 'URL phải dùng HTTP(S).'; } catch { return 'URL không hợp lệ.'; }
    }
    return '';
  };
  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    const error = validate(); if (error) { setMessage(error); return; }
    setSaving(true); setMessage('');
    const body = { cityId: draft.cityId, version: selected?.version ?? 0, name: draft.name, address: draft.address,
      categoryGroup: draft.categoryGroup, categoryLabel: draft.categoryLabel,
      coordinates: draft.lat && draft.lng ? { lat: Number(draft.lat), lng: Number(draft.lng) } : null,
      description: draft.description, phone: draft.phone, website: draft.website, tags: draft.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      imageUrl: draft.imageUrl, imageSource: draft.imageSource, imageRightsNote: draft.imageRightsNote,
      publicationStatus: draft.publicationStatus, operatingStatus: draft.operatingStatus, needsReview: draft.needsReview,
      price: { status: draft.priceStatus, minVnd: draft.priceMin || null, maxVnd: draft.priceMax || null, unit: draft.priceUnit,
        note: draft.priceNote, source: draft.priceSource, checkedAt: draft.priceCheckedAt }, priceOverride: draft.priceOverride,
      weeklyHours: draft.weeklyHours, hoursOverride: draft.hoursOverride,
      estimatedDurationMinutes: draft.estimatedDurationMinutes, internalNotes: draft.internalNotes, infoCheckedAt: draft.infoCheckedAt };
    try {
      const endpoint = selected ? `/api/admin/place-records/${selected.cityId}/${encodeURIComponent(selected.id)}` : '/api/admin/place-records';
      const response = await fetch(endpoint, { method: selected ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Không lưu được địa điểm.');
      const place = result.place as AdminPlace;
      const next = fromPlace(place); setSelected(place); setDraft(next); setInitial(JSON.stringify(next));
      setMessage('Đã lưu địa điểm. Dữ liệu công khai cập nhật khi tải lại trang.'); setRefresh(value => value + 1);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Không lưu được địa điểm.'); }
    finally { setSaving(false); }
  };
  const removeOrRestore = async (restore: boolean) => {
    if (!selected || dirty) { setMessage('Hãy lưu hoặc bỏ các thay đổi trong biểu mẫu trước.'); return; }
    if (!restore && !window.confirm(`Xóa khỏi dữ liệu sử dụng: “${selected.name}”? Bạn có thể khôi phục sau.`)) return;
    try {
      const endpoint = `/api/admin/place-records/${selected.cityId}/${encodeURIComponent(selected.id)}${restore ? '/restore' : ''}`;
      const response = await fetch(endpoint, { method: restore ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version: selected.version }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Không thực hiện được thao tác.');
      setSelected(result.place); setMessage(restore ? 'Đã khôi phục địa điểm.' : 'Đã xóa mềm địa điểm.'); setRefresh(value => value + 1);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Không thực hiện được thao tác.'); }
  };
  const upload = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) { setMessage('Chỉ nhận JPEG, PNG hoặc WebP, tối đa 5 MB.'); return; }
    setUploading(true); setMessage('');
    try {
      const response = await fetch('/api/admin/place-images', { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
      const result = await response.json(); if (!response.ok) throw new Error(result.error || 'Không tải được ảnh.');
      field('imageUrl', result.url);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Không tải được ảnh.'); }
    finally { setUploading(false); }
  };
  const showAudit = async () => {
    if (!confirmLeave()) return;
    setAuditOpen(true); setEditing(false);
    try { const response = await fetch('/api/admin/place-records/audit', { cache: 'no-store' });
      if (!response.ok) throw new Error('Không tải được nhật ký.'); setAudit((await response.json()).items || []);
    } catch (cause) { setMessage(cause instanceof Error ? cause.message : 'Không tải được nhật ký.'); }
  };
  const signOut = async () => { await fetch('/api/admin/logout', { method: 'POST' }); setSession({ authenticated: false, isAdmin: false, configured: true }); window.history.replaceState(null, '', '/admin/places/login'); };

  return <main className="min-h-screen bg-[#f6f6f7] px-4 py-7 text-[#222] sm:px-6"><div className="mx-auto max-w-7xl">
    <header className="mb-6 flex flex-wrap items-center justify-between gap-3"><div><a href="/" className="text-sm font-bold text-[#d20a45]">← VietGo</a><h1 className="mt-2 text-3xl font-black">Quản trị dữ liệu địa điểm</h1></div>{session?.isAdmin && <button type="button" onClick={signOut} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-bold">Đăng xuất</button>}</header>
    {session === null ? <p role="status">Đang kiểm tra quyền truy cập...</p> : !session.configured ? <p className="rounded-2xl bg-white p-6">Máy chủ chưa cấu hình Google Sign-In và quyền admin. Xem docs/admin-places.md.</p>
      : !session.authenticated ? <section className="max-w-md rounded-2xl bg-white p-6 shadow-sm"><h2 className="mb-3 text-xl font-bold">Đăng nhập để tiếp tục</h2><p className="mb-4 text-sm text-stone-600">Trang này chỉ dành cho tài khoản Google được cấp quyền quản trị trên máy chủ.</p><GoogleSignInButton text="signin_with" onSuccess={async () => { const response = await fetch('/api/admin/session', { cache: 'no-store' }); const value = await response.json(); setSession(value); if (value.isAdmin) window.history.replaceState(null, '', '/admin/places'); }} /></section>
      : !session.isAdmin ? <p role="alert" className="max-w-lg rounded-2xl border border-rose-200 bg-white p-6 text-rose-800">Tài khoản đã đăng nhập không có quyền truy cập quản trị dữ liệu.</p>
      : <>
        <div className="mb-5 flex flex-wrap gap-2"><button type="button" onClick={() => { if (confirmLeave()) { setEditing(false); setAuditOpen(false); } }} className="rounded-full bg-[#222] px-4 py-2 text-sm font-bold text-white">Danh sách</button><button type="button" onClick={beginNew} className="rounded-full bg-[#ff385c] px-4 py-2 text-sm font-bold text-white">+ Thêm địa điểm</button><button type="button" onClick={showAudit} className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-bold">Nhật ký chỉnh sửa</button></div>
        {message && <p role="status" className="mb-4 rounded-xl bg-white p-3 text-sm text-rose-800">{message}</p>}
        {auditOpen ? <section className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm"><h2 className="mb-4 text-xl font-black">Nhật ký chỉnh sửa</h2>{audit.length === 0 ? <p className="text-sm text-stone-500">Chưa có thao tác nào.</p> : <table className="w-full min-w-[680px] text-left text-sm"><thead><tr className="border-b"><th className="p-2">Thời gian</th><th className="p-2">Admin</th><th className="p-2">Hành động</th><th className="p-2">Địa điểm</th><th className="p-2">Trường thay đổi</th></tr></thead><tbody>{audit.map(entry => <tr key={entry.id} className="border-b"><td className="p-2">{new Date(entry.at).toLocaleString('vi-VN')}</td><td className="p-2 break-all">{entry.actorSub}</td><td className="p-2">{entry.action}</td><td className="p-2 break-all">{entry.placeId}</td><td className="p-2"><details><summary className="cursor-pointer">{Object.keys(entry.changes || {}).join(', ') || 'Trạng thái'}</summary><pre className="mt-2 max-h-56 max-w-sm overflow-auto whitespace-pre-wrap text-[11px]">{JSON.stringify(entry.changes, null, 2)}</pre></details></td></tr>)}</tbody></table>}</section> : <div className={`grid gap-5 ${editing ? 'lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]' : ''}`}>
          <section className="min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-5"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"><label className="text-xs font-bold">Tìm tên hoặc địa chỉ<input value={filters.query} onChange={event => filter('query', event.target.value)} placeholder="Tìm địa điểm..." className="mt-1 block w-full rounded-xl border border-stone-300 p-2.5 text-sm font-normal" /></label>
            {([['cityId', 'Khu vực', [['all', 'Tất cả'], ...CITIES]], ['category', 'Danh mục', [['all', 'Tất cả'], ...CATEGORIES]], ['source', 'Nguồn dữ liệu', [['all', 'Tất cả'], ['osm', 'OSM'], ['foursquare', 'Foursquare'], ['merged', 'Đã gộp'], ['admin', 'VietGo']]], ['status', 'Trạng thái', [['all', 'Tất cả'], ['draft', 'Bản nháp'], ['published', 'Đã xuất bản'], ['deleted', 'Đã xóa']]], ['quality', 'Chất lượng', [['all', 'Tất cả'], ['image', 'Thiếu ảnh'], ['price', 'Thiếu giá'], ['hours', 'Thiếu giờ'], ['address', 'Thiếu địa chỉ'], ['coordinates', 'Cần kiểm tra tọa độ']]]] as const).map(([key, label, options]) => <label key={key} className="text-xs font-bold">{label}<select value={filters[key]} onChange={event => filter(key, event.target.value)} className="mt-1 block w-full rounded-xl border border-stone-300 bg-white p-2.5 text-sm font-normal">{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>)}</div>
            <p className="my-4 text-xs text-stone-500">{listLoading ? 'Đang tải...' : `${list.total} địa điểm · Trang ${list.page}`}</p>{listError && <p role="alert" className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{listError} <button type="button" onClick={() => setRefresh(value => value + 1)} className="underline">Thử lại</button></p>}
            {!listLoading && !listError && list.items.length === 0 && <p className="rounded-xl bg-stone-50 p-5 text-sm">Không có địa điểm phù hợp bộ lọc.</p>}
            <div className="overflow-x-auto"><table className="w-full min-w-[740px] text-left text-xs"><thead><tr className="border-b text-stone-500"><th className="p-2">Tên</th><th className="p-2">Khu vực</th><th className="p-2">Danh mục</th><th className="p-2">Tình trạng dữ liệu</th><th className="p-2">Trạng thái</th><th className="p-2">Sửa gần nhất</th><th className="p-2">Thao tác</th></tr></thead><tbody>{list.items.map(place => <tr key={`${place.cityId}-${place.id}`} className="border-b align-top"><td className="p-2 font-bold">{place.name}</td><td className="p-2">{CITIES.find(([id]) => id === place.cityId)?.[1]}</td><td className="p-2">{place.categoryLabel}</td><td className="p-2">{issueLabels(place).join(', ') || 'Đủ thông tin chính'}</td><td className="p-2">{place.deletedAt ? 'Đã xóa' : place.publicationStatus === 'draft' ? 'Bản nháp' : 'Đã xuất bản'}</td><td className="p-2">{place.updatedAt ? new Date(place.updatedAt).toLocaleDateString('vi-VN') : 'Dữ liệu gốc'}</td><td className="p-2"><button type="button" onClick={() => void open(place)} className="font-bold text-[#d20a45] underline">Xem / sửa</button></td></tr>)}</tbody></table></div>
            <div className="mt-4 flex items-center justify-between"><button type="button" disabled={filters.page <= 1} onClick={() => filter('page', filters.page - 1)} className="rounded-full border px-3 py-2 text-xs disabled:opacity-40">Trang trước</button><span className="text-xs">{filters.page} / {Math.max(1, Math.ceil(list.total / list.pageSize))}</span><button type="button" disabled={filters.page * list.pageSize >= list.total} onClick={() => filter('page', filters.page + 1)} className="rounded-full border px-3 py-2 text-xs disabled:opacity-40">Trang sau</button></div>
          </section>
          {editing && <section className="min-w-0 self-start rounded-2xl bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex items-center justify-between gap-2"><h2 className="text-xl font-black">{selected ? 'Xem / sửa địa điểm' : 'Thêm địa điểm'}</h2><button type="button" onClick={() => { if (confirmLeave()) setEditing(false); }} className="text-xs font-bold text-stone-600">Đóng</button></div>
            {selected && <p className="mb-3 break-all text-xs text-stone-500">ID: {selected.id} · Nguồn: {selected.dataSource}{selected.foursquareId ? ` · Foursquare: ${selected.foursquareId}` : ''}{selected.osmId ? ` · OSM: ${selected.osmId}` : ''} · Phiên bản {selected.version}</p>}
            <form onSubmit={save} className="space-y-6"><fieldset className="grid gap-3 sm:grid-cols-2"><legend className="mb-2 text-base font-black">Thông tin cơ bản</legend>
              <label className="text-xs font-bold sm:col-span-2">Tên địa điểm *<input required maxLength={160} value={draft.name} onChange={event => field('name', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label>
              <label className="text-xs font-bold">Khu vực *<select value={draft.cityId} disabled={Boolean(selected)} onChange={event => field('cityId', event.target.value)} className="mt-1 block w-full rounded-xl border bg-white p-2.5 text-sm font-normal">{CITIES.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
              <label className="text-xs font-bold">Loại địa điểm *<select value={draft.categoryGroup} onChange={event => { const category = CATEGORIES.find(([id]) => id === event.target.value); setDraft(current => ({ ...current, categoryGroup: event.target.value, categoryLabel: category?.[1] || event.target.value })); }} className="mt-1 block w-full rounded-xl border bg-white p-2.5 text-sm font-normal">{CATEGORIES.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
              <label className="text-xs font-bold sm:col-span-2">Tên danh mục<input value={draft.categoryLabel} onChange={event => field('categoryLabel', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label>
              <label className="text-xs font-bold sm:col-span-2">Mô tả ngắn<textarea value={draft.description} maxLength={2000} onChange={event => field('description', event.target.value)} rows={3} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label>
              <label className="text-xs font-bold sm:col-span-2">Địa chỉ<input value={draft.address} maxLength={300} onChange={event => field('address', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label>
              <label className="text-xs font-bold">Vĩ độ<input type="number" step="any" min={-90} max={90} value={draft.lat} onChange={event => field('lat', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label><label className="text-xs font-bold">Kinh độ<input type="number" step="any" min={-180} max={180} value={draft.lng} onChange={event => field('lng', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label>
              <div className="sm:col-span-2"><p className="mb-2 text-xs text-stone-500">Chạm bản đồ hoặc kéo marker để chỉnh tọa độ.</p><LocationPicker lat={draft.lat} lng={draft.lng} onPick={(lat, lng) => setDraft(current => ({ ...current, lat: String(lat), lng: String(lng) }))} /></div>
              {duplicates.length > 0 && <p role="status" className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 sm:col-span-2">Có thể trùng: {duplicates.map(item => `${item.name} (${item.address || item.id})`).join('; ')}. Hãy kiểm tra trước khi lưu; hệ thống không tự gộp.</p>}
            </fieldset>
            <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="mb-2 text-base font-black">Thông tin phục vụ lịch trình</legend><label className="text-xs font-bold">Trạng thái giá<select value={draft.priceStatus} onChange={event => field('priceStatus', event.target.value)} className="mt-1 block w-full rounded-xl border bg-white p-2.5 text-sm font-normal"><option value="unknown">Chưa có giá</option><option value="free">Miễn phí</option><option value="priced">Có giá</option></select></label>{draft.priceStatus === 'priced' && <><label className="text-xs font-bold">Cơ sở tính giá<select value={draft.priceUnit} onChange={event => field('priceUnit', event.target.value)} className="mt-1 block w-full rounded-xl border bg-white p-2.5 text-sm font-normal"><option value="person">Mỗi người</option><option value="ticket">Mỗi vé</option><option value="dish">Mỗi món</option><option value="group">Cả nhóm</option></select></label><label className="text-xs font-bold">Giá tối thiểu (VNĐ)<input required type="number" min={0} step={1} value={draft.priceMin} onChange={event => field('priceMin', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label><label className="text-xs font-bold">Giá tối đa (VNĐ)<input type="number" min={0} step={1} value={draft.priceMax} onChange={event => field('priceMax', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label></>}
              <label className="text-xs font-bold sm:col-span-2">Ghi chú giá<input value={draft.priceNote} onChange={event => field('priceNote', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label><label className="text-xs font-bold">Nguồn giá<input value={draft.priceSource} onChange={event => field('priceSource', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label><label className="text-xs font-bold">Ngày kiểm tra giá<input type="date" value={draft.priceCheckedAt} onChange={event => field('priceCheckedAt', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label>
              <div className="sm:col-span-2"><p className="mb-2 text-xs font-bold">Giờ mở cửa theo tuần</p><div className="space-y-2">{DAYS.map(([key, label]) => <div key={key} className="flex flex-wrap items-center gap-2 text-xs"><span className="w-16 font-semibold">{label}</span><select value={draft.weeklyHours[key].status} onChange={event => setDraft(current => ({ ...current, hoursOverride: true, weeklyHours: { ...current.weeklyHours, [key]: { ...current.weeklyHours[key], status: event.target.value as Hours['status'] } } }))} className="rounded-lg border bg-white p-2"><option value="unknown">Chưa biết</option><option value="closed">Đóng cửa</option><option value="open">Có giờ</option><option value="all_day">24 giờ</option></select>{draft.weeklyHours[key].status === 'open' && <><input aria-label={`${label} giờ mở`} type="time" value={draft.weeklyHours[key].open} onChange={event => setDraft(current => ({ ...current, hoursOverride: true, weeklyHours: { ...current.weeklyHours, [key]: { ...current.weeklyHours[key], open: event.target.value } } }))} className="rounded-lg border p-2" /><span>–</span><input aria-label={`${label} giờ đóng`} type="time" value={draft.weeklyHours[key].close} onChange={event => setDraft(current => ({ ...current, hoursOverride: true, weeklyHours: { ...current.weeklyHours, [key]: { ...current.weeklyHours[key], close: event.target.value } } }))} className="rounded-lg border p-2" /></>}</div>)}</div></div>
              <label className="text-xs font-bold">Thời lượng dự kiến (phút)<input type="number" min={1} max={1440} value={draft.estimatedDurationMinutes} onChange={event => field('estimatedDurationMinutes', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label><label className="text-xs font-bold">Số điện thoại<input value={draft.phone} onChange={event => field('phone', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label><label className="text-xs font-bold sm:col-span-2">Website<input type="text" inputMode="url" value={draft.website} onChange={event => field('website', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label>
            </fieldset>
            <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="mb-2 text-base font-black">Hình ảnh</legend><label className="text-xs font-bold sm:col-span-2">Tải ảnh đại diện (JPEG, PNG, WebP; tối đa 5 MB)<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={event => void upload(event.target.files?.[0])} className="mt-1 block w-full text-xs" /></label><label className="text-xs font-bold sm:col-span-2">Hoặc URL ảnh<input value={draft.imageUrl} onChange={event => field('imageUrl', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label>{draft.imageUrl && <div className="sm:col-span-2"><img src={imagePreview(draft.imageUrl)} alt="Xem trước ảnh đại diện" className="max-h-48 w-full rounded-xl bg-stone-100 object-contain" /><button type="button" onClick={() => field('imageUrl', '')} className="mt-2 text-xs font-bold text-rose-700 underline">Xóa ảnh đại diện</button></div>}<label className="text-xs font-bold">Nguồn ảnh<input value={draft.imageSource} onChange={event => field('imageSource', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label><label className="text-xs font-bold">Ghi chú quyền sử dụng<input value={draft.imageRightsNote} onChange={event => field('imageRightsNote', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label></fieldset>
            <fieldset className="grid gap-3 sm:grid-cols-2"><legend className="mb-2 text-base font-black">Quản lý</legend><label className="text-xs font-bold">Xuất bản<select value={draft.publicationStatus} onChange={event => field('publicationStatus', event.target.value)} className="mt-1 block w-full rounded-xl border bg-white p-2.5 text-sm font-normal"><option value="draft">Bản nháp</option><option value="published">Đã xuất bản</option></select></label><label className="text-xs font-bold">Tình trạng hoạt động<select value={draft.operatingStatus} onChange={event => field('operatingStatus', event.target.value)} className="mt-1 block w-full rounded-xl border bg-white p-2.5 text-sm font-normal"><option value="unverified">Chưa xác minh</option><option value="active">Đang hoạt động</option><option value="temporarily_closed">Tạm đóng cửa</option><option value="permanently_closed">Đóng cửa vĩnh viễn</option></select></label><label className="flex items-center gap-2 text-xs font-bold sm:col-span-2"><input type="checkbox" checked={draft.needsReview} onChange={event => field('needsReview', event.target.checked)} /> Cần kiểm tra tọa độ / dữ liệu</label><label className="text-xs font-bold sm:col-span-2">Ghi chú nội bộ (chỉ admin)<textarea value={draft.internalNotes} onChange={event => field('internalNotes', event.target.value)} rows={3} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label><label className="text-xs font-bold">Ngày kiểm tra gần nhất<input type="date" value={draft.infoCheckedAt} onChange={event => field('infoCheckedAt', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label><label className="text-xs font-bold">Nhãn, cách nhau bằng dấu phẩy<input value={draft.tags} onChange={event => field('tags', event.target.value)} className="mt-1 block w-full rounded-xl border p-2.5 text-sm font-normal" /></label></fieldset>
            <div className="flex flex-wrap gap-2 border-t pt-4"><button type="submit" disabled={saving || uploading} className="rounded-full bg-[#ff385c] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu địa điểm'}</button>{selected && (selected.deletedAt ? <button type="button" onClick={() => void removeOrRestore(true)} className="rounded-full border px-5 py-2.5 text-sm font-bold">Khôi phục</button> : <button type="button" onClick={() => void removeOrRestore(false)} className="rounded-full border border-rose-300 px-5 py-2.5 text-sm font-bold text-rose-700">Xóa khỏi dữ liệu sử dụng</button>)}</div>
          </form></section>}
        </div>}
      </>}
  </div></main>;
}
