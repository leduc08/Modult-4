import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { AIChatbot } from './components/AIChatbot';
import { TripPlanner } from './components/TripPlanner';
import { SmartMap } from './components/SmartMap';
import { FoodDirectory } from './components/FoodDirectory';
import { FestivalsEvents } from './components/FestivalsEvents';
import { TipsAndSouvenirs } from './components/TipsAndSouvenirs';
import { BudgetTracker } from './components/BudgetTracker';
import { TravelDNAProfile } from './components/TravelDNAProfile';
import { BookingModal } from './components/BookingModal';
import { SOSModal } from './components/SOSModal';
import { LanguageCode } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [language, setLanguage] = useState<LanguageCode>('vi');

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingItem, setBookingItem] = useState<{
    name: string;
    type: 'table' | 'ticket';
    price?: number;
  } | null>(null);

  // SOS Modal State
  const [sosModalOpen, setSosModalOpen] = useState(false);

  // Cross tab navigation data passing (e.g., coordinates for map)
  const [mapTarget, setMapTarget] = useState<{ lat?: number; lng?: number; provinceName?: string } | undefined>(undefined);

  const handleNavigateTab = (tab: string, extraData?: any) => {
    if (tab === 'map' && extraData) {
      setMapTarget(extraData);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenBooking = (item: { name: string; type: 'table' | 'ticket'; price?: number }) => {
    setBookingItem(item);
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-900 flex flex-col font-sans selection:bg-red-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        onOpenSOS={() => setSosModalOpen(true)}
      />

      {/* Main Content View */}
      <main className="flex-1 pb-16">
        {activeTab === 'chat' && (
          <AIChatbot
            onNavigateTab={handleNavigateTab}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {activeTab === 'planner' && (
          <TripPlanner
            onNavigateTab={handleNavigateTab}
            onOpenBooking={handleOpenBooking}
          />
        )}

        {activeTab === 'map' && (
          <SmartMap
            onOpenBooking={handleOpenBooking}
            initialTarget={mapTarget}
          />
        )}

        {activeTab === 'food' && (
          <FoodDirectory
            onOpenBooking={handleOpenBooking}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'festivals' && (
          <FestivalsEvents
            onOpenBooking={handleOpenBooking}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'tips' && (
          <TipsAndSouvenirs
            onOpenSOS={() => setSosModalOpen(true)}
          />
        )}

        {activeTab === 'budget' && (
          <BudgetTracker />
        )}

        {activeTab === 'dna' && (
          <TravelDNAProfile />
        )}
      </main>

      {/* Global Booking Modal */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        item={bookingItem}
      />

      {/* SOS Emergency Hotline Modal */}
      <SOSModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-stone-200 bg-white/70 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-bold text-stone-700">
            <span>🇻🇳 VietGo AI Hub</span>
            <span className="font-normal text-stone-400">— Trợ lý du lịch thông minh toàn diện Việt Nam</span>
          </div>
          <p className="text-stone-400 text-[11px]">
            Được bảo vệ bởi thuật toán kiểm chứng bản xứ & RAG Tri thức chuẩn hóa 34+ Tỉnh thành.
          </p>
        </div>
      </footer>
    </div>
  );
}
