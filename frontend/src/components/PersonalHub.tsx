import React, { useState } from 'react';
import { 
  UserCheck, 
  DollarSign, 
  Wallet, 
  PlusCircle, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  Sparkles, 
  Heart, 
  MapPin, 
  UtensilsCrossed, 
  Compass, 
  ShieldCheck, 
  Award, 
  PieChart, 
  QrCode, 
  Calendar,
  Ticket,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { BudgetBreakdown, ExpenseItem, UserProfile, TravelStyle } from '../types';
import { PROVINCES } from '../data/vietnamData';

export const PersonalHub: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'budget' | 'dna' | 'saved'>('budget');

  // Budget State
  const [totalBudget, setTotalBudget] = useState<number>(6000000);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 'exp-1', category: 'stay', title: 'Homestay Phố Cổ 2 đêm', amount: 1400000, date: 'Hôm qua' },
    { id: 'exp-2', category: 'food', title: 'Bữa trưa Mì Quảng & Cafe trứng', amount: 180000, date: 'Hôm nay' },
    { id: 'exp-3', category: 'transport', title: 'Thuê xe máy 2 ngày + Xăng', amount: 320000, date: 'Hôm nay' },
    { id: 'exp-4', category: 'tickets', title: 'Vé tham quan di tích phố cổ', amount: 240000, date: 'Hôm nay' }
  ]);
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<'stay' | 'food' | 'transport' | 'tickets' | 'contingency'>('food');

  // Travel DNA State
  const [profile, setProfile] = useState<UserProfile>({
    id: 'user-default',
    name: 'Nguyễn Văn An',
    email: 'traveler.an@vietgo.ai',
    primaryStyle: 'Foodie & Ẩm thực',
    dietaryRestrictions: ['Ăn cay vừa', 'Không ăn nội tạng'],
    preferredPace: 'balanced',
    visitedProvinces: ['hanoi', 'da-nang', 'quang-nam'],
    savedItems: ['food-1', 'fest-1', 'food-3']
  });

  const [isSaved, setIsSaved] = useState(false);

  // Budget calculations
  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const spentPercent = Math.min(Math.round((totalSpent / totalBudget) * 100), 100);

  const catSums = {
    stay: expenses.filter(e => e.category === 'stay').reduce((s, e) => s + e.amount, 0),
    food: expenses.filter(e => e.category === 'food').reduce((s, e) => s + e.amount, 0),
    transport: expenses.filter(e => e.category === 'transport').reduce((s, e) => s + e.amount, 0),
    tickets: expenses.filter(e => e.category === 'tickets').reduce((s, e) => s + e.amount, 0),
    contingency: expenses.filter(e => e.category === 'contingency').reduce((s, e) => s + e.amount, 0),
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(newAmount);
    if (!newTitle.trim() || isNaN(amt) || amt <= 0) return;

    const item: ExpenseItem = {
      id: `exp-${Date.now()}`,
      category: newCategory,
      title: newTitle.trim(),
      amount: amt,
      date: 'Vừa xong'
    };

    setExpenses([item, ...expenses]);
    setNewTitle('');
    setNewAmount('');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  const handleToggleVisited = (provinceId: string) => {
    setProfile(prev => {
      const exists = prev.visitedProvinces.includes(provinceId);
      return {
        ...prev,
        visitedProvinces: exists
          ? prev.visitedProvinces.filter(p => p !== provinceId)
          : [...prev.visitedProvinces, provinceId]
      };
    });
  };

  const handleSaveProfile = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const styleList: TravelStyle[] = [
    'Foodie & Ẩm thực',
    'Nghỉ dưỡng & Chill',
    'Phượt & Khám phá',
    'Văn hóa & Di sản',
    'Sống ảo & Check-in',
    'Gia đình & Trẻ nhỏ'
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Airbnb Profile Header Card */}
      <div className="bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-[#FF385C] via-[#E00B41] to-amber-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-md">
              VA
            </div>
            <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold" title="Tài khoản đã xác minh">
              ✓
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                {profile.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-[#FF385C] text-xs font-black">
                {profile.primaryStyle}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                Du khách thông thái
              </span>
            </div>
            <p className="text-xs text-stone-500">
              {profile.email} • Thành viên từ 2024
            </p>
            <div className="flex items-center gap-3 text-xs font-semibold text-stone-600 pt-1">
              <span>📍 Đã đi: <strong className="text-stone-900">{profile.visitedProvinces.length}/34</strong> tỉnh thành</span>
              <span>•</span>
              <span>💰 Đã chi tiêu: <strong className="text-[#FF385C]">{totalSpent.toLocaleString('vi-VN')} ₫</strong></span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Switcher in Airbnb Pill Style */}
        <div className="inline-flex p-1.5 rounded-2xl bg-stone-100 border border-stone-200 shadow-inner self-stretch md:self-auto">
          <button
            onClick={() => setActiveSubTab('budget')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'budget'
                ? 'bg-white text-[#FF385C] shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Quản Lý Chi Tiêu</span>
          </button>

          <button
            onClick={() => setActiveSubTab('dna')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'dna'
                ? 'bg-white text-[#FF385C] shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Travel DNA & Sở Thích</span>
          </button>

          <button
            onClick={() => setActiveSubTab('saved')}
            className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'saved'
                ? 'bg-white text-[#FF385C] shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Đã Lưu & Voucher</span>
          </button>
        </div>
      </div>

      {/* View 1: Quản lý Chi tiêu & Ngân sách */}
      {activeSubTab === 'budget' && (
        <div className="space-y-6">
          {/* Top Budget Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Budget Setting Card */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-3">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Ngân sách dự kiến chuyến đi
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-stone-900">
                  {totalBudget.toLocaleString('vi-VN')} ₫
                </span>
                <span className="text-xs font-bold px-2 py-1 rounded-md bg-stone-100 text-stone-700">
                  VND
                </span>
              </div>
              <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
                <span className="text-xs text-stone-500">Đổi mức:</span>
                {[3000000, 6000000, 10000000, 15000000].map(val => (
                  <button
                    key={val}
                    onClick={() => setTotalBudget(val)}
                    className={`text-[11px] px-2 py-1 rounded-lg font-bold border transition-colors cursor-pointer ${
                      totalBudget === val
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {(val / 1000000)}Tr
                  </button>
                ))}
              </div>
            </div>

            {/* Total Spent Card */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-3">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Đã giải ngân thực tế
              </span>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-[#FF385C]">
                  {totalSpent.toLocaleString('vi-VN')} ₫
                </span>
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                  spentPercent > 90 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {spentPercent}% Ngân sách
                </span>
              </div>
              <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden shadow-inner">
                <div 
                  className={`h-full transition-all duration-500 ${
                    spentPercent > 90 ? 'bg-[#FF385C]' : spentPercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${spentPercent}%` }}
                />
              </div>
            </div>

            {/* Remaining Balance Card */}
            <div className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs space-y-3">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Hạn mức còn lại
              </span>
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-black ${
                  remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}>
                  {remainingBudget.toLocaleString('vi-VN')} ₫
                </span>
                <span className="text-xs font-bold px-2 py-1 rounded-md bg-stone-100 text-stone-700">
                  {remainingBudget >= 0 ? 'Còn an toàn' : 'Vượt trần'}
                </span>
              </div>
              <p className="text-xs text-stone-500 pt-2 border-t border-stone-100">
                {remainingBudget >= 0 
                  ? 'Chi tiêu đang bám sát định mức Tỷ Lệ Vàng.'
                  : 'Cảnh báo: Bạn đã vượt quá ngân sách ban đầu!'}
              </p>
            </div>
          </div>

          {/* Quick Expense Form & Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Log new expense form */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-[#FF385C]" />
                <h3 className="font-extrabold text-base text-stone-900">Ghi chép chi tiêu mới</h3>
              </div>

              <form onSubmit={handleAddExpense} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Khoản chi tiêu</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="VD: Cà phê trứng Giảng, Vé thuyền Tràng An..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-[#FF385C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Số tiền (VND)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="VD: 70000"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:border-[#FF385C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Danh mục</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-hidden"
                  >
                    <option value="food">🍲 Ẩm thực & Ăn uống</option>
                    <option value="stay">🏨 Lưu trú & Khách sạn</option>
                    <option value="transport">🚗 Đi lại & Xăng xe</option>
                    <option value="tickets">🎟️ Vé tham quan & Trải nghiệm</option>
                    <option value="contingency">🎁 Quà lưu niệm & Khác</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-transform active:scale-95 cursor-pointer shadow-xs"
                >
                  + Thêm khoản chi
                </button>
              </form>
            </div>

            {/* Expenses List */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-stone-900">
                  Lịch sử chi tiêu ({expenses.length} khoản)
                </h3>
                <span className="text-xs text-stone-500">Mới nhất lên đầu</span>
              </div>

              <div className="divide-y divide-stone-100 max-h-[380px] overflow-y-auto pr-1">
                {expenses.map((item) => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center text-xs font-bold">
                        {item.category === 'food' ? '🍲' : item.category === 'stay' ? '🏨' : item.category === 'transport' ? '🚗' : '🎟️'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs sm:text-sm text-stone-900">{item.title}</h4>
                        <span className="text-[11px] text-stone-400">{item.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-xs sm:text-sm text-stone-900">
                        {item.amount.toLocaleString('vi-VN')} ₫
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(item.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition-opacity cursor-pointer"
                        title="Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Travel DNA & Sở thích */}
      {activeSubTab === 'dna' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <h2 className="text-xl font-extrabold text-stone-900">Hồ Sơ Du Lịch & Travel DNA</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Thiết lập phong cách để AI tự động cá nhân hóa lộ trình và quán ăn phù hợp với cơ địa bạn.
              </p>
            </div>
            <button
              onClick={handleSaveProfile}
              className="px-4 py-2 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{isSaved ? 'Đã lưu thành công!' : 'Lưu hồ sơ'}</span>
            </button>
          </div>

          {/* Primary Style Selector */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider">
              1. Phong cách du lịch chủ đạo của bạn
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {styleList.map((st) => {
                const isSelected = profile.primaryStyle === st;
                return (
                  <button
                    key={st}
                    onClick={() => setProfile({ ...profile, primaryStyle: st })}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#FF385C] bg-rose-50/50 shadow-xs'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div className="font-extrabold text-xs sm:text-sm text-stone-900">{st}</div>
                    <div className="text-[11px] text-stone-500 mt-1">
                      {isSelected ? '✓ Đang áp dụng' : 'Nhấp để chọn'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div className="space-y-3">
            <label className="block text-xs font-black text-stone-800 uppercase tracking-wider">
              2. Lưu ý ẩm thực & Chế độ ăn uống
            </label>
            <div className="flex flex-wrap gap-2">
              {['Ăn chay (Vegan/Vegetarian)', 'Không ăn cay', 'Ăn cay vừa', 'Dị ứng tôm/cua/hải sản', 'Không ăn nội tạng', 'Chuẩn Halal'].map((diet) => {
                const isChecked = profile.dietaryRestrictions.includes(diet);
                return (
                  <button
                    key={diet}
                    onClick={() => {
                      setProfile({
                        ...profile,
                        dietaryRestrictions: isChecked
                          ? profile.dietaryRestrictions.filter(d => d !== diet)
                          : [...profile.dietaryRestrictions, diet]
                      });
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isChecked
                        ? 'bg-stone-900 text-white border-stone-900'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {isChecked ? '✓ ' : '+ '}{diet}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visited Provinces Check-in Passport */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-stone-800 uppercase tracking-wider">
                3. Hộ chiếu Việt Nam: Tỉnh thành bạn đã từng đặt chân tới ({profile.visitedProvinces.length}/34)
              </label>
              <span className="text-xs text-[#FF385C] font-bold">
                Mở khóa {Math.round((profile.visitedProvinces.length / 34) * 100)}% dải đất hình chữ S
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-2 bg-stone-50 rounded-2xl border border-stone-200">
              {PROVINCES.map((prov) => {
                const isVisited = profile.visitedProvinces.includes(prov.id);
                return (
                  <button
                    key={prov.id}
                    onClick={() => handleToggleVisited(prov.id)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                      isVisited
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {isVisited ? '✓ ' : ''}{prov.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* View 3: Đã lưu & Voucher */}
      {activeSubTab === 'saved' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-stone-900">Voucher Đặt Chỗ & Danh Sách Yêu Thích</h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Các mã giữ chỗ bàn ăn chuẩn vị và vé trải nghiệm bạn đã lưu lại.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Voucher 1 */}
            <div className="bg-gradient-to-br from-rose-50 to-white rounded-2xl border border-rose-200/80 p-5 shadow-xs flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded-md bg-[#FF385C] text-white text-[10px] font-bold uppercase">
                  Voucher Đặt Bàn Ưu Tiên
                </span>
                <h4 className="font-extrabold text-sm text-stone-900">Phở Bát Đàn Truyền Thống</h4>
                <p className="text-xs text-stone-500">Hà Nội • Giữ chỗ 2 khách • Không phải xếp hàng</p>
                <div className="text-[11px] text-emerald-700 font-bold pt-1">
                  Mã: VGO-HN-8839 • Có hiệu lực
                </div>
              </div>
              <div className="w-16 h-16 rounded-xl bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-2xs">
                <QrCode className="w-12 h-12 text-stone-800" />
              </div>
            </div>

            {/* Voucher 2 */}
            <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl border border-amber-200/80 p-5 shadow-xs flex items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-bold uppercase">
                  Vé Lễ Hội Văn Hóa
                </span>
                <h4 className="font-extrabold text-sm text-stone-900">Lễ Hội Đèn Lồng Phố Cổ Hội An</h4>
                <p className="text-xs text-stone-500">Quảng Nam • Tặng kèm 2 đèn hoa đăng ước nguyện</p>
                <div className="text-[11px] text-emerald-700 font-bold pt-1">
                  Mã: VGO-HA-4412 • Đã xác nhận
                </div>
              </div>
              <div className="w-16 h-16 rounded-xl bg-white border border-stone-200 flex items-center justify-center shrink-0 shadow-2xs">
                <QrCode className="w-12 h-12 text-stone-800" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
