import React, { useState } from 'react';
import { 
  Compass, 
  MapPin,
  Bot, 
  Calendar, 
  Heart, 
  Menu, 
  User, 
  PhoneCall, 
  Globe, 
  Check, 
  ShieldAlert,
  ShieldCheck,
  Wallet,
  ChevronRight,
  LogIn
} from 'lucide-react';
import { LanguageCode, AccountTab, AuthUser } from '../types';
import { AvatarContent, isVerifiedUser } from './AccountDrawer';

interface NavbarProps {
  activeTab: 'home' | 'explore' | 'nearby' | 'ai' | 'itinerary' | 'account' | 'budget';
  setActiveTab: (tab: 'home' | 'explore' | 'nearby' | 'ai' | 'itinerary' | 'account' | 'budget') => void;
  wishlistCount: number;
  onOpenWishlist: () => void;
  onOpenAccount: (tab?: AccountTab) => void;
  currentUser: AuthUser | null;
  onOpenSOS: () => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  wishlistCount,
  onOpenWishlist,
  onOpenAccount,
  currentUser,
  onOpenSOS,
  language,
  setLanguage,
}) => {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const mainNavItems = [
    { id: 'home' as const, label: 'L\u1eadp l\u1ecbch', icon: Calendar },
    { id: 'explore' as const, label: 'Khám phá', icon: Compass },
    { id: 'nearby' as const, label: 'Xung quanh', icon: MapPin },
    { id: 'ai' as const, label: 'Trợ lý AI', icon: Bot },
    { id: 'itinerary' as const, label: 'Lịch trình', icon: Calendar },
  ];

  return (
    <>
      {/* 1. Desktop & Mobile Top Header */}
      <header className="sticky top-0 z-40 shrink-0 bg-white/95 backdrop-blur-md border-b border-[#E5E5E5] transition-all">
        {/* Top Micro Emergency & Language bar */}
        <div className="bg-[#222222] text-[#F7F7F7] text-[11px] px-4 sm:px-8 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#FF385C] animate-pulse"></span>
            <span className="font-semibold text-white">VietGo AI</span>
            <span className="hidden sm:inline text-stone-400">
              • Nền tảng trợ lý du lịch toàn diện Việt Nam 2026
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenSOS}
              className="flex items-center gap-1.5 text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer"
            >
              <PhoneCall className="w-3 h-3" />
              <span>Cứu hộ khẩn cấp: 112 / 113</span>
            </button>

            <div className="hidden sm:flex items-center gap-1 border-l border-stone-700 pl-3">
              <Globe className="w-3 h-3 text-stone-400" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageCode)}
                className="bg-transparent text-stone-300 hover:text-white text-[11px] cursor-pointer focus:outline-hidden"
              >
                <option value="vi" className="bg-[#222222] text-white">🇻🇳 Tiếng Việt</option>
                <option value="en" className="bg-[#222222] text-white">🇬🇧 English</option>
                <option value="ko" className="bg-[#222222] text-white">🇰🇷 한국어</option>
                <option value="ja" className="bg-[#222222] text-white">🇯🇵 日本語</option>
                <option value="zh" className="bg-[#222222] text-white">🇨🇳 中文</option>
              </select>
            </div>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <div 
            onClick={() => setActiveTab('explore')}
            className="flex items-center gap-1.5 cursor-pointer group select-none shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FF385C] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <span className="text-base sm:text-lg">🇻🇳</span>
            </div>
            <div className="flex items-baseline">
              <span className="font-extrabold text-xl sm:text-2xl tracking-tighter text-[#FF385C]">vietgo</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#222222] ml-0.5"></span>
            </div>
          </div>

          {/* Center Navigation (Desktop Only) */}
          <nav className="hidden md:flex items-center gap-1 bg-[#F7F7F7] p-1.5 rounded-full border border-[#E5E5E5]">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#222222] shadow-xs'
                      : 'text-[#717171] hover:text-[#222222] hover:bg-white/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#FF385C]' : 'text-[#717171]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls (Wishlist & Account Menu) */}
          <div className="flex items-center gap-2.5">
            {/* Wishlist Button */}
            <button
              onClick={onOpenWishlist}
              className="flex items-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-full border border-[#E5E5E5] hover:border-[#222222] transition-colors cursor-pointer text-xs font-bold text-[#222222]"
              title="Danh sách yêu thích"
            >
              <Heart className={`w-4 h-4 ${wishlistCount > 0 ? 'fill-[#FF385C] text-[#FF385C]' : 'text-[#222222]'}`} />
              <span className="hidden sm:inline">Yêu thích</span>
              {wishlistCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#FF385C] text-white text-[10px] font-black flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Account Dropdown Trigger */}
            <div className="relative">
              <button
                onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                className={`flex items-center gap-2 p-1.5 pl-3 rounded-full border transition-all cursor-pointer bg-white ${
                  activeTab === 'budget'
                    ? 'border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-[#E5E5E5] hover:shadow-md'
                }`}
                title="Menu tài khoản & Tiện ích"
              >
                <Menu className="w-4 h-4 text-[#717171]" />
                <div className="relative">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden text-white text-xs font-black flex items-center justify-center shadow-xs ${
                    currentUser ? 'bg-gradient-to-tr from-[#FF385C] to-orange-400' : 'bg-[#717171]'
                  }`}>
                    {currentUser ? <AvatarContent user={currentUser} /> : <User className="w-4 h-4" />}
                  </div>
                  {activeTab === 'budget' && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>
              </button>

              {/* Account Dropdown Menu */}
              {accountMenuOpen && (
                <div 
                  className="absolute right-0 top-12 w-72 bg-white rounded-3xl shadow-xl border border-[#E5E5E5] p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setAccountMenuOpen(false)}
                >
                  {/* 1. Header Profile — bấm để mở Hồ sơ cá nhân (hoặc form đăng nhập) */}
                  <button
                    onClick={() => onOpenAccount('profile')}
                    className="w-full text-left p-3 mb-1 rounded-2xl bg-[#F7F7F7] hover:bg-[#EFEFEF] flex items-center gap-3 cursor-pointer transition-colors group"
                  >
                    {currentUser ? (
                      <>
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-[#FF385C] to-orange-400 text-white text-sm font-black flex items-center justify-center shrink-0">
                          <AvatarContent user={currentUser} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-sm font-black text-[#222222]">
                            <span className="truncate">{currentUser.name}</span>
                            {isVerifiedUser(currentUser) && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          </div>
                          <div className="text-xs text-[#717171] truncate pt-0.5">
                            {currentUser.email || currentUser.phone || `@${currentUser.username}`}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-[#FF385C] text-white flex items-center justify-center shrink-0">
                          <LogIn className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-black text-[#222222]">Đăng nhập / Đăng ký</div>
                          <div className="text-xs text-[#717171] truncate pt-0.5">Qua Gmail hoặc số điện thoại</div>
                        </div>
                      </>
                    )}
                    <ChevronRight className="w-4 h-4 text-[#717171] group-hover:translate-x-0.5 transition-transform shrink-0" />
                  </button>

                  <button
                    onClick={() => {
                      onOpenAccount('wishlist');
                      setAccountMenuOpen(false);
                    }}
                    className="w-full px-4 py-2.5 text-xs text-[#222222] hover:bg-[#F7F7F7] flex items-center gap-2.5 font-semibold text-left cursor-pointer transition-colors"
                  >
                    <Heart className="w-4 h-4 text-[#FF385C]" />
                    <span>Danh sách yêu thích ({wishlistCount})</span>
                  </button>

                  <button
                    onClick={() => onOpenAccount('budget')}
                    className={`w-full px-4 py-2.5 text-xs flex items-center justify-between font-semibold text-left cursor-pointer transition-colors ${
                      activeTab === 'budget' 
                        ? 'bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-600' 
                        : 'text-[#222222] hover:bg-[#F7F7F7]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Wallet className={`w-4 h-4 ${activeTab === 'budget' ? 'text-emerald-700' : 'text-emerald-600'}`} />
                      <span>Quản lý chi tiêu</span>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Mới
                    </span>
                  </button>

                  <div className="border-t border-[#E5E5E5] my-1"></div>

                  <button
                    onClick={onOpenSOS}
                    className="w-full px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-bold text-left cursor-pointer transition-colors"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>Cứu hộ khẩn cấp SOS</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 2. Mobile Fixed Bottom Navigation Bar (Airbnb Style) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-md border-t border-[#E5E5E5] px-2 py-1.5 flex items-center justify-around shadow-lg">
        {/* Item 1: Khám phá */}
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] ${activeTab === 'home' ? 'text-[#FF385C]' : 'text-[#717171] hover:text-[#222222]'}`}>
          <Calendar className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] font-bold">Lập lịch</span>
        </button>

        <button
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            activeTab === 'explore' ? 'text-[#FF385C]' : 'text-[#717171] hover:text-[#222222]'
          }`}
        >
          <Compass className={`w-5 h-5 ${activeTab === 'explore' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] font-bold">Khám phá</span>
        </button>

        {/* Item 2: Xung quanh */}
        <button
          onClick={() => setActiveTab('nearby')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            activeTab === 'nearby' ? 'text-[#FF385C]' : 'text-[#717171] hover:text-[#222222]'
          }`}
        >
          <MapPin className={`w-5 h-5 ${activeTab === 'nearby' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] font-bold">Xung quanh</span>
        </button>

        {/* Item 3: Trợ lý AI */}
        <button
          onClick={() => setActiveTab('ai')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            activeTab === 'ai' ? 'text-[#FF385C]' : 'text-[#717171] hover:text-[#222222]'
          }`}
        >
          <Bot className={`w-5 h-5 ${activeTab === 'ai' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] font-bold">Trợ lý AI</span>
        </button>

        {/* Item 4: Lịch trình */}
        <button
          onClick={() => setActiveTab('itinerary')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            activeTab === 'itinerary' ? 'text-[#FF385C]' : 'text-[#717171] hover:text-[#222222]'
          }`}
        >
          <Calendar className={`w-5 h-5 ${activeTab === 'itinerary' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] font-bold">Lịch trình</span>
        </button>

        {/* Item 5: Tài khoản */}
        <button
          onClick={() => onOpenAccount('wishlist')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            activeTab === 'account' ? 'text-[#FF385C]' : 'text-[#717171] hover:text-[#222222]'
          }`}
        >
          <div className="relative">
            <User className="w-5 h-5 stroke-2" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#FF385C]" />
            )}
          </div>
          <span className="text-[10px] font-bold">Tài khoản</span>
        </button>
      </div>
    </>
  );
};
