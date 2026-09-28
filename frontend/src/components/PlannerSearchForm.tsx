import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Minus, Plus, SlidersHorizontal, Sparkles, Users, X } from 'lucide-react';
import { CITY_NAMES, SUPPORTED_CITIES, getCityTripPlaces, makeTrip, type Participants, type VerifiedTrip } from '../data/tripPlaces';

type Panel = 'destination' | 'dates' | 'guests' | null;
type CityOption = { id: string; name: string; count: number; sights: number; foods: number };
const MAX_DAYS = 7; // The previous planner exposed trips of up to seven days.
const MAX_GUESTS = 6; // The previous planner accepted at most six people.
const pad = (n: number) => String(n).padStart(2, '0');
const localISO = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const todayISO = () => localISO(new Date());
const dateUTC = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
const tripDays = (start: string, end: string) => Math.round((dateUTC(end) - dateUTC(start)) / 86400000) + 1;
const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi').replace(/[^a-z0-9]/g, '');
const displayDate = (iso: string) => { const [, month, day] = iso.split('-'); return `${day}/${month}`; };
const initialMonth = (iso: string) => { const [year, month] = iso.split('-').map(Number); return new Date(year, month - 1, 1); };
const addMonth = (date: Date, amount: number) => new Date(date.getFullYear(), date.getMonth() + amount, 1);
const aliases: Record<string, string[]> = { 'tp-hcm': ['Sài Gòn', 'Sai Gon', 'Ho Chi Minh', 'HCM'], 'da-nang': ['Danang'], 'ha-noi': ['Hanoi'], 'da-lat': ['Dalat'], 'sa-pa': ['Sapa'], 'nha-trang': ['Nhatrang'] };

export const PlannerSearchForm: React.FC<{ onPlan: (trip: VerifiedTrip) => void; preselectedCity?: string; cardSelection?: { id: string; sequence: number } | null; initialTrip?: VerifiedTrip | null; onCityChange?: (cityId: string) => void }> = ({ onPlan, preselectedCity, cardSelection, initialTrip, onCityChange }) => {
  const [cityId, setCityId] = useState(initialTrip?.cityId || (preselectedCity && CITY_NAMES[preselectedCity] ? preselectedCity : ''));
  const [query, setQuery] = useState(cityId ? CITY_NAMES[cityId] : '');
  const [startDate, setStartDate] = useState(initialTrip?.startDate || '');
  const [endDate, setEndDate] = useState(initialTrip?.endDate || (initialTrip?.schedule.at(-1)?.date || ''));
  const [participants, setParticipants] = useState<Participants>(initialTrip?.participants || { adults: initialTrip?.guests || 1, children: 0, infants: 0 });
  const [budget, setBudget] = useState(initialTrip?.budget?.toString() || '');
  const [interest, setInterest] = useState(initialTrip?.interest || '');
  const [pace, setPace] = useState(initialTrip?.pace || 'vừa phải');
  const [showOptions, setShowOptions] = useState(false);
  const [active, setActive] = useState<Panel>(null);
  const [month, setMonth] = useState(() => initialMonth(initialTrip?.startDate || todayISO()));
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dateError, setDateError] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLFormElement>(null);
  const triggerRefs = useRef<Record<Exclude<Panel, null>, HTMLButtonElement | null>>({ destination: null, dates: null, guests: null });
  const queryRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<Panel>(null);
  const submitLock = useRef(false);

  useEffect(() => {
    let alive = true;
    setLoadState('loading');
    Promise.allSettled(SUPPORTED_CITIES.map(async city => {
      const data = await getCityTripPlaces(city.id);
      if (!data) throw new Error(city.id);
      const sights = data.places.filter(p => p.categoryGroup === 'sightseeing' || p.categoryGroup === 'culture').length;
      const foods = data.places.filter(p => p.categoryGroup === 'food' || p.categoryGroup === 'cafe').length;
      return { ...city, count: data.places.length, sights, foods };
    })).then(results => {
      if (!alive) return;
      const loaded = results.filter((r): r is PromiseFulfilledResult<CityOption> => r.status === 'fulfilled').map(r => r.value).filter(c => c.sights > 0 && c.foods > 0);
      setCities(loaded);
      setLoadState(loaded.length ? 'ready' : 'error');
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (preselectedCity && CITY_NAMES[preselectedCity] && preselectedCity !== cityId) {
      setCityId(preselectedCity);
      setQuery(CITY_NAMES[preselectedCity]);
    }
  }, [preselectedCity]);
  useEffect(() => {
    if (cardSelection && CITY_NAMES[cardSelection.id]) {
      setCityId(cardSelection.id);
      setQuery(CITY_NAMES[cardSelection.id]);
    }
  }, [cardSelection?.sequence]);

  useEffect(() => {
    activeRef.current = active;
    if (!active) return;
    const timer = window.setTimeout(() => {
      if (active === 'destination') queryRef.current?.focus();
      else panelRef.current?.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [active]);

  const close = (restore = true) => {
    const previous = activeRef.current;
    activeRef.current = null;
    setActive(null);
    if (restore && previous) window.setTimeout(() => triggerRefs.current[previous]?.focus(), 0);
  };
  useEffect(() => {
    if (!active) return;
    const outside = (event: PointerEvent) => { if (!rootRef.current?.contains(event.target as Node)) close(); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); close(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [active]);

  const open = (panel: Exclude<Panel, null>) => { setError(''); if (active === panel) close(); else setActive(panel); };
  const chooseCity = (city: CityOption) => {
    setCityId(city.id); setQuery(city.name); onCityChange?.(city.id); setError(''); setActive('dates');
  };
  const shownCities = useMemo(() => cities.filter(city => !query || [city.name, ...(aliases[city.id] || [])].some(name => normalize(name).includes(normalize(query)))), [cities, query]);
  const selectedCity = cities.find(city => city.id === cityId);
  const maxDays = selectedCity ? Math.min(MAX_DAYS, Math.floor(selectedCity.sights / (pace === 'nhiều điểm' ? 2 : 1)), Math.floor(selectedCity.foods / (pace === 'thư thả' ? 1 : 2))) : MAX_DAYS;
  const chooseDate = (iso: string) => {
    if (!startDate || endDate || iso < startDate) { setStartDate(iso); setEndDate(''); setDateError(''); return; }
    const length = tripDays(startDate, iso);
    if (length > maxDays) { setDateError(`Lịch trình tại ${selectedCity?.name || 'điểm đến này'} hỗ trợ tối đa ${maxDays} ngày với nhịp độ đã chọn.`); return; }
    setEndDate(iso); setDateError('');
  };
  const total = participants.adults + participants.children + participants.infants;
  const changeCount = (key: keyof Participants, delta: number) => setParticipants(current => {
    const next = current[key] + delta;
    const currentTotal = current.adults + current.children + current.infants;
    if (next < (key === 'adults' ? 1 : 0) || currentTotal + delta > MAX_GUESTS) return current;
    return { ...current, [key]: next };
  });
  const validate = () => {
    if (loadState === 'loading') { setError('Đang tải dữ liệu điểm đến. Vui lòng thử lại sau giây lát.'); setActive('destination'); return false; }
    if (loadState === 'error') { setError('Không tải được dữ liệu điểm đến. Vui lòng tải lại trang hoặc thử lại sau.'); setActive('destination'); return false; }
    if (!cityId || !selectedCity || !CITY_NAMES[cityId]) { setError('Vui lòng chọn điểm đến trong danh sách gợi ý.'); setActive('destination'); return false; }
    if (!startDate || !endDate) { setError('Vui lòng chọn ngày đi và ngày về.'); setActive('dates'); return false; }
    if (startDate < todayISO() || endDate < startDate) { setError('Khoảng ngày không hợp lệ. Vui lòng chọn lại từ hôm nay.'); setActive('dates'); return false; }
    if (tripDays(startDate, endDate) > maxDays) { setError(`Lịch trình tại ${selectedCity.name} hỗ trợ tối đa ${maxDays} ngày với nhịp độ đã chọn.`); setActive('dates'); return false; }
    if (participants.adults < 1 || total > MAX_GUESTS) { setError(`Cần ít nhất 1 người lớn và tối đa ${MAX_GUESTS} người tham gia.`); setActive('guests'); return false; }
    if (budget && (!Number.isFinite(Number(budget)) || Number(budget) < 0)) { setError('Ngân sách không hợp lệ.'); setShowOptions(true); return false; }
    return true;
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitLock.current || !validate()) return;
    submitLock.current = true; setBusy(true); setError(''); close(false);
    try {
      const data = await getCityTripPlaces(cityId);
      if (!data) throw new Error(`Không tải được dữ liệu địa điểm ${CITY_NAMES[cityId]}. Vui lòng thử lại.`);
      const days = tripDays(startDate, endDate);
      const trip = makeTrip({ cityId, startDate, endDate, days, guests: total, participants, budget: budget ? Number(budget) : undefined, interest: interest || undefined, pace }, data.places);
      if (!trip) throw new Error(`Dữ liệu ${CITY_NAMES[cityId]} chưa đủ cho ${days} ngày với nhịp độ đã chọn. Hãy rút ngắn chuyến đi hoặc đổi nhịp độ.`);
      onPlan(trip);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tạo được lịch trình. Vui lòng thử lại.');
    } finally { submitLock.current = false; setBusy(false); }
  };
  const months = [month, addMonth(month, 1)];
  const calendar = (date: Date) => {
    const year = date.getFullYear(), monthNumber = date.getMonth();
    const offset = (new Date(year, monthNumber, 1).getDay() + 6) % 7;
    const count = new Date(year, monthNumber + 1, 0).getDate();
    return <div className="min-w-0 flex-1" key={`${year}-${monthNumber}`}>
      <h3 className="mb-4 text-center text-sm font-bold capitalize">{new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(date)}</h3>
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-neutral-500">{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => <span key={day} className="pb-2">{day}</span>)}</div>
      <div className="grid grid-cols-7 text-center">{Array.from({ length: offset }, (_, i) => <span key={`blank-${i}`} />)}{Array.from({ length: count }, (_, i) => {
        const iso = `${year}-${pad(monthNumber + 1)}-${pad(i + 1)}`;
        const edge = iso === startDate || iso === endDate;
        const middle = Boolean(startDate && endDate && iso > startDate && iso < endDate);
        return <button key={iso} type="button" disabled={iso < todayISO()} onClick={() => chooseDate(iso)} aria-label={new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(new Date(year, monthNumber, i + 1))} aria-pressed={edge} className={`h-10 w-full text-sm transition-colors focus-visible:outline-2 focus-visible:outline-[#FF385C] disabled:cursor-not-allowed disabled:text-neutral-300 ${middle ? 'bg-rose-50' : ''} ${edge ? 'rounded-full bg-[#FF385C] font-bold text-white' : 'hover:rounded-full hover:bg-rose-100'}`}>{i + 1}</button>;
      })}</div>
    </div>;
  };
  return <form ref={rootRef} onSubmit={submit} className={`planner-form relative mx-auto mt-9 max-w-[1100px] scroll-mt-28 ${active ? 'z-[100]' : 'z-20'}`}>
    <div className="planner-bar">
      <button ref={el => { triggerRefs.current.destination = el; }} type="button" aria-expanded={active === 'destination'} aria-controls="planner-destination" onClick={() => open('destination')} className={`planner-field ${active === 'destination' ? 'planner-field-active' : ''}`}><MapPin aria-hidden="true" className="planner-icon" /><span className="min-w-0"><strong>Điểm đến</strong><span className="planner-value">{cityId ? CITY_NAMES[cityId] : 'Bạn muốn đi đâu?'}</span></span></button>
      <button ref={el => { triggerRefs.current.dates = el; }} type="button" aria-expanded={active === 'dates'} aria-controls="planner-dates" onClick={() => open('dates')} className={`planner-field ${active === 'dates' ? 'planner-field-active' : ''}`}><CalendarDays aria-hidden="true" className="planner-icon" /><span className="min-w-0"><strong>Thời gian</strong><span className="planner-value">{startDate ? `${displayDate(startDate)}${endDate ? ` – ${displayDate(endDate)}` : ' – Chọn ngày về'}${endDate && startDate.slice(0, 4) !== endDate.slice(0, 4) ? ` ${endDate.slice(0, 4)}` : ''}` : 'Chọn ngày đi – ngày về'}</span></span></button>
      <button ref={el => { triggerRefs.current.guests = el; }} type="button" aria-expanded={active === 'guests'} aria-controls="planner-guests" onClick={() => open('guests')} className={`planner-field ${active === 'guests' ? 'planner-field-active' : ''}`}><Users aria-hidden="true" className="planner-icon" /><span className="min-w-0"><strong>Người tham gia</strong><span className="planner-value"><span className="planner-guests-full">{participants.adults} người lớn{participants.children ? `, ${participants.children} trẻ em` : ''}{participants.infants ? `, ${participants.infants} em bé` : ''}</span><span className="planner-guests-short">{total} người</span></span></span></button>
      <button type="submit" disabled={busy} className="planner-submit"><Sparkles className="h-5 w-5 shrink-0" aria-hidden="true" />{busy ? 'Đang tạo lịch trình' : 'Tạo lịch trình'}</button>
    </div>
    {active && <div className="planner-backdrop" onClick={() => close()} aria-hidden="true" />}
    {active === 'destination' && <div ref={panelRef} id="planner-destination" role="dialog" aria-label="Chọn điểm đến" className="planner-panel planner-destination">
      <div className="planner-mobile-head"><strong>Điểm đến</strong><button type="button" aria-label="Đóng" onClick={() => close()}><X /></button></div>
      <label className="block text-xs font-bold">Tìm điểm đến<input ref={queryRef} value={query} onChange={e => { setQuery(e.target.value); if (e.target.value !== CITY_NAMES[cityId]) { setCityId(''); onCityChange?.(''); } }} placeholder="Bạn muốn đi đâu?" className="mt-2 w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium outline-none focus:border-[#FF385C]" /></label>
      <h3 className="mt-5 text-sm font-bold">Điểm đến được đề xuất</h3>
      <div className="mt-2 max-h-72 overflow-y-auto">{loadState === 'loading' && <p role="status" className="p-3 text-sm text-neutral-500">Đang tải điểm đến...</p>}{loadState === 'error' && <p role="alert" className="p-3 text-sm text-rose-700">Không tải được dữ liệu điểm đến. Vui lòng tải lại trang hoặc thử lại sau.</p>}{loadState === 'ready' && !shownCities.length && <p className="p-3 text-sm text-neutral-500">Không có điểm đến phù hợp.</p>}{shownCities.map(city => <button key={city.id} type="button" onClick={() => chooseCity(city)} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-[#FF385C]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-[#FF385C]"><MapPin className="h-5 w-5" /></span><span><strong className="block text-sm">{city.name}</strong><small className="text-neutral-500">{city.count} địa điểm trong dữ liệu VietGo</small></span></button>)}</div>
    </div>}
    {active === 'dates' && <div ref={panelRef} id="planner-dates" role="dialog" aria-label="Chọn thời gian" className="planner-panel planner-dates">
      <div className="planner-mobile-head"><strong>Thời gian</strong><button type="button" aria-label="Đóng" onClick={() => close()}><X /></button></div>
      <div className="mb-4 flex items-center justify-between"><button type="button" aria-label="Tháng trước" disabled={localISO(month) <= todayISO().slice(0, 7) + '-01'} onClick={() => setMonth(addMonth(month, -1))} className="planner-month-button"><ChevronLeft className="h-5 w-5" /></button><p className="text-xs text-neutral-500">Chọn ngày đi, sau đó chọn ngày về</p><button type="button" aria-label="Tháng sau" onClick={() => setMonth(addMonth(month, 1))} className="planner-month-button"><ChevronRight className="h-5 w-5" /></button></div>
      <div className="flex gap-8">{months.map((date, index) => <div key={index} className={index ? 'planner-second-month min-w-0 flex-1' : 'min-w-0 flex-1'}>{calendar(date)}</div>)}</div>
      {dateError && <p role="alert" className="mt-3 text-xs font-semibold text-rose-700">{dateError}</p>}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-neutral-100 pt-4"><span className="text-sm font-semibold">{startDate && endDate ? `${tripDays(startDate, endDate)} ngày, ${tripDays(startDate, endDate) - 1} đêm` : startDate ? 'Chọn ngày về (có thể cùng ngày)' : `Tối đa ${maxDays} ngày`}</span><div className="flex gap-2"><button type="button" onClick={() => { setStartDate(''); setEndDate(''); setDateError(''); }} className="rounded-full px-3 py-2 text-xs font-bold underline">Xóa ngày</button><button type="button" onClick={() => close()} disabled={!startDate || !endDate} className="rounded-full bg-[#FF385C] px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Áp dụng</button></div></div>
    </div>}
    {active === 'guests' && <div ref={panelRef} id="planner-guests" role="dialog" aria-label="Chọn người tham gia" className="planner-panel planner-participants">
      <div className="planner-mobile-head"><strong>Người tham gia</strong><button type="button" aria-label="Đóng" onClick={() => close()}><X /></button></div>
      {([['adults', 'Người lớn', 'Từ 13 tuổi trở lên'], ['children', 'Trẻ em', 'Từ 2–12 tuổi'], ['infants', 'Em bé', 'Dưới 2 tuổi']] as const).map(([key, label, description]) => <div key={key} className="flex items-center justify-between gap-3 border-b border-neutral-100 py-4"><div><strong className="text-sm">{label}</strong><p className="text-xs text-neutral-500">{description}</p></div><div className="flex items-center gap-3"><button type="button" aria-label={`Giảm ${label}`} disabled={participants[key] <= (key === 'adults' ? 1 : 0)} onClick={() => changeCount(key, -1)} className="planner-count-button"><Minus className="h-4 w-4" /></button><output className="w-5 text-center text-sm font-semibold">{participants[key]}</output><button type="button" aria-label={`Tăng ${label}`} disabled={total >= MAX_GUESTS} onClick={() => changeCount(key, 1)} className="planner-count-button"><Plus className="h-4 w-4" /></button></div></div>)}
      <p className="mt-3 text-xs text-neutral-500">Tối đa {MAX_GUESTS} người tham gia. Chưa tính giá riêng theo độ tuổi.</p><div className="mt-5 text-right"><button type="button" onClick={() => close()} className="rounded-full bg-[#FF385C] px-6 py-2.5 text-sm font-bold text-white">Xong</button></div>
    </div>}
    <div className="mt-3 px-3"><button type="button" aria-expanded={showOptions} aria-controls="trip-options" onClick={() => setShowOptions(!showOptions)} className="flex items-center gap-2 rounded-full px-2 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"><SlidersHorizontal className="h-4 w-4" />Thêm ngân sách, sở thích và nhịp độ</button>{showOptions && <div id="trip-options" className="mt-3 grid gap-4 rounded-2xl border border-neutral-200 bg-white p-4 sm:grid-cols-3"><label className="text-xs font-bold">Ngân sách dự kiến (VNĐ)<input type="number" min="0" value={budget} onChange={e => setBudget(e.target.value)} placeholder="Chưa xác định" className="mt-2 w-full rounded-xl border border-neutral-200 p-3 text-sm font-medium focus:border-[#FF385C] focus:outline-none" /><span className="mt-1 block font-normal leading-5 text-neutral-500">Chi phí thiếu dữ liệu giá sẽ không được tính.</span></label><label className="text-xs font-bold">Sở thích<select value={interest} onChange={e => setInterest(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 p-3 text-sm font-medium"><option value="">Đa dạng</option><option value="culture">Văn hóa</option><option value="sightseeing">Danh thắng</option><option value="food">Ẩm thực</option></select></label><label className="text-xs font-bold">Nhịp độ<select value={pace} onChange={e => setPace(e.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 p-3 text-sm font-medium"><option>thư thả</option><option>vừa phải</option><option>nhiều điểm</option></select></label></div>}</div>
    {error && <p role="alert" className="mx-3 mt-3 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-700">{error}</p>}
  </form>;
};
