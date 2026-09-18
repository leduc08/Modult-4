import React, { useEffect, useState } from 'react';
import { 
  X, 
  Heart, 
  Share2, 
  MapPin, 
  Star, 
  Clock, 
  Calendar, 
  Ticket, 
  Sparkles, 
  Check, 
  Bot, 
  PlusCircle, 
  Compass, 
  Utensils, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { POI, FoodSpot, Festival, Province } from '../types';

export type DetailItem = 
  | ({ itemType: 'poi' } & POI)
  | ({ itemType: 'food' } & FoodSpot)
  | ({ itemType: 'festival' } & Festival)
  | ({ itemType: 'province' } & Province);

interface ItemDetailModalProps {
  item: DetailItem | null;
  isOpen: boolean;
  onClose: () => void;
  isWishlisted: boolean;
  onToggleWishlist: (id: string) => void;
  onAddToItinerary?: (item: DetailItem) => void;
  onAskAI?: (item: DetailItem) => void;
  onOpenBooking?: (booking: { name: string; type: 'table' | 'ticket'; price?: number }) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  isWishlisted,
  onToggleWishlist,
  onAddToItinerary,
  onAskAI,
  onOpenBooking,
}) => {
  const [copied, setCopied] = useState(false);
  const [addedToPlan, setAddedToPlan] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAdd = () => {
    if (onAddToItinerary) {
      onAddToItinerary(item);
      setAddedToPlan(true);
      setTimeout(() => setAddedToPlan(false), 2000);
    }
  };

  // Derive common fields
  const title = 'dishName' in item ? `${item.dishName} (${item.name})` : item.name;
  const address = 'address' in item ? item.address : 'provinceName' in item ? item.provinceName : ('tagline' in item ? item.tagline : 'Việt Nam');
  const imageUrl = item.imageUrl;
  const rating = 'rating' in item ? item.rating : 4.9;
  const reviewCount = 'reviewCount' in item ? item.reviewCount : 120;
  const description = item.description;

  // Pricing formatting
  let priceText = 'Miễn phí tham quan';
  let priceNumber: number | undefined = undefined;
  if ('ticketPrice' in item && typeof item.ticketPrice === 'number') {
    priceNumber = item.ticketPrice;
    priceText = item.ticketPrice > 0 ? `${item.ticketPrice.toLocaleString('vi-VN')} VNĐ / vé` : 'Miễn phí vào cửa';
  } else if ('priceRange' in item) {
    priceNumber = 'avgPrice' in item ? item.avgPrice : undefined;
    priceText = `${item.priceRange} / món`;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-4xl min-h-screen sm:min-h-0 sm:max-h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative my-auto border border-[#E5E5E5]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs px-5 sm:px-8 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#717171]">
            <span className="uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F7F7F7] border border-[#E5E5E5] text-[#222222]">
              {item.itemType === 'poi' ? '🏛️ Điểm tham quan' : item.itemType === 'food' ? '🍲 Ẩm thực bản địa' : item.itemType === 'festival' ? '🎉 Lễ hội' : '📍 Tỉnh thành'}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:inline truncate max-w-[200px]">{address}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Share button */}
            <button
              onClick={handleShare}
              className="p-2 rounded-full hover:bg-[#F7F7F7] text-[#222222] transition-colors relative cursor-pointer"
              title="Chia sẻ liên kết"
            >
              <Share2 className="w-4 h-4" />
              {copied && (
                <span className="absolute right-0 top-10 bg-[#222222] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap shadow-md">
                  Đã sao chép!
                </span>
              )}
            </button>

            {/* Wishlist button */}
            <button
              onClick={() => onToggleWishlist(item.id)}
              className="p-2 rounded-full hover:bg-[#F7F7F7] transition-colors cursor-pointer"
              title="Lưu vào yêu thích"
            >
              <Heart 
                className={`w-4 h-4 transition-transform active:scale-125 ${
                  isWishlisted ? 'fill-[#FF385C] text-[#FF385C]' : 'text-[#222222]'
                }`} 
              />
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-[#F7F7F7] text-[#222222] transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
          {/* Title & Key Meta */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#222222] tracking-tight">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[#717171]">
              <div className="flex items-center gap-1 font-bold text-[#222222]">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{rating.toFixed(1)}</span>
                <span className="text-[#717171] font-normal">({reviewCount} đánh giá)</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1 text-[#222222]">
                <MapPin className="w-3.5 h-3.5 text-[#FF385C]" />
                <span>{address}</span>
              </div>
            </div>
          </div>

          {/* Photo Showcase */}
          <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-[#F7F7F7] aspect-[16/9] sm:aspect-[21/9] relative shadow-xs">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback travel image
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1528127269322-539801943592?w=1000&auto=format&fit=crop&q=80';
              }}
            />
          </div>

          {/* Two-Column Grid: Left details, Right Action Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
            {/* Left 2 Cols: Structured Sections */}
            <div className="lg:col-span-2 space-y-8">
              {/* Section 1: Giới thiệu */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-[#222222] border-b border-[#E5E5E5] pb-2">
                  Giới thiệu
                </h2>
                <p className="text-sm text-[#484848] leading-relaxed">
                  {description}
                </p>
              </section>

              {/* Section 2: Điểm nổi bật & Thẻ đặc trưng */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-[#222222] border-b border-[#E5E5E5] pb-2">
                  Điểm nổi bật
                </h2>
                <div className="flex flex-wrap gap-2">
                  {'tags' in item && item.tags && item.tags.map((tag, i) => (
                    <span 
                      key={i} 
                      className="px-3 py-1 rounded-full bg-[#F7F7F7] border border-[#E5E5E5] text-xs font-semibold text-[#222222]"
                    >
                      #{tag}
                    </span>
                  ))}
                  {'signatureDish' in item && (
                    <div className="w-full p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900">
                      <strong>Món tủ nhất định phải thử:</strong> {item.signatureDish}
                    </div>
                  )}
                  {'highlights' in item && Array.isArray(item.highlights) && (
                    <ul className="w-full space-y-1.5 list-disc list-inside text-xs sm:text-sm text-[#484848]">
                      {item.highlights.map((hl, i) => (
                        <li key={i}>{hl}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>

              {/* Section 3: Thông tin tham quan / Thực khách */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-[#222222] border-b border-[#E5E5E5] pb-2">
                  Thông tin tham quan & Trải nghiệm
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  {'openingHours' in item && (
                    <div className="p-3.5 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#222222]">
                        <Clock className="w-4 h-4 text-[#717171]" />
                        <span>Giờ mở cửa</span>
                      </div>
                      <p className="text-[#717171]">{item.openingHours}</p>
                    </div>
                  )}

                  {'bestTime' in item && (
                    <div className="p-3.5 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#222222]">
                        <Clock className="w-4 h-4 text-[#717171]" />
                        <span>Thời điểm ngon nhất</span>
                      </div>
                      <p className="text-[#717171]">{item.bestTime}</p>
                    </div>
                  )}

                  {'solarDate' in item && (
                    <div className="p-3.5 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-[#222222]">
                        <Calendar className="w-4 h-4 text-[#717171]" />
                        <span>Thời gian tổ chức</span>
                      </div>
                      <p className="text-[#717171]">{item.solarDate} (Âm lịch: {item.lunarDate})</p>
                    </div>
                  )}

                  <div className="p-3.5 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-[#222222]">
                      <Ticket className="w-4 h-4 text-[#717171]" />
                      <span>Chi phí tham khảo</span>
                    </div>
                    <p className="text-[#222222] font-semibold">{priceText}</p>
                  </div>
                </div>

                {/* Local insider tip */}
                {'localTips' in item && item.localTips && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs sm:text-sm text-emerald-950 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Mẹo thực chiến bản địa:</strong> {item.localTips}
                    </div>
                  </div>
                )}
              </section>

              {/* Section 4: Vị trí & Bản đồ */}
              <section className="space-y-3">
                <h2 className="text-base sm:text-lg font-bold text-[#222222] border-b border-[#E5E5E5] pb-2">
                  Vị trí
                </h2>
                <div className="p-4 rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-between gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#FF385C] shrink-0" />
                    <span className="text-[#222222] font-medium">{address}</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title} ${address}`)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#FF385C] hover:underline shrink-0"
                  >
                    <span>Mở Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </section>
            </div>

            {/* Right Column: Desktop Action Card (Airbnb reservation style) */}
            <div className="hidden lg:block">
              <div className="sticky top-6 rounded-3xl border border-[#E5E5E5] p-6 shadow-md bg-white space-y-5">
                <div className="space-y-1">
                  <div className="text-xs text-[#717171] uppercase tracking-wider font-bold">
                    Chi phí ước tính
                  </div>
                  <div className="text-xl font-black text-[#222222]">
                    {priceText}
                  </div>
                </div>

                <div className="space-y-2.5 pt-2">
                  {/* Action 1: Add to Itinerary */}
                  <button
                    onClick={handleAdd}
                    className="w-full py-3 px-4 rounded-2xl bg-[#FF385C] hover:bg-[#E00B41] text-white text-xs sm:text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {addedToPlan ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Đã thêm vào lịch trình!</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-4 h-4" />
                        <span>Thêm vào lịch trình</span>
                      </>
                    )}
                  </button>

                  {/* Action 2: Ask AI about this place */}
                  {onAskAI && (
                    <button
                      onClick={() => {
                        onClose();
                        onAskAI(item);
                      }}
                      className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-[#F7F7F7] border border-[#222222] text-[#222222] text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Bot className="w-4 h-4 text-[#FF385C]" />
                      <span>Hỏi Trợ lý AI về điểm này</span>
                    </button>
                  )}

                  {/* Action 3: Booking if applicable */}
                  {onOpenBooking && (item.itemType === 'food' || ('ticketPrice' in item && item.ticketPrice > 0)) && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenBooking({
                          name: title,
                          type: item.itemType === 'food' ? 'table' : 'ticket',
                          price: priceNumber
                        });
                      }}
                      className="w-full py-2.5 px-4 rounded-2xl bg-[#F7F7F7] hover:bg-[#E5E5E5] text-[#222222] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {item.itemType === 'food' ? (
                        <>
                          <Utensils className="w-3.5 h-3.5 text-amber-600" />
                          <span>Đặt bàn ưu tiên (Demo)</span>
                        </>
                      ) : (
                        <>
                          <Ticket className="w-3.5 h-3.5 text-[#FF385C]" />
                          <span>Đặt vé giữ chỗ (Demo)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E5E5E5] text-[11px] text-[#717171] leading-snug flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span>Dữ liệu được bảo chứng & chuẩn hóa theo Cẩm nang du lịch Việt Nam 2026.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Fixed Bottom Action Bar */}
        <div className="lg:hidden sticky bottom-0 bg-white border-t border-[#E5E5E5] p-4 px-5 flex items-center justify-between gap-4 z-20 shadow-lg">
          <div>
            <div className="text-[11px] text-[#717171] font-semibold">Chi phí tham khảo</div>
            <div className="text-sm font-extrabold text-[#222222] truncate max-w-[150px]">
              {priceText}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onAskAI && (
              <button
                onClick={() => {
                  onClose();
                  onAskAI(item);
                }}
                className="p-3 rounded-2xl border border-[#E5E5E5] bg-white hover:bg-[#F7F7F7] text-[#222222] cursor-pointer"
                title="Hỏi AI"
              >
                <Bot className="w-4 h-4 text-[#FF385C]" />
              </button>
            )}

            <button
              onClick={handleAdd}
              className="py-3 px-5 rounded-2xl bg-[#FF385C] hover:bg-[#E00B41] text-white text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
            >
              {addedToPlan ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Đã thêm</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Thêm vào lịch trình</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
