import React, { useState } from 'react';
import { 
  ShieldAlert, 
  HelpCircle, 
  Search, 
  Plane, 
  Package, 
  CheckCircle2, 
  AlertTriangle, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  Sparkles,
  PhoneCall,
  Gift
} from 'lucide-react';
import { ALL_TIPS, PROVINCES } from '@db/vietnamData';
import { TravelTip, SouvenirItem } from '@db/types';

interface TipsAndSouvenirsProps {
  onOpenSOS: () => void;
}

export const TipsAndSouvenirs: React.FC<TipsAndSouvenirsProps> = ({ onOpenSOS }) => {
  const [activeTab, setActiveTab] = useState<'tips' | 'souvenirs' | 'airline_rules'>('tips');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Collect souvenirs from all provinces
  const allSouvenirs: (SouvenirItem & { provinceName: string })[] = [];
  PROVINCES.forEach(p => {
    p.souvenirs.forEach(s => {
      allSouvenirs.push({ ...s, provinceName: p.name });
    });
  });

  const categories = [
    { id: 'all', label: 'Tất cả (400+ Tips)' },
    { id: 'an_toan', label: '🛡️ An toàn & Chống lừa đảo' },
    { id: 'tai_chinh', label: '💵 Tài chính & Tránh chặt chém' },
    { id: 'hang_khong', label: '✈️ Quy định Hàng không' },
    { id: 'thoi_tiet', label: '⛅ Mùa & Thời tiết' },
    { id: 'am_thuc', label: '🍲 Thưởng thức Ẩm thực' },
    { id: 'van_hoa', label: '🏛️ Văn hóa & Kiêng kỵ' }
  ];

  const filteredTips = ALL_TIPS.filter(t => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.content.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kho Bách Khoa Cẩm Nang Thực Chiến</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
            400+ Tips Sinh Tồn, Quà OCOP & Quy Định Hàng Không
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
            Tra cứu các kinh nghiệm du lịch thực tế, mẹo trả giá, quy định ký gửi chất lỏng (nước mắm), nông sản tươi và các số điện thoại khẩn cấp tại Việt Nam.
          </p>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('tips')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
              activeTab === 'tips'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            💡 400+ Mẹo Du Lịch
          </button>
          <button
            onClick={() => setActiveTab('souvenirs')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
              activeTab === 'souvenirs'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            🎁 Quà Tặng & OCOP Bản Địa
          </button>
          <button
            onClick={() => setActiveTab('airline_rules')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-colors cursor-pointer ${
              activeTab === 'airline_rules'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            ✈️ Quy Định Hàng Không Đặc Thù
          </button>
        </div>

        <button
          onClick={onOpenSOS}
          className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 cursor-pointer bg-red-50 px-3 py-1.5 rounded-lg border border-red-200"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Hotline Cứu Hộ</span>
        </button>
      </div>

      {/* 1. TIPS TAB */}
      {activeTab === 'tips' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex-1 min-w-[240px] max-w-md relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm mẹo (nước mắm, taxi, giá vé, bão lũ...)"
                  className="w-full pl-8 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:outline-hidden focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="text-xs text-stone-500 font-medium">
                Tìm thấy <strong className="text-stone-800">{filteredTips.length}</strong> mẹo hữu ích
              </div>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-red-600 text-white shadow-2xs'
                      : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tips Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTips.map((tip) => (
              <div
                key={tip.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs hover:shadow-xs hover:border-red-200 transition-all space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-bold uppercase tracking-wide">
                      {tip.category.replace('_', ' ')}
                    </span>
                    {tip.isSafetyAlert && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Cảnh báo an toàn</span>
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-sm text-stone-900 leading-snug">
                    {tip.title}
                  </h3>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {tip.content}
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap gap-1 border-t border-stone-100">
                  {tip.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="text-[10px] text-stone-500 bg-stone-50 px-2 py-0.5 rounded-md font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. SOUVENIRS TAB */}
      {activeTab === 'souvenirs' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {allSouvenirs.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 text-[10px] font-bold">
                      {item.provinceName}
                    </span>
                    <span className="text-xs font-bold text-stone-800">{item.standardPrice}</span>
                  </div>

                  <h3 className="font-extrabold text-sm text-stone-900">{item.name}</h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    Hạn dùng: {item.shelfLife} {item.isOCOP && `• Đạt chuẩn OCOP ⭐⭐⭐`}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
                  <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60 space-y-1">
                    <div className="font-bold text-[11px] text-stone-800 flex items-center gap-1">
                      <Plane className="w-3 h-3 text-indigo-600" />
                      <span>Quy định mang lên máy bay:</span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-normal">
                      <strong>{item.flightRule}</strong> — {item.flightNote}
                    </p>
                  </div>

                  <div className="text-[11px] text-stone-500">
                    <span className="font-semibold text-stone-700">Nơi mua uy tín: </span>
                    {item.trustedAddresses.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. AIRLINE RULES TAB */}
      {activeTab === 'airline_rules' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
          <div className="space-y-2">
            <h2 className="font-extrabold text-lg text-stone-900">
              Quy Định Hành Lý Đặc Thù Khi Bay Nội Địa & Quốc Tế Tại Việt Nam
            </h2>
            <p className="text-xs text-stone-500">
              Tổng hợp từ Vietnam Airlines, Vietjet Air, Bamboo Airways & Cục Hàng không Việt Nam (CAAV).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Nước mắm & Chất lỏng có mùi (Phú Quốc, Phan Thiết)</span>
              </div>
              <ul className="text-xs text-amber-950 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li><strong>Nghiêm cấm xách tay vào cabin</strong> trên tất cả các hãng hàng không.</li>
                <li><strong>Chỉ chấp nhận ký gửi</strong> với điều kiện: Đựng trong chai nhựa/thủy tinh chắc chắn, bọc băng dính kín miệng và đặt bên trong <strong>thùng xốp niêm phong</strong> (dán kín bằng băng dính).</li>
                <li>Mỗi hành khách thông thường được gửi tối đa 3-5 lít tùy quy định từng hãng.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-red-50/80 border border-red-200/80 space-y-2">
              <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Sầu riêng, Mít & Thực phẩm nặng mùi</span>
              </div>
              <ul className="text-xs text-red-950 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li><strong>Tuyệt đối cấm mang nguyên quả tươi hoặc múi sầu riêng/mít xách tay</strong> vào khoang hành khách.</li>
                <li>Nếu ký gửi: Phải được tách múi, hút chân không nhiều lớp và đóng trong thùng xốp không rò rỉ mùi ra ngoài.</li>
                <li>Các sản phẩm sấy khô (sầu riêng sấy, mít sấy giòn OCOP) được mang xách tay bình thường.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 space-y-2">
              <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Pin sạc dự phòng & Thiết bị điện tử</span>
              </div>
              <ul className="text-xs text-blue-950 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li><strong>Bắt buộc mang xách tay</strong>, nghiêm cấm để trong hành lý ký gửi.</li>
                <li>Dung lượng tiêu chuẩn dưới 20.000mAh (hoặc 100Wh) được mang tự do. Từ 100Wh - 160Wh cần thông báo hãng.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <Package className="w-4 h-4 text-emerald-600" />
                <span>Rượu & Đồ uống có cồn</span>
              </div>
              <ul className="text-xs text-emerald-950 space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>Rượu có nồng độ cồn dưới 24%: Không giới hạn số lượng ký gửi.</li>
                <li>Rượu từ 24% đến 70%: Tối đa 5 lít/người trong hành lý ký gửi, phải còn nguyên tem mác nhà sản xuất.</li>
                <li>Rượu trên 70%: Nghiêm cấm vận chuyển hàng không.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
