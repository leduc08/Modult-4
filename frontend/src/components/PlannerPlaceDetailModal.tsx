import React, { useEffect, useRef } from 'react';
import { Clock, ExternalLink, MapPin, Ticket, X } from 'lucide-react';
import { activityCost } from '../data/plannerPricing';
import { openingCompatibility, type Participants, type TripPlace } from '../data/tripPlaces';

const isFood = (place: TripPlace) => place.categoryGroup === 'food' || place.categoryGroup === 'cafe';
const durationOf = (place: TripPlace) => place.plannedDurationMinutes || (place.categoryGroup === 'cafe' ? 60 : isFood(place) ? 75 : 120);
const startOf = (place: TripPlace) => place.plannedStartTime || '09:00';
const timeSlots = Array.from({ length: 28 }, (_, index) => {
  const minutes = 7 * 60 + index * 30;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

export const PlannerPlaceDetailModal: React.FC<{
  place: TripPlace | null;
  date?: string;
  participants?: Participants;
  onClose: () => void;
  onEdit: (patch: Partial<TripPlace>) => void;
}> = ({ place, date, participants, onClose, onEdit }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!place) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', onKeyDown); };
  }, [place?.id]);
  if (!place) return null;

  const cost = activityCost(place, participants);
  const image = place.imageUrl && !place.isPlaceholderImage ? place.imageUrl : isFood(place) ? '/images/food-placeholder.svg' : '/images/place-placeholder.svg';
  const fallback = isFood(place) ? '/images/food-placeholder.svg' : '/images/place-placeholder.svg';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address}`)}`;
  const hours = openingCompatibility(place.openingHours, startOf(place), durationOf(place), date, place.weeklyHours);

  return <div role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }} className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-stone-900/60 p-0 backdrop-blur-sm sm:p-4">
    <div role="dialog" aria-modal="true" aria-label={`Chi tiết ${place.name}`} className="relative my-auto flex max-h-[100dvh] min-h-[100dvh] w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl sm:max-h-[90dvh] sm:min-h-0 sm:rounded-3xl">
      <div className="flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-5 py-4 sm:px-8"><span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-bold">{isFood(place) ? 'Ẩm thực & cà phê' : 'Điểm tham quan'}</span><button ref={closeRef} type="button" onClick={onClose} aria-label="Đóng chi tiết" className="rounded-full p-2 hover:bg-stone-100"><X className="h-5 w-5" /></button></div>
      <div className="space-y-6 overflow-y-auto p-5 sm:p-8">
        <div><h2 className="text-2xl font-black text-[#222] sm:text-3xl">{place.name}</h2><p className="mt-2 flex items-start gap-2 text-sm text-stone-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#ff385c]" />{place.address}</p></div>
        <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-rose-50 sm:aspect-[21/9]"><img src={image} onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = fallback; }} alt={place.imageUrl && !place.isPlaceholderImage ? place.name : 'Ảnh minh họa địa điểm'} className="h-full w-full object-cover" /></div>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(240px,1fr)]"><div className="space-y-7">
          <section><h3 className="border-b border-stone-200 pb-2 text-lg font-bold">Giới thiệu</h3><p className="mt-3 text-sm leading-6 text-stone-700">{place.description || 'Chưa có mô tả cho địa điểm này.'}</p>{Boolean(place.tags?.length) && <div className="mt-3 flex flex-wrap gap-2">{place.tags.map(tag => <span key={tag} className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold">#{tag}</span>)}</div>}</section>
          <section><h3 className="border-b border-stone-200 pb-2 text-lg font-bold">Thông tin tham quan & trải nghiệm</h3><div className="mt-3 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-stone-200 bg-stone-50 p-4"><p className="flex items-center gap-2 text-sm font-bold"><Clock className="h-4 w-4" />Giờ mở cửa</p><p className="mt-1 text-sm text-stone-600">{place.openingHours || 'Chưa có — cần kiểm tra trước khi đi'}</p></div><div className="rounded-2xl border border-stone-200 bg-stone-50 p-4"><p className="flex items-center gap-2 text-sm font-bold"><Ticket className="h-4 w-4" />Chi phí tham khảo</p><p className="mt-1 text-sm text-stone-600">{cost.badge}</p></div></div>{hours === 'closed' && <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Giờ ghé dự kiến nằm ngoài giờ mở cửa đã biết. Hãy chỉnh lại giờ hoặc kiểm tra với địa điểm.</p>}{cost.incomplete && <p className="mt-3 text-xs leading-5 text-stone-600">Chi phí thực tế chưa đủ dữ liệu để xác định cho cả nhóm; giá thiếu không được tính là miễn phí.</p>}</section>
          <section><h3 className="border-b border-stone-200 pb-2 text-lg font-bold">Vị trí</h3><div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4"><p className="flex min-w-0 items-start gap-2 text-sm"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#ff385c]" />{place.address}</p><a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-[#d20a45] hover:underline">Mở Google Maps <ExternalLink className="h-4 w-4" /></a></div></section>
        </div><aside className="self-start rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:sticky lg:top-0"><p className="text-xs font-bold uppercase tracking-wide text-stone-500">Trong lịch trình</p><p className="mt-2 text-lg font-black">{startOf(place)} · {durationOf(place)} phút</p><p className="mt-1 text-xs text-stone-500">Khung giờ dự kiến, không phải giờ mở cửa đã xác minh.</p><div className="mt-4 space-y-3"><label className="block text-xs font-bold">Giờ ghé dự kiến<select value={startOf(place)} onChange={event => onEdit({ plannedStartTime: event.target.value })} className="mt-1 block w-full rounded-xl border border-stone-200 bg-white p-2 text-sm font-medium">{timeSlots.map(time => <option key={time}>{time}</option>)}</select></label><label className="block text-xs font-bold">Thời lượng dự kiến (phút)<input type="number" min={15} max={480} step={15} value={durationOf(place)} onChange={event => onEdit({ plannedDurationMinutes: Math.max(15, Math.min(480, Number(event.target.value) || 15)) })} className="mt-1 block w-full rounded-xl border border-stone-200 bg-white p-2 text-sm font-medium" /></label></div></aside></div>
      </div>
    </div>
  </div>;
};
