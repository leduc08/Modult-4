import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowDown, ArrowLeft, ArrowUp, CalendarDays, Ellipsis, MapPin, Moon, Save, Sun, Sunset, Trash2, UtensilsCrossed, Users, Wallet } from 'lucide-react';
import { activityCost, formatVnd, tripCostSummary } from '../data/plannerPricing';
import { CITY_NAMES, getCityTripPlaces, openingCompatibility, type TripPlace, type VerifiedTrip } from '../data/tripPlaces';
import { PlannerPlaceDetailModal } from './PlannerPlaceDetailModal';

const isFood = (place: TripPlace) => place.categoryGroup === 'food' || place.categoryGroup === 'cafe';
const duration = (place: TripPlace) => place.plannedDurationMinutes || (place.categoryGroup === 'cafe' ? 60 : isFood(place) ? 75 : 120);
const start = (place: TripPlace) => place.plannedStartTime || '09:00';
const minutes = (time: string) => { const [hour, minute] = time.split(':').map(Number); return hour * 60 + minute; };
const clock = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
const dateText = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('vi-VN');
const periods = [
  { title: 'Buổi sáng', icon: Sun, fits: (hour: number) => hour < 11 },
  { title: 'Buổi trưa', icon: UtensilsCrossed, fits: (hour: number) => hour >= 11 && hour < 14 },
  { title: 'Buổi chiều', icon: Sunset, fits: (hour: number) => hour >= 14 && hour < 18 },
  { title: 'Buổi tối', icon: Moon, fits: (hour: number) => hour >= 18 },
];
// Leave an internal 30-minute gap after every stop when order or duration changes.
function reflow(input: TripPlace[], from = 0, resetTimes = false): TripPlace[] {
  const next = input.map(place => ({ ...place }));
  for (let index = from; index < next.length; index++) {
    const previous = next[index - 1];
    const earliest = previous ? minutes(start(previous)) + duration(previous) + 30 : 9 * 60;
    next[index].plannedStartTime = clock(Math.max(earliest, resetTimes ? 0 : minutes(start(next[index]))));
  }
  return next;
}
const markerIcon = (number: number, selected: boolean) => L.divIcon({
  className: '', iconSize: [34, 34], iconAnchor: [17, 17],
  html: `<span style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border:3px solid white;border-radius:50%;background:${selected ? '#a80035' : '#ff385c'};color:white;font-weight:800;box-shadow:0 2px 8px #0005;${selected ? 'transform:scale(1.15)' : ''}">${number}</span>`,
});

export const VerifiedPlanPage: React.FC<{ trip: VerifiedTrip; onChange: (trip: VerifiedTrip) => void; onBack: () => void; onSave: (trip: VerifiedTrip) => void }> = ({ trip, onChange, onBack, onSave }) => {
  const [dayIndex, setDayIndex] = useState(0);
  const [alternatives, setAlternatives] = useState<TripPlace[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [detailId, setDetailId] = useState('');
  const [menuIndex, setMenuIndex] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [saved, setSaved] = useState(false);
  const [scheduleError, setScheduleError] = useState('');
  const [mapOffline, setMapOffline] = useState(false);
  const mapHost = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layers = useRef<L.Layer[]>([]);
  const markers = useRef(new Map<string, L.Marker>());
  const cards = useRef(new Map<string, HTMLElement>());
  const day = trip.schedule[Math.min(dayIndex, trip.schedule.length - 1)];
  const detailIndex = day?.places.findIndex(place => place.id === detailId) ?? -1;
  const detailPlace = detailIndex >= 0 ? day.places[detailIndex] : null;
  const summary = tripCostSummary(trip);
  const groups = periods.map(period => ({ ...period, items: day?.places.map((place, index) => ({ place, index })).filter(item => period.fits(Number(start(item.place).slice(0, 2)))) || [] })).filter(group => group.items.length);

  useEffect(() => {
    let alive = true;
    setLoadState('loading');
    getCityTripPlaces(trip.cityId).then(data => {
      if (!alive) return;
      setAlternatives(data?.places || []);
      setLoadState(data ? 'ready' : 'error');
    }).catch(() => { if (alive) setLoadState('error'); });
    return () => { alive = false; };
  }, [trip.cityId]);
  useEffect(() => { setSelectedId(day?.places[0]?.id || ''); }, [dayIndex, trip.cityId]);
  useEffect(() => { if (!day?.places.some(place => place.id === selectedId)) setSelectedId(day?.places[0]?.id || ''); }, [day, selectedId]);
  useEffect(() => {
    if (!mapHost.current || (!showMap && window.innerWidth < 1024)) return;
    const first = day?.places[0];
    if (!map.current && first) {
      map.current = L.map(mapHost.current).setView([first.coordinates.lat, first.coordinates.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' })
        .on('tileerror', () => setMapOffline(true)).on('tileload', () => setMapOffline(false)).addTo(map.current);
    }
    layers.current.forEach(layer => layer.remove()); layers.current = []; markers.current.clear();
    if (!map.current || !day?.places.length) return;
    const bounds: L.LatLngExpression[] = [];
    day.places.forEach((place, index) => {
      const point: L.LatLngExpression = [place.coordinates.lat, place.coordinates.lng];
      const popup = document.createElement('div'); popup.textContent = `${index + 1}. ${place.name} — ${place.address}`;
      const marker = L.marker(point, { title: `${index + 1}. ${place.name}`, icon: markerIcon(index + 1, false) }).addTo(map.current!).bindPopup(popup);
      marker.on('click', () => { setSelectedId(place.id); if (window.innerWidth < 1024) setShowMap(false); window.setTimeout(() => cards.current.get(place.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0); });
      layers.current.push(marker); markers.current.set(place.id, marker); bounds.push(point);
    });
    if (bounds.length > 1) map.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 }); else map.current.setView(bounds[0], 14);
    window.setTimeout(() => map.current?.invalidateSize(), 0);
  }, [day, showMap]);
  useEffect(() => { day?.places.forEach((place, index) => markers.current.get(place.id)?.setIcon(markerIcon(index + 1, place.id === selectedId))); }, [day, selectedId]);
  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);

  const update = (places: TripPlace[]) => {
    if (places.some(place => minutes(start(place)) + duration(place) > 24 * 60)) {
      setScheduleError('Hoạt động sẽ kết thúc sau nửa đêm. Hãy chọn giờ sớm hơn hoặc giảm thời lượng.');
      return;
    }
    setScheduleError(''); setSaved(false);
    onChange({ ...trip, schedule: trip.schedule.map((entry, index) => index === dayIndex ? { ...entry, places } : entry) });
  };
  const edit = (index: number, patch: Partial<TripPlace>) => update(reflow(day.places.map((place, i) => i === index ? { ...place, ...patch } : place), index));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= day.places.length) return;
    const places = [...day.places]; [places[index], places[target]] = [places[target], places[index]];
    update(reflow(places, 0, true));
  };
  const replace = (index: number, id: string) => {
    const option = alternatives.find(place => place.id === id);
    if (!option || trip.schedule.some(entry => entry.places.some(place => place.id === id))) return;
    const old = day.places[index];
    update(reflow(day.places.map((place, i) => i === index ? { ...option, plannedStartTime: start(old), plannedDurationMinutes: duration(old) } : place), index + 1));
    setReplaceIndex(null); setQuery(''); setSelectedId(id);
  };
  const available = useMemo(() => alternatives.filter(place => !trip.schedule.some(entry => entry.places.some(selected => selected.id === place.id))), [alternatives, trip.schedule]);
  const choices = (index: number) => available.filter(place => isFood(place) === isFood(day.places[index])
    && openingCompatibility(place.openingHours, start(day.places[index]), duration(day.places[index]), day.date, place.weeklyHours) !== 'closed'
    && (!query || `${place.name} ${place.address}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))).slice(0, 100);
  const add = (id: string) => {
    const place = available.find(item => item.id === id);
    if (!place) return;
    const last = day.places.at(-1);
    const when = last ? minutes(start(last)) + duration(last) + 30 : 9 * 60;
    if (when + duration(place) > 24 * 60) { setScheduleError('Ngày này không còn đủ thời gian cho hoạt động mới.'); return; }
    update([...day.places, { ...place, plannedStartTime: clock(when), plannedDurationMinutes: duration(place) }]); setSelectedId(id);
  };

  return <div className="min-h-screen bg-[#f6f6f7] px-4 py-6 text-[#222] sm:px-6"><div className="mx-auto max-w-7xl">
    <header className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><p className="mb-1 text-xs font-extrabold uppercase tracking-widest text-[#ff385c]">Lịch trình VietGo</p><h1 className="text-2xl font-black sm:text-3xl">Khám phá {CITY_NAMES[trip.cityId] || trip.cityId}</h1><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-stone-600"><span className="flex items-center gap-1"><CalendarDays className="h-4 w-4" />{dateText(trip.startDate)} – {dateText(trip.endDate || trip.schedule.at(-1)?.date || trip.startDate)}</span><span className="flex items-center gap-1"><Users className="h-4 w-4" />{trip.guests} người</span><span className="flex items-center gap-1"><Wallet className="h-4 w-4" />{summary.budget === null ? 'Chưa xác định ngân sách' : `${formatVnd(summary.budget)} / cả nhóm`}</span></div></div><div className="flex w-full flex-wrap gap-2 sm:w-auto"><button type="button" onClick={onBack} className="flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-bold"><ArrowLeft className="h-4 w-4" />Sửa thông tin</button><button type="button" onClick={() => { onSave({ ...trip, savedAt: new Date().toISOString() }); setSaved(true); }} className="flex items-center gap-2 rounded-full bg-[#ff385c] px-5 py-2.5 text-sm font-bold text-white"><Save className="h-4 w-4" />{saved ? 'Đã lưu lịch trình' : 'Lưu lịch trình'}</button></div></header>
    <section aria-label="Tóm tắt ngân sách" className="mb-5 rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"><div className="grid gap-3 text-sm sm:grid-cols-3"><div><span className="block text-xs font-semibold text-stone-500">Ngân sách cả nhóm · toàn chuyến</span><strong>{summary.budget === null ? 'Chưa xác định' : formatVnd(summary.budget)}</strong></div><div><span className="block text-xs font-semibold text-stone-500">Chi phí đã biết · ăn uống & hoạt động</span><strong>{formatVnd(summary.knownVnd)}</strong></div><div><span className="block text-xs font-semibold text-stone-500">Hoạt động chưa có giá</span><strong>{summary.missingPriceCount}</strong></div></div><p className="mt-3 text-xs leading-5 text-stone-500">Chưa gồm lưu trú và di chuyển. {summary.incompleteCount > summary.missingPriceCount ? `${summary.incompleteCount - summary.missingPriceCount} hoạt động còn khoản chưa xác định. ` : ''}Giá món ăn tạm tính theo số người lớn; giá vé trẻ em và các khoản chưa rõ không được tính là miễn phí.</p>{summary.exceededVnd > 0 && <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">Chi phí đã biết vượt ngân sách {formatVnd(summary.exceededVnd)}. Dùng “Thay địa điểm” ở từng hoạt động để điều chỉnh.</p>}</section>
    <p className="mb-4 text-xs text-stone-500">Khung giờ là dự kiến của lịch trình. Xem giờ mở cửa trong chi tiết từng địa điểm trước chuyến đi.</p>
    {scheduleError && <p role="alert" className="mb-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{scheduleError}</p>}
    <nav aria-label="Chọn ngày lịch trình" className="mb-5 flex gap-2 overflow-x-auto pb-1">{trip.schedule.map((entry, index) => <button key={entry.dayNumber} type="button" aria-pressed={dayIndex === index} onClick={() => { setDayIndex(index); setReplaceIndex(null); setMenuIndex(null); setDetailId(''); }} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold ${dayIndex === index ? 'bg-[#222] text-white' : 'border border-stone-200 bg-white text-stone-600'}`}>Ngày {entry.dayNumber} · {dateText(entry.date)}</button>)}</nav>
    <div className="mb-4 flex rounded-full border border-stone-200 bg-white p-1 lg:hidden"><button type="button" aria-pressed={!showMap} onClick={() => setShowMap(false)} className={`w-1/2 rounded-full py-2 text-sm font-bold ${!showMap ? 'bg-[#ff385c] text-white' : ''}`}>Lịch trình</button><button type="button" aria-pressed={showMap} onClick={() => setShowMap(true)} className={`w-1/2 rounded-full py-2 text-sm font-bold ${showMap ? 'bg-[#ff385c] text-white' : ''}`}>Bản đồ</button></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"><section className={`${showMap ? 'hidden lg:block' : ''} min-w-0 space-y-5`}>
      {!day?.places.length && <p className="rounded-3xl bg-white p-6 text-sm">Ngày này chưa có điểm dừng. Chọn địa điểm từ dữ liệu VietGo bên dưới để thêm.</p>}
      {groups.map(group => <section key={group.title} className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"><h2 className="mb-4 flex items-center gap-2 text-lg font-black"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-[#ff385c]"><group.icon className="h-5 w-5" /></span>{group.title}</h2><div className="space-y-3">{group.items.map(({ place, index }) => {
        const cost = activityCost(place, trip.participants);
        const currentPlace = loadState === 'ready' ? alternatives.find(item => item.id === place.id) : null;
        const unavailable = loadState === 'ready' && (!currentPlace || ['temporarily_closed', 'permanently_closed'].includes(currentPlace.operatingStatus || ''));
        const changed = currentPlace && (currentPlace.name !== place.name || currentPlace.address !== place.address || JSON.stringify(currentPlace.price) !== JSON.stringify(place.price));
        return <article key={place.id} ref={element => { if (element) cards.current.set(place.id, element); else cards.current.delete(place.id); }} tabIndex={0} onClick={event => { if (!(event.target as HTMLElement).closest('button,input,select,a')) setSelectedId(place.id); }} onKeyDown={event => { if (event.key === 'Enter' && event.target === event.currentTarget) setSelectedId(place.id); }} className={`min-w-0 rounded-2xl border p-3 transition-shadow sm:p-4 ${selectedId === place.id ? 'border-rose-300 shadow-md ring-1 ring-rose-100' : 'border-stone-200'}`}>
          <div className="flex min-w-0 gap-3"><div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-rose-50 sm:h-28 sm:w-28"><img src={place.imageUrl && !place.isPlaceholderImage ? place.imageUrl : isFood(place) ? '/images/food-placeholder.svg' : '/images/place-placeholder.svg'} onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = isFood(place) ? '/images/food-placeholder.svg' : '/images/place-placeholder.svg'; }} alt="" className="h-full w-full object-cover" /><span className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#ff385c] text-xs font-black text-white">{index + 1}</span></div><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-1.5 text-[11px] font-bold"><span className="rounded-full bg-rose-50 px-2 py-1 text-rose-800">{start(place)}–{clock(minutes(start(place)) + duration(place))} · dự kiến</span><span className="rounded-full bg-stone-100 px-2 py-1 text-stone-700">{cost.badge}</span>{openingCompatibility(place.openingHours, start(place), duration(place), day.date, place.weeklyHours) === 'closed' && <span className="rounded-full bg-amber-100 px-2 py-1 text-amber-900">Ngoài giờ mở cửa đã biết</span>}</div><h3 className="mt-2 break-words text-base font-black leading-snug">{place.name}</h3><p className="mt-1 flex items-start gap-1 text-xs text-stone-600"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="line-clamp-2">{place.address}</span></p><p className="mt-1 text-xs text-stone-500">Thời lượng dự kiến: {duration(place)} phút</p></div></div>
          <div className="mt-3 flex flex-wrap items-center gap-1 border-t border-stone-100 pt-2 text-xs font-bold"><button type="button" aria-expanded={detailId === place.id} onClick={() => { setSelectedId(place.id); setDetailId(detailId === place.id ? '' : place.id); }} className="rounded-full px-3 py-2 hover:bg-stone-100">Chi tiết</button><button type="button" aria-expanded={replaceIndex === index} onClick={() => { setReplaceIndex(replaceIndex === index ? null : index); setQuery(''); }} className="rounded-full px-3 py-2 text-[#d20a45] hover:bg-rose-50">Thay địa điểm</button><div className="relative ml-auto"><button type="button" aria-label={`Thao tác với ${place.name}`} aria-expanded={menuIndex === index} onClick={() => setMenuIndex(menuIndex === index ? null : index)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-stone-100"><Ellipsis className="h-5 w-5" /></button>{menuIndex === index && <div className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-stone-200 bg-white p-1 shadow-xl"><button type="button" disabled={index === 0} onClick={() => { move(index, -1); setMenuIndex(null); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left disabled:opacity-40"><ArrowUp className="h-4 w-4" />Đưa lên</button><button type="button" disabled={index === day.places.length - 1} onClick={() => { move(index, 1); setMenuIndex(null); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left disabled:opacity-40"><ArrowDown className="h-4 w-4" />Đưa xuống</button><button type="button" onClick={() => { update(reflow(day.places.filter((_, i) => i !== index))); setMenuIndex(null); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-rose-700"><Trash2 className="h-4 w-4" />Xóa</button></div>}</div></div>
          {unavailable && <p role="status" className="mt-2 rounded-xl bg-amber-50 p-2 text-xs text-amber-900">Địa điểm hiện không còn khả dụng. Lịch trình đã lưu vẫn giữ thông tin cũ; bạn có thể thay địa điểm.</p>}
          {!unavailable && changed && <p role="status" className="mt-2 rounded-xl bg-amber-50 p-2 text-xs text-amber-900">Thông tin địa điểm đã thay đổi trong dữ liệu VietGo. Lịch trình này vẫn giữ bản đã lưu.</p>}
          {replaceIndex === index && <div className="mt-2 rounded-xl border border-stone-200 bg-white p-3"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Tìm địa điểm thay thế" aria-label="Tìm địa điểm thay thế" className="w-full rounded-lg border border-stone-200 p-2 text-sm" /><div className="mt-2 max-h-48 overflow-y-auto">{loadState === 'loading' && <p className="p-2 text-xs">Đang tải địa điểm...</p>}{loadState === 'error' && <p className="p-2 text-xs text-rose-700">Không tải được dữ liệu địa điểm.</p>}{loadState === 'ready' && !choices(index).length && <p className="p-2 text-xs">Không có địa điểm phù hợp. Thử tìm tên khác.</p>}{choices(index).map(option => <button key={option.id} type="button" onClick={() => replace(index, option.id)} className="block w-full rounded-lg p-2 text-left hover:bg-rose-50"><strong className="block text-xs">{option.name}</strong><span className="block truncate text-xs text-stone-500">{option.address} · {activityCost(option, trip.participants).badge}</span></button>)}</div></div>}
        </article>;
      })}</div></section>)}
      {available.length > 0 && <label className="block rounded-2xl border border-dashed border-stone-300 bg-white p-4 text-xs font-bold">Thêm địa điểm từ dữ liệu VietGo<select value="" onChange={event => add(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 bg-white p-2.5 text-sm font-normal"><option value="">Chọn địa điểm</option>{available.slice(0, 100).map(option => <option key={option.id} value={option.id}>{option.name} — {option.address}</option>)}</select></label>}
    </section><aside className={showMap ? 'block min-w-0' : 'hidden min-w-0 lg:block'}><div className="sticky top-[calc(var(--site-header-height,100px)+16px)] overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm"><div className="border-b border-stone-200 p-4 text-sm font-bold">Bản đồ · Ngày {day?.dayNumber}</div><div className="relative"><div ref={mapHost} className="h-[min(60dvh,540px)] w-full bg-stone-100 lg:h-[min(70dvh,650px)]" />{mapOffline && <p className="absolute bottom-3 left-3 right-3 z-[1000] rounded-lg bg-white/95 p-2 text-xs">Không tải được nền bản đồ. Tọa độ địa điểm có trong phần chi tiết.</p>}</div><p className="border-t border-stone-100 px-4 py-2 text-xs text-stone-500">Số trên bản đồ là thứ tự ghé thăm trong ngày.</p></div></aside></div>
    <PlannerPlaceDetailModal place={detailPlace} date={day?.date} participants={trip.participants} onClose={() => setDetailId('')} onEdit={patch => { if (detailIndex >= 0) edit(detailIndex, patch); }} />
  </div></div>;
};
