import React, { useState, useMemo } from 'react';
import { 
  X, 
  Heart, 
  Wallet, 
  UserCheck, 
  ShieldAlert, 
  Trash2, 
  PlusCircle, 
  Star, 
  MapPin, 
  CheckCircle2, 
  Sparkles, 
  Phone, 
  PieChart, 
  DollarSign,
  Award,
  Globe
} from 'lucide-react';
import { PROVINCES } from '../data/vietnamData';
import { DetailItem } from './ItemDetailModal';
import { ExpenseItem, UserProfile, TravelStyle } from '../types';

interface AccountDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onSelectItem: (item: DetailItem) => void;
  initialTab?: 'wishlist' | 'dna' | 'budget' | 'emergency';
  onOpenFullBudget?: () => void;
}

export const AccountDrawer: React.FC<AccountDrawerProps> = ({
  isOpen,
  onClose,
  wishlist,
  onToggleWishlist,
  onSelectItem,
  initialTab = 'wishlist',
  onOpenFullBudget
}) => {
  const [activeTab, setActiveTab] = useState<'wishlist' | 'dna' | 'budget' | 'emergency'>(initialTab);

  // Sync initial tab when opened
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Wishlisted objects lookup
  const wishlistedItems = useMemo(() => {
    const list: DetailItem[] = [];
    PROVINCES.forEach(p => {
      if (wishlist.includes(p.id)) {
        list.push({ itemType: 'province', ...p });
      }
      p.pois.forEach(poi => {
        if (wishlist.includes(poi.id)) {
          list.push({ itemType: 'poi', ...poi });
        }
      });
      p.foods.forEach(f => {
        if (wishlist.includes(f.id)) {
          list.push({ itemType: 'food', ...f });
        }
      });
      p.festivals.forEach(fest => {
        if (wishlist.includes(fest.id)) {
          list.push({ itemType: 'festival', ...fest });
        }
      });
    });
    return list;
  }, [wishlist]);

  // Budget Tracker state
  const [totalBudget, setTotalBudget] = useState<number>(6000000);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([
    { id: 'exp-1', category: 'stay', title: 'Khách sạn / Homestay 2 đêm', amount: 1600000, date: '15/04' },
    { id: 'exp-2', category: 'food', title: 'Phở & Bún bò đặc sản', amount: 240000, date: '15/04' },
    { id: 'exp-3', category: 'transport', title: 'Thuê xe máy 2 ngày + xăng', amount: 350000, date: '16/04' },
    { id: 'exp-4', category: 'tickets', title: 'Vé tham quan di tích & thắng cảnh', amount: 300000, date: '16/04' }
  ]);
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState<'stay' | 'food' | 'transport' | 'tickets' | 'contingency'>('food');

  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const spentPercent = Math.min(Math.round((totalSpent / totalBudget) * 100), 100);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newExpenseAmount.replace(/[^0-9]/g, ''));
    if (!newExpenseTitle.trim() || isNaN(amt) || amt <= 0) return;

    const newItem: ExpenseItem = {
      id: `exp-${Date.now()}`,
      category: newExpenseCategory,
      title: newExpenseTitle,
      amount: amt,
      date: 'Hôm nay'
    };
    setExpenses([newItem, ...expenses]);
    setNewExpenseTitle('');
    setNewExpenseAmount('');
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
  };

  // Travel DNA state
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'user-default',
    name: 'Nguyễn Văn An',
    email: 'traveler.an@vietgo.ai',
    primaryStyle: 'Foodie & Ẩm thực',
    dietaryRestrictions: ['Ăn cay vừa', 'Không hành sống'],
    preferredPace: 'balanced',
    visitedProvinces: ['hanoi', 'da-nang', 'quang-nam'],
    savedItems: wishlist
  });

  const [visitedCount, setVisitedCount] = useState(7);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-3xl min-h-screen sm:min-h-0 sm:max-h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-[#E5E5E5] my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-[#E5E5E5] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#222222] text-white flex items-center justify-center font-bold text-sm">
              VA
            </div>
            <div>
              <h2 className="text-base font-black text-[#222222]">
                Tài khoản của bạn
              </h2>
              <p className="text-xs text-[#717171]">
                {userProfile.email}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#F7F7F7] text-[#717171] hover:text-[#222222] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 border-b border-[#E5E5E5] flex items-center gap-6 overflow-x-auto scrollbar-none bg-[#F7F7F7]/50 shrink-0">
          <button
            onClick={() => setActiveTab('wishlist')}
            className={`py-3.5 border-b-2 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'wishlist'
                ? 'border-[#222222] text-[#222222]'
                : 'border-transparent text-[#717171] hover:text-[#222222]'
            }`}
          >
            <Heart className={`w-4 h-4 ${activeTab === 'wishlist' ? 'fill-[#FF385C] text-[#FF385C]' : ''}`} />
            <span>Yêu thích ({wishlist.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('dna')}
            className={`py-3.5 border-b-2 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'dna'
                ? 'border-[#222222] text-[#222222]'
                : 'border-transparent text-[#717171] hover:text-[#222222]'
            }`}
          >
            <UserCheck className="w-4 h-4 text-[#FF385C]" />
            <span>Hồ sơ Travel DNA</span>
          </button>

          <button
            onClick={() => setActiveTab('budget')}
            className={`py-3.5 border-b-2 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'budget'
                ? 'border-[#222222] text-[#222222]'
                : 'border-transparent text-[#717171] hover:text-[#222222]'
            }`}
          >
            <Wallet className="w-4 h-4 text-emerald-600" />
            <span>Quản lý chi tiêu</span>
          </button>

          <button
            onClick={() => setActiveTab('emergency')}
            className={`py-3.5 border-b-2 text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'emergency'
                ? 'border-[#222222] text-[#222222]'
                : 'border-transparent text-[#717171] hover:text-[#222222]'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Hotline cứu hộ SOS</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: YÊU THÍCH (WISHLIST) */}
          {activeTab === 'wishlist' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-[#222222]">
                    Danh sách địa điểm & ẩm thực đã lưu
                  </h3>
                  <p className="text-xs text-[#717171]">
                    Nhấn vào bất kỳ mục nào để xem chi tiết hoặc thêm vào lịch trình
                  </p>
                </div>
                <span className="text-xs font-bold text-[#FF385C]">
                  {wishlistedItems.length} mục
                </span>
              </div>

              {wishlistedItems.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-[#F7F7F7] rounded-3xl border border-[#E5E5E5]">
                  <Heart className="w-10 h-10 text-stone-300 mx-auto" />
                  <div className="text-sm font-bold text-[#222222]">Chưa có mục nào trong danh sách yêu thích</div>
                  <p className="text-xs text-[#717171] max-w-xs mx-auto">
                    Chạm vào biểu tượng trái tim ở các thẻ điểm đến, quán ăn hoặc lễ hội để lưu lại cho chuyến đi!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wishlistedItems.map((item) => {
                    const title = 'dishName' in item ? `${item.dishName} (${item.name})` : item.name;
                    const address = 'address' in item ? item.address : 'Việt Nam';
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          onClose();
                          onSelectItem(item);
                        }}
                        className="bg-white border border-[#E5E5E5] rounded-2xl p-3 flex gap-3 hover:shadow-sm transition-all cursor-pointer group relative"
                      >
                        <img
                          src={item.imageUrl}
                          alt={title}
                          className="w-20 h-20 rounded-xl object-cover shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wide text-[#FF385C]">
                            {item.itemType === 'poi' ? 'Điểm đến' : item.itemType === 'food' ? 'Ẩm thực' : 'Lễ hội'}
                          </span>
                          <h4 className="text-xs font-bold text-[#222222] truncate">{title}</h4>
                          <p className="text-[11px] text-[#717171] truncate">{address}</p>
                          <div className="text-[11px] font-semibold text-[#222222] pt-1">
                            Xem chi tiết &rarr;
                          </div>
                        </div>

                        {/* Remove heart */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleWishlist(item.id);
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-white/80 hover:bg-white text-[#FF385C] cursor-pointer"
                          title="Bỏ lưu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HỒ SƠ TRAVEL DNA */}
          {activeTab === 'dna' && (
            <div className="space-y-5">
              <div className="p-4 rounded-3xl bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-[#717171] uppercase tracking-wider">Hồ sơ cá nhân hóa</div>
                  <h3 className="text-base font-black text-[#222222]">Chỉ số khám phá Việt Nam</h3>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-[#FF385C]">{visitedCount} / 34+</div>
                  <div className="text-[11px] text-[#717171]">Tỉnh thành đã đặt chân</div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#222222]">Phong cách du lịch ưu tiên</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {[
                    'Foodie & Ẩm thực',
                    'Nghỉ dưỡng & Chill',
                    'Khám phá Văn hóa & Lịch sử',
                    'Phượt bụi & Khám phá mạo hiểm',
                    'Du lịch Tiết kiệm & Tự túc',
                    'Check-in Sống ảo'
                  ].map((style) => (
                    <button
                      key={style}
                      onClick={() => setUserProfile({ ...userProfile, primaryStyle: style as TravelStyle })}
                      className={`p-3 rounded-2xl border text-left font-semibold transition-all cursor-pointer ${
                        userProfile.primaryStyle === style
                          ? 'bg-[#222222] text-white border-[#222222]'
                          : 'bg-[#F7F7F7] text-[#717171] border-[#E5E5E5] hover:border-[#222222]'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-[#222222]">Sở thích & Lưu ý ăn uống</label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Không hành', 'Ăn cay vừa', 'Không ăn cay', 'Ăn chay / Thuần chay', 'Thích hải sản', 'Dị ứng đậu phộng'].map((item) => (
                    <button
                      key={item}
                      onClick={() => {
                        const exists = userProfile.dietaryRestrictions.includes(item);
                        setUserProfile({
                          ...userProfile,
                          dietaryRestrictions: exists
                            ? userProfile.dietaryRestrictions.filter(i => i !== item)
                            : [...userProfile.dietaryRestrictions, item]
                        });
                      }}
                      className={`px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                        userProfile.dietaryRestrictions.includes(item)
                          ? 'bg-[#FF385C] text-white border-[#FF385C]'
                          : 'bg-[#F7F7F7] text-[#717171] border-[#E5E5E5]'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUẢN LÝ CHI TIÊU (BUDGET) */}
          {activeTab === 'budget' && (
            <div className="space-y-5">
              {onOpenFullBudget && (
                <button
                  onClick={onOpenFullBudget}
                  className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center justify-between shadow-xs transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    <span>Mở Bảng Quản Lý Chi Tiêu Toàn Diện</span>
                  </div>
                  <span className="text-[11px] group-hover:translate-x-1 transition-transform">→</span>
                </button>
              )}

              {/* Budget Overview Card */}
              <div className="p-5 rounded-3xl bg-[#222222] text-white space-y-4 shadow-md">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-[11px] font-bold text-stone-400 uppercase">Tổng ngân sách chuyến đi</div>
                    <div className="text-xl sm:text-2xl font-black">{totalBudget.toLocaleString('vi-VN')} VNĐ</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-stone-400 uppercase">Còn lại</div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-400">{remainingBudget.toLocaleString('vi-VN')} VNĐ</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-stone-300">
                    <span>Đã chi: {totalSpent.toLocaleString('vi-VN')} VNĐ</span>
                    <span>{spentPercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-stone-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${spentPercent > 90 ? 'bg-rose-500' : 'bg-[#FF385C]'}`}
                      style={{ width: `${spentPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Add Expense Form */}
              <form onSubmit={handleAddExpense} className="p-4 rounded-3xl bg-[#F7F7F7] border border-[#E5E5E5] space-y-3">
                <div className="text-xs font-extrabold text-[#222222] uppercase tracking-wide">
                  Ghi nhanh khoản chi
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newExpenseTitle}
                    onChange={(e) => setNewExpenseTitle(e.target.value)}
                    placeholder="Khoản chi (VD: Bánh mì, Cafe...)"
                    className="p-2.5 rounded-xl border border-[#E5E5E5] bg-white text-xs font-semibold text-[#222222] focus:outline-hidden"
                    required
                  />
                  <input
                    type="number"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                    placeholder="Số tiền (VNĐ)"
                    className="p-2.5 rounded-xl border border-[#E5E5E5] bg-white text-xs font-semibold text-[#222222] focus:outline-hidden"
                    required
                  />
                  <select
                    value={newExpenseCategory}
                    onChange={(e) => setNewExpenseCategory(e.target.value as any)}
                    className="p-2.5 rounded-xl border border-[#E5E5E5] bg-white text-xs font-semibold text-[#222222] focus:outline-hidden cursor-pointer"
                  >
                    <option value="food">Ẩm thực</option>
                    <option value="stay">Lưu trú</option>
                    <option value="transport">Di chuyển</option>
                    <option value="tickets">Vé tham quan</option>
                    <option value="contingency">Dự phòng</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#222222] hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  + Thêm khoản chi
                </button>
              </form>

              {/* Expense History List */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[#717171] uppercase tracking-wider">
                  Lịch sử chi tiêu gần đây
                </div>
                {expenses.map((item) => (
                  <div 
                    key={item.id}
                    className="p-3 bg-white rounded-2xl border border-[#E5E5E5] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-extrabold text-[#222222]">{item.title}</div>
                      <div className="text-[11px] text-[#717171]">{item.date} • {item.category}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-[#222222]">{item.amount.toLocaleString('vi-VN')} VNĐ</span>
                      <button
                        onClick={() => handleDeleteExpense(item.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: HOTLINE CỨU HỘ SOS */}
          {activeTab === 'emergency' && (
            <div className="space-y-4">
              <div className="p-4 rounded-3xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1">
                <div className="font-bold text-sm flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Đầu số Cứu nạn & Hỗ trợ Khẩn cấp Toàn quốc</span>
                </div>
                <p className="text-xs text-rose-800">
                  Các số điện thoại khẩn cấp tại Việt Nam có thể gọi miễn phí từ bất kỳ mạng di động nào mà không cần mã vùng.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {[
                  { number: '112', title: 'Cứu nạn cứu hộ thiên tai, bão lũ' },
                  { number: '113', title: 'Cảnh sát cơ động & An ninh trật tự' },
                  { number: '114', title: 'Cứu hỏa & Cứu nạn cháy nổ' },
                  { number: '115', title: 'Cấp cứu y tế & Tai nạn' },
                  { number: '1800 556 896', title: 'Hotline Hỗ trợ Du khách Hà Nội' },
                  { number: '0236 3550 111', title: 'Trung tâm hỗ trợ du khách Đà Nẵng' },
                  { number: '1022 nhánh 8', title: 'Tổng đài Du lịch TP. Hồ Chí Minh' },
                  { number: '1900 6886', title: 'Phản ánh ép giá & Chặt chém' }
                ].map((hl, i) => (
                  <div key={i} className="p-3.5 rounded-2xl bg-white border border-[#E5E5E5] flex items-center justify-between">
                    <div>
                      <div className="font-black text-sm text-[#FF385C]">{hl.number}</div>
                      <div className="text-[11px] text-[#717171]">{hl.title}</div>
                    </div>
                    <a
                      href={`tel:${hl.number.replace(/\s+/g, '')}`}
                      className="p-2 rounded-xl bg-[#F7F7F7] hover:bg-[#E5E5E5] text-[#222222] cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#FF385C]" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
