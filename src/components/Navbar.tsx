import React from 'react';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  UtensilsCrossed, 
  Sparkles, 
  ShieldAlert, 
  Sparkle, 
  Layers, 
  DollarSign, 
  UserCheck, 
  Languages, 
  HelpCircle,
  PhoneCall
} from 'lucide-react';
import { LanguageCode } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  onOpenSOS: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  onOpenSOS,
}) => {
  const navItems = [
    { id: 'chat', label: 'Trợ lý AI', icon: Sparkles },
    { id: 'planner', label: 'Lập lịch trình', icon: Calendar },
    { id: 'map', label: 'Bản đồ số', icon: MapPin },
    { id: 'food', label: 'Ẩm thực chuẩn', icon: UtensilsCrossed },
    { id: 'festivals', label: 'Lễ hội & Vé', icon: Compass },
    { id: 'tips', label: '400+ Tips & Quà', icon: Layers },
    { id: 'budget', label: 'Ngân sách', icon: DollarSign },
    { id: 'dna', label: 'Travel DNA', icon: UserCheck },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 shadow-xs">
      {/* Top Banner with Slogan & Emergency Hotline */}
      <div className="bg-stone-900 text-stone-300 text-xs px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-yellow-300 font-bold text-[10px]">★</span>
          <span className="font-medium text-stone-200">VietGo AI</span>
          <span className="hidden md:inline text-stone-400">| "Không chỉ tìm địa điểm — AI giúp bạn hiểu, chọn và trải nghiệm Việt Nam."</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            id="sos-hotline-btn"
            onClick={onOpenSOS}
            className="flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>SOS Hotline: 112 / 113</span>
          </button>
          <div className="flex items-center gap-1 border-l border-stone-700 pl-3">
            <Languages className="w-3.5 h-3.5 text-stone-400" />
            <select
              id="language-selector"
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-stone-300 hover:text-white text-xs cursor-pointer focus:outline-hidden"
            >
              <option value="vi" className="bg-stone-800 text-white">🇻🇳 Tiếng Việt</option>
              <option value="en" className="bg-stone-800 text-white">🇬🇧 English</option>
              <option value="ko" className="bg-stone-800 text-white">🇰🇷 한국어</option>
              <option value="ja" className="bg-stone-800 text-white">🇯🇵 日本語</option>
              <option value="zh" className="bg-stone-800 text-white">🇨🇳 中文</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('chat')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 via-red-500 to-amber-500 flex items-center justify-center shadow-md shadow-red-500/20 group-hover:scale-105 transition-transform">
            <span className="text-xl">🇻🇳</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-stone-900">VietGo</span>
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-red-100 text-red-700 uppercase tracking-wide">AI Hub</span>
            </div>
            <p className="text-[11px] text-stone-500 font-medium">Trợ lý Du lịch Thông minh Việt Nam</p>
          </div>
        </div>

        {/* Tab Navigation for Desktop */}
        <nav className="hidden lg:flex items-center gap-1 bg-stone-100/80 p-1.5 rounded-xl border border-stone-200/60">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-tab-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-red-600 shadow-xs border border-stone-200/60'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-500' : 'text-stone-500'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Quick CTA */}
        <div className="flex items-center gap-2">
          <button
            id="quick-plan-cta"
            onClick={() => setActiveTab('planner')}
            className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/20 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Lập Lịch Trình 30s</span>
            <span className="sm:hidden">Lập Lịch</span>
          </button>
        </div>
      </div>

      {/* Mobile Horizontal Scroll Tab Bar */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-stone-200/60 bg-stone-50/70 scrollbar-none">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                isActive
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-stone-600 border border-stone-200/70'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
