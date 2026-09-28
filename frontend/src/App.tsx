import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ExplorePage } from './components/ExplorePage';
import { NearbyPage } from './components/NearbyPage';
import { AIAssistantPage } from './components/AIAssistantPage';
import { ItineraryPage } from './components/ItineraryPage';
import { ItemDetailModal, DetailItem } from './components/ItemDetailModal';
import { AccountDrawer } from './components/AccountDrawer';
import { BookingModal } from './components/BookingModal';
import { SOSModal } from './components/SOSModal';
import { BudgetTracker } from './components/BudgetTracker';
import { LanguageCode } from './types';

export default function App() {
  // Navigation tabs: 'explore' (default) | 'nearby' | 'ai' | 'itinerary' | 'account' | 'budget'
  const [activeTab, setActiveTab] = useState<'explore' | 'nearby' | 'ai' | 'itinerary' | 'account' | 'budget'>('explore');
  const [language, setLanguage] = useState<LanguageCode>('vi');

  // Wishlist state (persisted in localStorage)
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('vietgo_wishlist');
      return saved ? JSON.parse(saved) : ['hn-poi-1', 'hn-food-1', 'dn-poi-1', 'dl-poi-1'];
    } catch {
      return ['hn-poi-1', 'hn-food-1', 'dn-poi-1', 'dl-poi-1'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('vietgo_wishlist', JSON.stringify(wishlist));
    } catch (e) {}
  }, [wishlist]);

  const handleToggleWishlist = (id: string) => {
    setWishlist(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      }
      if (prev.length >= 50) {
        alert('Danh sách yêu thích đã đạt giới hạn tối đa (50 mục). Vui lòng xóa bớt để lưu thêm.');
        return prev;
      }
      return [...prev, id];
    });
  };

  // Selected Detail Item Modal
  const [selectedDetailItem, setSelectedDetailItem] = useState<DetailItem | null>(null);

  // Account Drawer / Modal State
  const [accountDrawerOpen, setAccountDrawerOpen] = useState(false);
  const [accountDrawerTab, setAccountDrawerTab] = useState<'wishlist' | 'dna' | 'budget' | 'emergency'>('wishlist');

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingItem, setBookingItem] = useState<{
    name: string;
    type: 'table' | 'ticket';
    price?: number;
  } | null>(null);

  // SOS Modal State
  const [sosModalOpen, setSosModalOpen] = useState(false);

  // Parameters to pass to Itinerary
  const [itineraryParams, setItineraryParams] = useState<{
    destination: string;
    days: number;
    guests: number;
    style?: string;
  } | null>(null);

  // Item pending to be added into itinerary
  const [pendingAddItem, setPendingAddItem] = useState<DetailItem | null>(null);

  // Query to seed into AI Assistant
  const [aiAssistantSeedQuery, setAiAssistantSeedQuery] = useState<string>('');

  // Handlers
  const handleOpenAccount = (tab: 'wishlist' | 'dna' | 'budget' | 'emergency' = 'wishlist') => {
    if (tab === 'budget') {
      setActiveTab('budget');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setAccountDrawerTab(tab);
    setAccountDrawerOpen(true);
  };

  const handleQuickPlanTrip = (params: { destination: string; days: number; guests: number }) => {
    setItineraryParams(params);
    setActiveTab('itinerary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToItineraryFromAI = (params: { destination: string; days: number; guests: number; style?: string }) => {
    setItineraryParams(params);
    setActiveTab('itinerary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddToItinerary = (item: DetailItem) => {
    setPendingAddItem(item);
    setActiveTab('itinerary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskAIAboutItem = (item: DetailItem) => {
    const title = 'dishName' in item ? `${item.dishName} (${item.name})` : item.name;
    const q = `Tôi muốn tìm hiểu thêm về "${title}" tại ${'address' in item ? item.address : 'Việt Nam'}. Hãy cho tôi biết giờ mở cửa chuẩn, chi phí, và mẹo bản địa để có trải nghiệm tốt nhất?`;
    setAiAssistantSeedQuery(q);
    setActiveTab('ai');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBooking = (booking: { name: string; type: 'table' | 'ticket'; price?: number }) => {
    setBookingItem(booking);
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white text-[#222222] flex flex-col font-sans selection:bg-[#FF385C] selection:text-white">
      {/* 1. Header & Navigation (Airbnb style: Desktop header, Mobile fixed bottom bar) */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        wishlistCount={wishlist.length}
        onOpenWishlist={() => handleOpenAccount('wishlist')}
        onOpenAccount={handleOpenAccount}
        onOpenSOS={() => setSosModalOpen(true)}
        language={language}
        setLanguage={setLanguage}
      />

      {/* 2. Main Page View Container */}
      <main className={`flex-1 ${activeTab === 'nearby' ? 'pb-16 md:pb-0' : 'pb-20 md:pb-8'}`}>
        {/* Page 1: Khám phá (Explore Page - Default) */}
        {activeTab === 'explore' && (
          <ExplorePage
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onSelectItem={(item) => setSelectedDetailItem(item)}
            onQuickPlanTrip={handleQuickPlanTrip}
            onNavigateToNearby={() => setActiveTab('nearby')}
          />
        )}

        {/* Page 2: Xung quanh (NearbyPage - Interactive Map & Nearby Places) */}
        {activeTab === 'nearby' && (
          <NearbyPage
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onSelectItem={(item) => setSelectedDetailItem(item)}
            onAddToItinerary={handleAddToItinerary}
            onAskAI={handleAskAIAboutItem}
          />
        )}

        {/* Page 3: Trợ lý AI (AIAssistantPage) */}
        {activeTab === 'ai' && (
          <AIAssistantPage
            initialQuery={aiAssistantSeedQuery}
            onSelectItem={(item) => setSelectedDetailItem(item)}
            onAddToItinerary={handleAddToItinerary}
            onProceedToItinerary={handleProceedToItineraryFromAI}
          />
        )}

        {/* Page 4: Lịch trình (ItineraryPage with Split-screen Leaflet Map & Survival Tips) */}
        {activeTab === 'itinerary' && (
          <ItineraryPage
            initialPlanParams={itineraryParams}
            onSelectItem={(item) => setSelectedDetailItem(item)}
            onOpenBooking={handleOpenBooking}
            onAskAIAboutTrip={(question) => {
              setAiAssistantSeedQuery(question);
              setActiveTab('ai');
            }}
            pendingAddItem={pendingAddItem}
            onClearPendingItem={() => setPendingAddItem(null)}
          />
        )}

        {/* Page 5: Quản lý chi tiêu (BudgetTracker) */}
        {activeTab === 'budget' && (
          <BudgetTracker 
            onBack={() => {
              setActiveTab('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
          />
        )}
      </main>

      {/* 3. Global Item Detail Modal (for POI, FoodSpot, Festival, or Province) */}
      <ItemDetailModal
        isOpen={Boolean(selectedDetailItem)}
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
        isWishlisted={selectedDetailItem ? wishlist.includes(selectedDetailItem.id) : false}
        onToggleWishlist={handleToggleWishlist}
        onAddToItinerary={handleAddToItinerary}
        onAskAI={handleAskAIAboutItem}
        onOpenBooking={handleOpenBooking}
        googlePlaceId={(selectedDetailItem as any)?.googlePlaceId}
      />

      {/* 4. Account Drawer (Wishlist, Travel DNA, Budget Tracker, Emergency) */}
      <AccountDrawer
        isOpen={accountDrawerOpen}
        onClose={() => setAccountDrawerOpen(false)}
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
        onSelectItem={(item) => setSelectedDetailItem(item)}
        initialTab={accountDrawerTab}
        onOpenFullBudget={() => {
          setAccountDrawerOpen(false);
          setActiveTab('budget');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 5. Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        item={bookingItem}
      />

      {/* 6. SOS Emergency Modal */}
      <SOSModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
      />

      {/* 7. Airbnb-style Clean Minimal Footer */}
      <footer className="border-t border-[#E5E5E5] bg-white py-8 text-xs text-[#717171] hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base text-[#FF385C]">vietgo.</span>
            <span>© 2026 VietGo Inc. Trợ lý du lịch thông minh Việt Nam</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-[#717171]">
            <span className="hover:underline cursor-pointer" onClick={() => handleOpenAccount('dna')}>
              Hồ sơ du khách
            </span>
            <span>•</span>
            <span className="hover:underline cursor-pointer" onClick={() => setActiveTab('budget')}>
              Quản lý chi tiêu
            </span>
            <span>•</span>
            <span className="hover:underline cursor-pointer" onClick={() => handleOpenAccount('wishlist')}>
              Yêu thích ({wishlist.length})
            </span>
            <span>•</span>
            <span 
              className="text-rose-600 font-bold hover:underline cursor-pointer" 
              onClick={() => setSosModalOpen(true)}
            >
              Cứu hộ khẩn cấp: 112 / 113
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
