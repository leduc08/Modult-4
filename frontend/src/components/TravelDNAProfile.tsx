import React, { useState } from 'react';
import { 
  UserCheck, 
  Sparkles, 
  Heart, 
  MapPin, 
  UtensilsCrossed, 
  Compass, 
  ShieldCheck, 
  Save,
  CheckCircle2,
  Award
} from 'lucide-react';
import { UserProfile, TravelStyle } from '@db/types';

export const TravelDNAProfile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({
    id: 'user-default',
    name: 'Nguyễn Văn An',
    email: 'traveler@vietgo.ai',
    primaryStyle: 'Foodie & Ẩm thực',
    dietaryRestrictions: ['Ăn cay vừa', 'Không ăn nội tạng'],
    preferredPace: 'balanced',
    visitedProvinces: ['hanoi', 'da-nang', 'quang-nam'],
    savedItems: ['poi-1', 'poi-3', 'food-1']
  });

  const [isSaved, setIsSaved] = useState(false);

  const styleList: TravelStyle[] = [
    'Foodie & Ẩm thực',
    'Nghỉ dưỡng & Chill',
    'Phượt & Khám phá',
    'Văn hóa & Di sản',
    'Sống ảo & Check-in',
    'Gia đình & Trẻ nhỏ'
  ];

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center text-white text-2xl font-black shadow-md">
            VA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-stone-900">{profile.name}</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                Thành viên Tiên phong
              </span>
            </div>
            <p className="text-xs text-stone-500">{profile.email} • Đã mở khóa 3/34 Tỉnh thành</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
        >
          {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          <span>{isSaved ? 'Đã lưu cấu hình DNA!' : 'Lưu hồ sơ du lịch'}</span>
        </button>
      </div>

      {/* DNA Settings Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
        <div className="space-y-1 border-b border-stone-100 pb-3">
          <h2 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-red-600" />
            <span>Gen Du Lịch (Travel DNA Preferences)</span>
          </h2>
          <p className="text-xs text-stone-500">
            VietGo AI dựa vào các thông số này để tự động lọc quán ăn không phù hợp và điều chỉnh nhịp độ lịch trình cho riêng bạn.
          </p>
        </div>

        {/* Primary Style */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
            Phong cách du lịch chủ đạo
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {styleList.map((st) => (
              <button
                key={st}
                onClick={() => setProfile({ ...profile, primaryStyle: st })}
                className={`p-3 rounded-xl text-xs font-bold text-left border transition-all cursor-pointer ${
                  profile.primaryStyle === st
                    ? 'bg-red-50 text-red-700 border-red-300 ring-1 ring-red-400'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Pace */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
            Nhịp độ di chuyển (Pace)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'relaxed', label: 'Thong thả & Nghỉ ngơi', desc: '1-2 điểm/ngày' },
              { id: 'balanced', label: 'Cân bằng (Tiêu chuẩn)', desc: '3-4 điểm/ngày' },
              { id: 'intensive', label: 'Năng động & Check-in nhiều', desc: '5-6 điểm/ngày' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setProfile({ ...profile, preferredPace: p.id as any })}
                className={`p-3 rounded-xl text-xs text-left border transition-all cursor-pointer ${
                  profile.preferredPace === p.id
                    ? 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-400'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                }`}
              >
                <div className="font-bold">{p.label}</div>
                <div className="text-[10px] text-stone-500">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Dietary */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-stone-600">
            Khẩu vị & Dị ứng ẩm thực
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              'Ăn chay (Vegetarian)',
              'Ăn cay ít / Không ớt',
              'Không ăn ngò / rau thơm',
              'Dị ứng hải sản vỏ cứng',
              'Không ăn bột ngọt (Mì chính)',
              'Thích ăn cay nồng chuẩn Huế'
            ].map((diet) => {
              const isChecked = profile.dietaryRestrictions.includes(diet);
              return (
                <button
                  key={diet}
                  onClick={() => {
                    const newDiet = isChecked
                      ? profile.dietaryRestrictions.filter(d => d !== diet)
                      : [...profile.dietaryRestrictions, diet];
                    setProfile({ ...profile, dietaryRestrictions: newDiet });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  {diet}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
