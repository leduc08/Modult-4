import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { CITY_NAMES, SUPPORTED_CITIES, getCityTripPlaces, type TripPlace } from '../data/tripPlaces';
import type { DetailItem } from './ItemDetailModal';
import { formatManagedPrice } from '../data/places';

const sourceLabel = (source: TripPlace['dataSource']) => source === 'admin' ? 'VietGo' : source === 'osm' ? 'OpenStreetMap' : source === 'foursquare' ? 'Foursquare' : 'Foursquare + OpenStreetMap';

export const VerifiedExplorePage: React.FC<{ onPlanCity: (cityId: string) => void; onSelectItem: (item: DetailItem) => void }> = ({ onPlanCity, onSelectItem }) => {
  const [cityId, setCityId] = useState('da-nang');
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('all');
  const [places, setPlaces] = useState<TripPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadedAt, setLoadedAt] = useState('');
  useEffect(() => {
    let active = true;
    setLoading(true);
    getCityTripPlaces(cityId).then(data => {
      if (!active) return;
      setPlaces(data?.places || []);
      setLoadedAt(data?.fetchedAt || '');
      setLoading(false);
    });
    return () => { active = false; };
  }, [cityId]);
  const visible = places.filter(p => (group === 'all' || p.categoryGroup === group) && (!query || `${p.name} ${p.address} ${p.categoryLabel}`.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi')))).slice(0, 40);
  const open = (place: TripPlace) => onSelectItem({
    itemType: 'poi', id: place.id, name: place.name, category: place.categoryLabel as any,
    coordinates: place.coordinates, address: place.address, openingHours: place.openingHours || '',
    ticketPrice: undefined, publicPriceLabel: formatManagedPrice(place.price), estimatedTime: '', description: `${place.description || 'Chưa có mô tả.'} Nguồn: ${sourceLabel(place.dataSource)}. Dữ liệu cập nhật: ${new Date(place.fetchedAt).toLocaleDateString('vi-VN')}.`,
    imageUrl: place.isPlaceholderImage ? '' : place.imageUrl || '', tags: place.tags, localTips: '', rating: place.rating, reviewCount: place.reviewCount,
    dataSource: place.dataSource, isPlaceholderImage: place.isPlaceholderImage,
  } as DetailItem);
  return <div className="mx-auto max-w-6xl px-4 py-8 text-[#222222]">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black">Khám phá điểm đến</h1><p className="mt-1 text-sm text-stone-600">Tìm cảm hứng từ các địa điểm đã lưu trong dữ liệu VietGo.</p></div><button onClick={() => onPlanCity(cityId)} className="rounded-full bg-[#FF385C] px-5 py-2.5 text-sm font-bold text-white">Lên lịch trình đến đây →</button></div>
    <div className="mt-6 grid gap-3 sm:grid-cols-[200px_1fr]"><label className="text-xs font-bold">Khu vực<select value={cityId} onChange={e => setCityId(e.target.value)} className="mt-1 w-full rounded-xl border border-stone-200 p-3 text-sm">{SUPPORTED_CITIES.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}</select></label><label className="text-xs font-bold">Tìm địa điểm<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Tên địa điểm hoặc địa chỉ" className="mt-1 w-full rounded-xl border border-stone-200 p-3 text-sm" /></label></div>
    <div className="mt-4 flex flex-wrap gap-2">{[['all', 'Tất cả'], ['sightseeing', 'Danh thắng'], ['culture', 'Văn hóa'], ['food', 'Ẩm thực'], ['cafe', 'Cà phê']].map(([id, name]) => <button key={id} onClick={() => setGroup(id)} className={`rounded-full px-4 py-2 text-xs font-bold ${group === id ? 'bg-[#222222] text-white' : 'bg-stone-100 text-stone-600'}`}>{name}</button>)}</div>
    <p className="my-5 text-xs text-stone-500">{loading ? 'Đang tải địa điểm...' : `${places.length} địa điểm có tên, địa chỉ và tọa độ • cập nhật ${loadedAt ? new Date(loadedAt).toLocaleDateString('vi-VN') : 'chưa rõ'}`} • Giá, giờ mở cửa và đánh giá chỉ hiện khi có dữ liệu.</p>
    {!loading && visible.length === 0 && <p className="rounded-xl bg-rose-50 p-5 text-sm">Chưa có địa điểm phù hợp ở {CITY_NAMES[cityId]}. Hãy chọn khu vực hoặc danh mục khác.</p>}
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{visible.map(place => <article key={place.id} className="overflow-hidden rounded-2xl border border-stone-200"><div className="flex aspect-[4/3] items-center justify-center overflow-hidden bg-rose-50 text-center text-xs font-semibold text-rose-700">{place.imageUrl && !place.isPlaceholderImage ? <img src={place.imageUrl} alt={place.name} className="h-full w-full object-cover" /> : <><MapPin className="mr-2 h-5 w-5" />Chưa có ảnh địa điểm</>}</div><div className="space-y-2 p-4"><p className="text-[11px] font-bold text-[#FF385C]">{place.categoryLabel}</p><h2 className="font-bold">{place.name}</h2><p className="line-clamp-2 text-xs text-stone-600">{place.address}</p><p className="text-xs text-stone-500">{place.openingHours ? `Giờ: ${place.openingHours}` : 'Giờ mở cửa: chưa có'} • Giá: ${formatManagedPrice(place.price) || 'chưa có'}</p><button onClick={() => open(place)} className="text-xs font-bold text-[#FF385C] underline">Xem chi tiết và bản đồ</button></div></article>)}</div>
  </div>;
};
