import React, { useRef, useState } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { CITY_NAMES, SUPPORTED_CITIES, type VerifiedTrip } from '../data/tripPlaces';
import { PlannerSearchForm } from './PlannerSearchForm';

const cityPhotos: Record<string, string> = {
  'ha-noi': '/images/cities/ha-noi.jpg',
  'da-nang': '/images/cities/da-nang.jpg',
  'hue': '/images/cities/hue.jpg',
  'ninh-binh': '/images/cities/ninh-binh.jpg',
  'da-lat': '/images/cities/da-lat.jpg',
};

const CityPhoto: React.FC<{ cityId: string; name: string }> = ({ cityId, name }) => {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-rose-50"><div className="flex items-center gap-2 text-sm text-rose-700"><MapPin className="h-5 w-5" />{cityPhotos[cityId] && !failed ? 'Đang tải ảnh...' : 'Chưa có ảnh xác thực'}</div>{cityPhotos[cityId] && !failed && <img src={cityPhotos[cityId]} alt={name} className={`absolute inset-0 h-full w-full object-cover ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}</div>;
};

export const PlannerHome: React.FC<{ onPlan: (trip: VerifiedTrip) => void; savedTrip: VerifiedTrip | null; onContinue: () => void; preselectedCity?: string; initialTrip?: VerifiedTrip | null }> = ({ onPlan, savedTrip, onContinue, preselectedCity, initialTrip }) => {
  const formRef = useRef<HTMLDivElement>(null);
  const [cityId, setCityId] = useState(initialTrip?.cityId || (preselectedCity && CITY_NAMES[preselectedCity] ? preselectedCity : ''));
  const [cardSelection, setCardSelection] = useState<{ id: string; sequence: number } | null>(null);

  return <div className="min-h-screen bg-[#F7F7F7] text-[#222222]">
    <section className="border-b border-[#EBEBEB] bg-white px-4 pb-10 pt-10 sm:pb-14 sm:pt-14">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#FF385C]">Khám phá Việt Nam cùng VietGo</p>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Chuyến đi tiếp theo của bạn bắt đầu ở đâu?</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-[#717171] sm:text-base">Chọn nơi bạn muốn đến và vài thông tin cơ bản. VietGo sẽ gợi ý lịch trình phù hợp cho từng ngày.</p>
        </div>
        <div ref={formRef}><PlannerSearchForm onPlan={onPlan} preselectedCity={cityId} cardSelection={cardSelection} initialTrip={initialTrip} onCityChange={setCityId} /></div>
      </div>
    </section>

    <div className="mx-auto max-w-6xl space-y-10 px-4 py-10">
      {savedTrip && <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#DDDDDD] bg-white p-5"><div><p className="mb-1 text-xs font-bold uppercase tracking-wide text-[#FF385C]">Đã lưu gần đây</p><h2 className="font-bold">Tiếp tục lịch trình của bạn</h2><p className="mt-1 text-sm text-[#717171]">{CITY_NAMES[savedTrip.cityId]} • {savedTrip.days} ngày • {savedTrip.guests} người</p></div><button onClick={onContinue} className="flex items-center gap-2 rounded-full border border-[#222222] px-5 py-2.5 text-sm font-bold hover:bg-[#F7F7F7]">Xem lịch trình<ArrowRight className="h-4 w-4" /></button></section>}
      <section>
        <h2 className="text-2xl font-extrabold">Khám phá điểm đến</h2>
        <p className="mb-6 mt-1 text-sm text-[#717171]">Chọn một nơi để bắt đầu lên kế hoạch cho chuyến đi.</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{SUPPORTED_CITIES.map(city => <button key={city.id} type="button" aria-pressed={cityId === city.id} onClick={() => { setCityId(city.id); setCardSelection(previous => ({ id: city.id, sequence: (previous?.sequence || 0) + 1 })); formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} className={`group overflow-hidden rounded-2xl border bg-white text-left transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF385C] ${cityId === city.id ? 'border-[#222222] shadow-md' : 'border-[#DDDDDD]'}`}><CityPhoto cityId={city.id} name={city.name} /><div className="flex items-center justify-between gap-2 p-4"><span className="font-bold">{city.name}</span><ArrowRight className="h-4 w-4 text-[#FF385C] transition-transform group-hover:translate-x-1" aria-hidden="true" /></div></button>)}</div>
      </section>
      <p className="text-xs leading-5 text-[#717171]">Địa điểm lấy từ dữ liệu Foursquare và OpenStreetMap đã tải về. Thông tin còn thiếu sẽ được hiển thị rõ trong lịch trình. <a href="/image-credits.html" className="underline hover:text-[#222222]">Nguồn ảnh</a></p>
    </div>
  </div>;
};
