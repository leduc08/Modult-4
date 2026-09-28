import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowDown, ArrowLeft, ArrowUp, Ellipsis, MapPin, Save, Search, Trash2, X } from 'lucide-react';
import { CITY_NAMES, estimateDistanceKm, getCityTripPlaces, type TripPlace, type VerifiedTrip } from '../data/tripPlaces';

const sourceName = (source: TripPlace['dataSource']) => source === 'osm' ? 'OpenStreetMap' : source === 'foursquare' ? 'Foursquare' : 'Foursquare + OpenStreetMap';
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi');
const isFood = (place: TripPlace) => ['food', 'cafe'].includes(place.categoryGroup);
const defaultDuration = (place: TripPlace) => place.categoryGroup === 'cafe' ? 60 : isFood(place) ? 75 : 120;
const plannedTime = (places: TripPlace[], index: number) => {
  const place = places[index];
  if (place.plannedStartTime) return place.plannedStartTime;
  const siblings = places.slice(0, index + 1).filter(item => isFood(item) === isFood(place));
  const position = siblings.length - 1;
  return isFood(place) ? ['12:00', '19:00', '16:00'][Math.min(position, 2)] : ['09:00', '15:00', '17:00'][Math.min(position, 2)];
};
const addMinutes = (time: string, minutes: number) => {
  const [hour, minute] = time.split(':').map(Number);
  const total = Math.min(23 * 60 + 30, Math.ceil((hour * 60 + minute + minutes) / 30) * 30);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};
const resetOrderTimes = (places: TripPlace[]) => {
  let sights = 0;
  let foods = 0;
  return places.map(place => {
    const time = isFood(place)
      ? ['12:00', '19:00', '16:00'][Math.min(foods++, 2)]
      : ['09:00', '15:00', '17:00'][Math.min(sights++, 2)];
    return { ...place, plannedStartTime: time };
  });
};
const periodFor = (time: string) => {
  const hour = Number(time.slice(0, 2));
  if (hour < 11) return 'Buổi sáng';
  if (hour < 14) return 'Bữa trưa';
  if (hour < 18) return 'Buổi chiều';
  return 'Buổi tối';
};
const timeSlots = Array.from({ length: 48 }, (_, index) => `${String(Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`);
const categoryName = (place: TripPlace) => {
  const raw = place.categoryLabel || '';
  const key = normalize(raw);
  if (key.includes('museum')) return key.includes('art') ? 'Bảo tàng nghệ thuật' : 'Bảo tàng';
  if (key.includes('historic site') || key.includes('historical site')) return 'Di tích lịch sử';
  if (key.includes('art gallery')) return 'Phòng trưng bày nghệ thuật';
  if (key.includes('scenic lookout') || key.includes('viewpoint')) return 'Điểm ngắm cảnh';
  if (key.includes('temple') || key.includes('pagoda')) return 'Đền, chùa';
  if (key.includes('national park')) return 'Vườn quốc gia';
  if (key.includes('park')) return 'Công viên';
  if (/[À-ỹ]/.test(raw)) return raw.split('(')[0].trim();
  return place.categoryGroup === 'culture' ? 'Văn hóa' : place.categoryGroup === 'sightseeing' ? 'Tham quan' : place.categoryGroup === 'cafe' ? 'Cà phê' : 'Ẩm thực';
};
const markerIcon = (number: number, selected: boolean) => L.divIcon({
  className: '',
  html: `<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border:3px solid white;border-radius:50%;background:${selected ? '#B00032' : '#FF385C'};color:white;font-weight:800;box-shadow:0 2px 8px #0005;${selected ? 'transform:scale(1.16);' : ''}">${number}</span>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

export const VerifiedPlanPage: React.FC<{ trip: VerifiedTrip; onChange: (trip: VerifiedTrip) => void; onBack: () => void; onSave: (trip: VerifiedTrip) => void }> = ({ trip, onChange, onBack, onSave }) => {
  const [dayIndex, setDayIndex] = useState(0);
  const [alternatives, setAlternatives] = useState<TripPlace[]>([]);
  const [alternativesState, setAlternativesState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [replaceQuery, setReplaceQuery] = useState('');
  const [detailsPlaceId, setDetailsPlaceId] = useState('');
  const [actionMenuIndex, setActionMenuIndex] = useState<number | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mapOffline, setMapOffline] = useState(false);
  const mapHost = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layers = useRef<L.Layer[]>([]);
  const markers = useRef(new Map<string, L.Marker>());
  const cardRefs = useRef(new Map<string, HTMLElement>());
  const day = trip.schedule[dayIndex] || trip.schedule[0];

  useEffect(() => {
    let active = true;
    setAlternativesState('loading');
    getCityTripPlaces(trip.cityId).then(data => {
      if (!active) return;
      if (!data) { setAlternativesState('error'); setAlternatives([]); return; }
      setAlternatives(data.places);
      setAlternativesState('ready');
    }).catch(() => { if (active) setAlternativesState('error'); });
    return () => { active = false; };
  }, [trip.cityId]);

  useEffect(() => setSelectedPlaceId(day?.places[0]?.id || ''), [dayIndex, trip.cityId]);
  useEffect(() => {
    if (!day?.places.some(place => place.id === selectedPlaceId)) setSelectedPlaceId(day?.places[0]?.id || '');
  }, [day, selectedPlaceId]);

  useEffect(() => {
    if (!mapHost.current || (!showMap && window.innerWidth < 1024)) return;
    const first = day?.places[0];
    if (!map.current && first) {
      map.current = L.map(mapHost.current).setView([first.coordinates.lat, first.coordinates.lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap contributors' })
        .on('tileerror', () => setMapOffline(true))
        .on('tileload', () => setMapOffline(false))
        .addTo(map.current);
    }
    layers.current.forEach(layer => layer.remove());
    layers.current = [];
    markers.current.clear();
    if (!map.current || !day?.places.length) return;
    const bounds: L.LatLngExpression[] = [];
    day.places.forEach((place, index) => {
      const point: L.LatLngExpression = [place.coordinates.lat, place.coordinates.lng];
      const popup = document.createElement('div');
      popup.textContent = `${index + 1}. ${place.name} — ${place.address}`;
      const marker = L.marker(point, {
        title: `${index + 1}. ${place.name}`,
        icon: markerIcon(index + 1, false),
      }).addTo(map.current).bindPopup(popup);
      marker.on('click', () => {
        setSelectedPlaceId(place.id);
        window.setTimeout(() => cardRefs.current.get(place.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
      });
      layers.current.push(marker);
      markers.current.set(place.id, marker);
      bounds.push(point);
    });
    if (bounds.length > 1) map.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
    else map.current.setView(bounds[0], 14);
    setTimeout(() => map.current?.invalidateSize(), 0);
  }, [day, showMap]);
  useEffect(() => {
    day?.places.forEach((place, index) => markers.current.get(place.id)?.setIcon(markerIcon(index + 1, place.id === selectedPlaceId)));
  }, [day, selectedPlaceId]);
  useEffect(() => () => { map.current?.remove(); map.current = null; }, []);

  const updatePlaces = (places: TripPlace[]) => {
    setSaved(false);
    onChange({ ...trip, schedule: trip.schedule.map((entry, index) => index === dayIndex ? { ...entry, places } : entry) });
  };
  const updatePlace = (index: number, patch: Partial<TripPlace>) => updatePlaces(day.places.map((place, i) => i === index ? { ...place, ...patch } : place));
  const move = (index: number, delta: number) => {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= day.places.length) return;
    const places = [...day.places];
    [places[index], places[nextIndex]] = [places[nextIndex], places[index]];
    updatePlaces(resetOrderTimes(places));
  };
  const replace = (index: number, id: string) => {
    const replacement = alternatives.find(place => place.id === id);
    if (!replacement || trip.schedule.some(entry => entry.places.some(place => place.id === id))) return;
    const previous = day.places[index];
    updatePlaces(day.places.map((place, i) => i === index ? { ...replacement, plannedStartTime: previous.plannedStartTime, plannedDurationMinutes: previous.plannedDurationMinutes } : place));
    setReplacingIndex(null);
    setReplaceQuery('');
    setSelectedPlaceId(replacement.id);
  };
  const addPlace = (id: string) => {
    const place = alternatives.find(option => option.id === id);
    if (!place || trip.schedule.some(entry => entry.places.some(selected => selected.id === id))) return;
    const last = day.places.at(-1);
    const startTime = last ? addMinutes(plannedTime(day.places, day.places.length - 1), (last.plannedDurationMinutes || defaultDuration(last)) + 30) : '09:00';
    const next = [...day.places, { ...place, plannedStartTime: startTime, plannedDurationMinutes: defaultDuration(place) }];
    updatePlaces(next);
    setSelectedPlaceId(place.id);
  };
  const available = useMemo(() => alternatives.filter(place => !trip.schedule.some(entry => entry.places.some(selected => selected.id === place.id))), [alternatives, trip.schedule]);
  const matches = (index: number) => {
    const sameType = available.filter(place => isFood(place) === isFood(day.places[index]));
    const query = normalize(replaceQuery.trim());
    return sameType.filter(place => !query || normalize(`${place.name} ${place.address} ${place.categoryLabel}`).includes(query)).slice(0, 100);
  };

  return <div className="min-h-screen bg-white px-4 py-6 text-[#222222] sm:px-6">
    <div className="mx-auto max-w-7xl">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><button onClick={onBack} className="mb-2 flex items-center gap-1 text-xs font-bold text-[#FF385C]"><ArrowLeft className="h-4 w-4" /> Sửa thông tin chuyến đi</button><h1 className="text-2xl font-black sm:text-3xl">Lịch trình {CITY_NAMES[trip.cityId]}</h1><p className="text-sm text-stone-600">{trip.days} ngày • {trip.participants ? `${trip.participants.adults} người lớn${trip.participants.children ? `, ${trip.participants.children} trẻ em` : ''}${trip.participants.infants ? `, ${trip.participants.infants} em bé` : ''}` : `${trip.guests} người`} • khởi hành {new Date(`${trip.startDate}T12:00:00`).toLocaleDateString('vi-VN')}</p></div>
        <button onClick={() => { onSave({ ...trip, savedAt: new Date().toISOString() }); setSaved(true); }} className="flex items-center gap-2 rounded-full bg-[#FF385C] px-5 py-2.5 text-sm font-bold text-white"><Save className="h-4 w-4" />{saved ? 'Đã lưu' : 'Lưu lịch trình'}</button>
      </div>
      <p className="mb-5 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">Giờ ghé thăm và thời lượng tham quan là dự kiến. Hãy kiểm tra giờ mở cửa trước chuyến đi. Chặng đường hiện chỉ có khoảng cách đường chim bay; thời gian đi đường và giao thông chưa có dữ liệu.</p>
      <div className="mb-4 flex flex-wrap gap-2">{trip.schedule.map((entry, index) => <button key={entry.dayNumber} aria-pressed={dayIndex === index} onClick={() => { setDayIndex(index); setReplacingIndex(null); setActionMenuIndex(null); setDetailsPlaceId(''); }} className={`rounded-full px-4 py-2 text-sm font-bold ${dayIndex === index ? 'bg-[#222222] text-white' : 'bg-stone-100 text-stone-600'}`}>Ngày {entry.dayNumber} • {new Date(`${entry.date}T12:00:00`).toLocaleDateString('vi-VN')}</button>)}<button onClick={() => setShowMap(!showMap)} className="ml-auto rounded-full border border-stone-300 px-4 py-2 text-sm font-bold lg:hidden">{showMap ? 'Xem danh sách' : 'Xem bản đồ'}</button></div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.85fr)]">
        <section className={showMap ? 'hidden lg:block' : 'space-y-3'}>
          {day.places.length === 0 && <p className="rounded-xl bg-rose-50 p-5 text-sm">Ngày này chưa có điểm dừng. Chọn địa điểm trong dữ liệu bên dưới để thêm.</p>}
          {day.places.map((place, index) => <React.Fragment key={place.id}>
            {index > 0 && <p className="flex items-center gap-2 pl-4 text-xs text-stone-500"><span aria-hidden="true">↓</span> Di chuyển khoảng {estimateDistanceKm(day.places[index - 1], place)} km theo đường chim bay</p>}
            <article id={`itinerary-stop-${place.id}`} ref={element => { if (element) cardRefs.current.set(place.id, element); else cardRefs.current.delete(place.id); }} tabIndex={0} onClick={event => { if (!(event.target as HTMLElement).closest('button,input,summary,a,select,details')) setSelectedPlaceId(place.id); }} onKeyDown={event => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); setSelectedPlaceId(place.id); } }} onFocusCapture={event => { if (!(event.target as HTMLElement).closest('details')) setSelectedPlaceId(place.id); }} className={`rounded-2xl border p-4 transition-shadow ${selectedPlaceId === place.id ? 'border-rose-300 shadow-md ring-1 ring-rose-100' : 'border-stone-200 shadow-sm'}`}>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-600">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-black text-white ${selectedPlaceId === place.id ? 'bg-rose-800' : 'bg-[#FF385C]'}`}>{index + 1}</span>
                <label className="flex items-center gap-1">Giờ dự kiến<select aria-label={`Giờ dự kiến cho ${place.name}`} value={plannedTime(day.places, index)} onChange={event => updatePlace(index, { plannedStartTime: event.target.value })} className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm font-semibold text-stone-900">{timeSlots.map(time => <option key={time}>{time}</option>)}</select></label>
                <label className="flex items-center gap-1">Thời lượng<input aria-label={`Thời lượng dự kiến cho ${place.name}`} type="number" min={15} max={480} step={15} value={place.plannedDurationMinutes || defaultDuration(place)} onChange={event => updatePlace(index, { plannedDurationMinutes: Math.max(15, Math.min(480, Number(event.target.value) || 15)) })} className="w-[4.5rem] rounded-lg border border-stone-200 bg-white px-2 py-1 text-sm font-semibold text-stone-900" /><span>phút</span></label>
                <span className="ml-auto rounded-full bg-stone-100 px-2.5 py-1">{periodFor(plannedTime(day.places, index))} · {categoryName(place)}</span>
              </div>
              <h2 className="mt-2 text-base font-black leading-snug">{place.name}</h2>
              <p className="mt-1 flex items-start gap-1 text-sm text-stone-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /><span className="line-clamp-2">{place.address}</span></p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-600">
                <span className="line-clamp-1" title={place.openingHours || 'Chưa có dữ liệu giờ mở cửa'}>{place.openingHours ? `Giờ mở cửa: ${place.openingHours}` : 'Giờ mở cửa: chưa có dữ liệu'}</span>
                {place.rating != null && <span>★ {place.rating}{place.reviewCount ? ` · ${place.reviewCount} đánh giá` : ''}</span>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-stone-100 pt-3">
                <div className="relative">
                  <button type="button" aria-expanded={detailsPlaceId === place.id} onClick={() => setDetailsPlaceId(detailsPlaceId === place.id ? '' : place.id)} className="cursor-pointer rounded-full px-3 py-2 text-xs font-bold text-stone-700 hover:bg-stone-100">Xem chi tiết</button>
                  {detailsPlaceId === place.id && <div className="absolute left-0 top-10 z-30 w-[min(360px,80vw)] rounded-xl border border-stone-200 bg-white p-4 text-xs shadow-xl">
                    {place.description && <p className="mb-3 leading-5 text-stone-700">{place.description}</p>}
                    <p className="font-bold">Nguồn thông tin</p><p className="mt-1 text-stone-600">{sourceName(place.dataSource)} · cập nhật {new Date(place.fetchedAt).toLocaleDateString('vi-VN')}</p><p className="mt-1 break-all text-stone-500">ID: {place.id}</p>
                    <a href={`https://www.openstreetmap.org/?mlat=${place.coordinates.lat}&mlon=${place.coordinates.lng}#map=17/${place.coordinates.lat}/${place.coordinates.lng}`} target="_blank" rel="noreferrer" className="mt-3 inline-block font-bold text-[#FF385C] underline">Mở vị trí trên bản đồ</a>
                    <button type="button" onClick={() => setDetailsPlaceId('')} aria-label="Đóng chi tiết địa điểm" className="absolute right-2 top-2 rounded p-1 hover:bg-stone-100"><X className="h-4 w-4" /></button>
                  </div>}
                </div>
                <button type="button" aria-expanded={replacingIndex === index} onClick={() => { setReplacingIndex(replacingIndex === index ? null : index); setReplaceQuery(''); }} className="rounded-full px-3 py-2 text-xs font-bold text-[#FF385C] hover:bg-rose-50">Thay địa điểm</button>
                <div className="relative ml-auto">
                  <button type="button" aria-label={`Thao tác với ${place.name}`} aria-expanded={actionMenuIndex === index} onClick={() => setActionMenuIndex(actionMenuIndex === index ? null : index)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-stone-100"><Ellipsis className="h-5 w-5" /></button>
                  {actionMenuIndex === index && <div className="absolute right-0 top-10 z-20 w-44 rounded-xl border border-stone-200 bg-white p-1 shadow-xl">
                    <button type="button" onClick={() => { move(index, -1); setActionMenuIndex(null); }} disabled={index === 0} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-stone-50 disabled:opacity-40"><ArrowUp className="h-4 w-4" />Đưa lên</button>
                    <button type="button" onClick={() => { move(index, 1); setActionMenuIndex(null); }} disabled={index === day.places.length - 1} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-stone-50 disabled:opacity-40"><ArrowDown className="h-4 w-4" />Đưa xuống</button>
                    <button type="button" onClick={() => { updatePlaces(day.places.filter(item => item.id !== place.id)); setActionMenuIndex(null); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" />Xóa điểm dừng</button>
                  </div>}
                </div>
              </div>
              {replacingIndex === index && <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50/50 p-3">
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" /><input autoFocus value={replaceQuery} onChange={event => setReplaceQuery(event.target.value)} placeholder="Tìm theo tên địa điểm" aria-label="Tìm địa điểm thay thế" className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-9 pr-10 text-sm outline-none focus:border-[#FF385C]" /><button type="button" aria-label="Đóng danh sách thay thế" onClick={() => setReplacingIndex(null)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 hover:bg-stone-100"><X className="h-4 w-4" /></button></div>
                <div className="mt-2 max-h-52 overflow-y-auto">{alternativesState === 'loading' && <p className="p-3 text-xs text-stone-500">Đang tải địa điểm...</p>}{alternativesState === 'error' && <p role="alert" className="p-3 text-xs text-rose-700">Không tải được dữ liệu địa điểm. Hãy thử lại.</p>}{alternativesState === 'ready' && matches(index).length === 0 && <p className="p-3 text-xs text-stone-500">Không có địa điểm phù hợp trong cùng nhóm hoạt động.</p>}{matches(index).map(option => <button key={option.id} type="button" onClick={() => replace(index, option.id)} className="block w-full rounded-lg p-2.5 text-left hover:bg-white focus-visible:outline-2 focus-visible:outline-[#FF385C]"><strong className="block text-sm">{option.name}</strong><span className="block truncate text-xs text-stone-500">{option.address} · {categoryName(option)}</span></button>)}</div>
              </div>}
            </article>
          </React.Fragment>)}
          {available.length > 0 && <label className="block rounded-2xl border border-dashed border-stone-300 p-4 text-xs font-bold">Thêm địa điểm từ dữ liệu<select value="" onChange={event => addPlace(event.target.value)} className="mt-2 w-full rounded-xl border border-stone-200 bg-white p-2.5 text-sm font-normal"><option value="">Chọn địa điểm</option>{available.slice(0, 100).map(option => <option key={option.id} value={option.id}>{option.name} — {option.address}</option>)}</select></label>}
        </section>
        <aside className={showMap ? 'block' : 'hidden lg:block'}><div className="sticky top-[calc(var(--site-header-height,100px)+16px)] overflow-hidden rounded-2xl border border-stone-200"><div className="border-b border-stone-200 p-3 text-sm font-bold">Bản đồ ngày {day.dayNumber}</div><div className="relative"><div ref={mapHost} className="h-[420px] w-full bg-stone-100 lg:h-[550px]" />{mapOffline && <p className="absolute bottom-3 left-3 right-3 z-[1000] rounded-lg bg-white/95 p-2 text-xs text-stone-700">Không tải được nền bản đồ. Các điểm dừng vẫn có tọa độ; dùng “Mở vị trí trên bản đồ” trong chi tiết địa điểm.</p>}</div></div></aside>
      </div>
    </div>
  </div>;
};
