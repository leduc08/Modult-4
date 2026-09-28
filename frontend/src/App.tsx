import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { VerifiedExplorePage } from './components/VerifiedExplorePage';
import { PlannerHome } from './components/PlannerHome';
import { VerifiedPlanPage } from './components/VerifiedPlanPage';
import { CITY_NAMES, type VerifiedTrip } from './data/tripPlaces';
import { NearbyPage } from './components/NearbyPage';
import { AIAssistantPage } from './components/AIAssistantPage';
import { ItineraryPage } from './components/ItineraryPage';
import { ItemDetailModal, DetailItem } from './components/ItemDetailModal';
import { AccountDrawer } from './components/AccountDrawer';
import { BookingModal } from './components/BookingModal';
import { SOSModal } from './components/SOSModal';
import { BudgetTracker } from './components/BudgetTracker';
import { LanguageCode, AccountTab, AuthUser } from './types';
import { getUser } from './services/authService';
import { signOutGoogle } from './components/GoogleSignInButton';
import { LegalModal, LegalDocId } from './components/LegalModal';

export default function App() {
  // Navigation tabs: 'explore' (default) | 'nearby' | 'ai' | 'itinerary' | 'account' | 'budget'
  const [activeTab, setActiveTab] = useState<'home' | 'explore' | 'nearby' | 'ai' | 'itinerary' | 'account' | 'budget'>('home');
  const [preselectedCity, setPreselectedCity] = useState('');
  const [verifiedTrip, setVerifiedTrip] = useState<VerifiedTrip | null>(() => { try { const saved = localStorage.getItem('vietgo_verified_trip'); return saved ? JSON.parse(saved) : null; } catch { return null; } });
  const [savedTrip, setSavedTrip] = useState<VerifiedTrip | null>(() => { try { const saved = localStorage.getItem('vietgo_verified_trip'); return saved ? JSON.parse(saved) : null; } catch { return null; } });
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
  const [accountDrawerTab, setAccountDrawerTab] = useState<AccountTab>('wishlist');

  // Auth state (persisted in localStorage) — dùng chung cho Navbar & AccountDrawer
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('vietgo_user');
      const parsed = saved ? JSON.parse(saved) : null;
      // Lấy lại dữ liệu mới nhất từ kho tài khoản; phiên cũ / tài khoản đã xoá -> đăng xuất
      return parsed?.id ? getUser(parsed.id) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('vietgo_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('vietgo_user');
      }
    } catch (e) {}
  }, [currentUser]);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingItem, setBookingItem] = useState<{
    name: string;
    type: 'table' | 'ticket';
    price?: number;
  } | null>(null);

  // SOS Modal State
  const [sosModalOpen, setSosModalOpen] = useState(false);

  // Legal Modal State (Điều khoản dịch vụ / Chính sách quyền riêng tư)
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null);

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

  useEffect(() => { try { if (verifiedTrip) localStorage.setItem('vietgo_verified_trip', JSON.stringify(verifiedTrip)); } catch {} }, [verifiedTrip]);

  // Handlers
  const handleOpenAccount = (tab: AccountTab = 'wishlist') => {
    if (tab === 'budget') {
      setActiveTab('budget');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setAccountDrawerTab(tab);
    setAccountDrawerOpen(true);
  };

  const cityIdFor = (destination: string) => Object.entries(CITY_NAMES).find(([, name]) => name.toLocaleLowerCase('vi').includes(destination.toLocaleLowerCase('vi')) || destination.toLocaleLowerCase('vi').includes(name.toLocaleLowerCase('vi')))?.[0] || '';

  const handleQuickPlanTrip = (params: { destination: string; days: number; guests: number }) => {
    setItineraryParams(params);
    setPreselectedCity(cityIdFor(params.destination));
    setActiveTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToItineraryFromAI = (params: { destination: string; days: number; guests: number; style?: string }) => handleQuickPlanTrip(params);

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
        currentUser={currentUser}
        onOpenSOS={() => setSosModalOpen(true)}
        language={language}
        setLanguage={setLanguage}
      />

      {/* 2. Main Page View Container */}
      <main className={`flex-1 ${activeTab === 'nearby' ? 'pb-16 md:pb-0' : 'pb-20 md:pb-8'}`}>
        {activeTab === 'home' && <PlannerHome onPlan={(trip) => { setVerifiedTrip(trip); setSavedTrip(trip); setActiveTab('itinerary'); }} savedTrip={savedTrip} onContinue={() => { if (savedTrip) { setVerifiedTrip(savedTrip); setActiveTab('itinerary'); } }} preselectedCity={preselectedCity} initialTrip={verifiedTrip} />}

        {activeTab === 'explore' && <VerifiedExplorePage onPlanCity={(cityId) => { setPreselectedCity(cityId); setActiveTab('home'); }} onSelectItem={(item) => setSelectedDetailItem(item)} />}

        {/* Page 2: Xung quanh (NearbyPage - Interactive Map & Nearby Places) */}
        {activeTab === 'nearby' && (
          <NearbyPage
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onSelectItem={(item) => setSelectedDetailItem(item)}
            onAddToItinerary={handleAddToItinerary}
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

        {activeTab === 'itinerary' && (verifiedTrip ? <VerifiedPlanPage trip={verifiedTrip} onChange={setVerifiedTrip} onBack={() => setActiveTab('home')} onSave={(trip) => { setSavedTrip(trip); setVerifiedTrip(trip); }} /> : <ItineraryPage initialPlanParams={itineraryParams} onSelectItem={(item) => setSelectedDetailItem(item)} onOpenBooking={handleOpenBooking} onAskAIAboutTrip={(question) => { setAiAssistantSeedQuery(question); setActiveTab('ai'); }} pendingAddItem={pendingAddItem} onClearPendingItem={() => setPendingAddItem(null)} />)}

        {/* Page 5: Quản lý chi tiêu (BudgetTracker) */}
        {activeTab === 'budget' && (
          <BudgetTracker
            // Sổ chi tiêu riêng theo tài khoản; đổi tài khoản → nạp lại đúng dữ liệu
            key={currentUser?.id ?? 'guest'}
            storageScope={currentUser?.id ?? 'guest'}
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

      {/* 4. Account Drawer (Wishlist, Hồ sơ cá nhân + Travel DNA, Budget Tracker, Emergency) */}
      <AccountDrawer
        isOpen={accountDrawerOpen}
        onClose={() => setAccountDrawerOpen(false)}
        wishlist={wishlist}
        onToggleWishlist={handleToggleWishlist}
        onSelectItem={(item) => setSelectedDetailItem(item)}
        initialTab={accountDrawerTab}
        currentUser={currentUser}
        onLogin={setCurrentUser}
        onLogout={() => {
          setCurrentUser(null);
          signOutGoogle();
        }}
        onUpdateUser={setCurrentUser}
        onOpenLegal={setLegalDoc}
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
            <span className="hover:underline cursor-pointer" onClick={() => handleOpenAccount('profile')}>
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
            <span>•</span>
            <span className="hover:underline cursor-pointer" onClick={() => setLegalDoc('terms')}>
              Điều khoản dịch vụ
            </span>
            <span>•</span>
            <span className="hover:underline cursor-pointer" onClick={() => setLegalDoc('privacy')}>
              Quyền riêng tư
            </span>
          </div>
        </div>
      </footer>

      {/* 8. Điều khoản dịch vụ & Chính sách quyền riêng tư */}
      <LegalModal isOpen={legalDoc !== null} initialDoc={legalDoc ?? 'terms'} onClose={() => setLegalDoc(null)} />
    </div>
  );
}
