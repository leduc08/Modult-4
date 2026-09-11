import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Users, 
  Phone, 
  User, 
  Sparkles, 
  QrCode,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    name: string;
    type: 'table' | 'ticket';
    price?: number;
  } | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  if (!isOpen || !item) return null;

  const [date, setDate] = useState('2026-04-15');
  const [time, setTime] = useState('18:30');
  const [guestCount, setGuestCount] = useState(2);
  const [customerName, setCustomerName] = useState('Nguyễn Văn An');
  const [phone, setPhone] = useState('0912 345 678');
  const [notes, setNotes] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [bookingCode, setBookingCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = `VG-${Math.floor(100000 + Math.random() * 900000)}`;
    setBookingCode(code);
    setIsConfirmed(true);

    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.5 }
      });
    } catch (e) {}
  };

  const handleResetAndClose = () => {
    setIsConfirmed(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={handleResetAndClose}
          className="absolute top-5 right-5 p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isConfirmed ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-bold uppercase">
                {item.type === 'table' ? '🍽️ Đặt bàn giữ chỗ ưu tiên' : '🎟️ Giữ chỗ vé tham quan / Show'}
              </span>
              <h2 className="text-lg font-extrabold text-stone-900 leading-tight">
                {item.name}
              </h2>
              {item.price !== undefined && item.price > 0 && (
                <p className="text-xs text-amber-700 font-bold">
                  Đơn giá: {item.price.toLocaleString()} VNĐ / người
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Ngày đến</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Khung giờ</span>
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  <span>Số lượng khách</span>
                </label>
                <select
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-900 focus:outline-hidden"
                >
                  {[1, 2, 3, 4, 5, 6, 8, 10, 15].map((n) => (
                    <option key={n} value={n}>{n} người</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    <span>Họ tên liên hệ</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-600 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Số điện thoại</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-stone-600">Yêu cầu đặc biệt (Vị trí bàn, không hành, v.v.)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: Bàn ngoài trời thoáng mát, không cay cho bé..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                />
              </div>

              <div className="bg-stone-50 p-3 rounded-xl text-[11px] text-stone-500 border border-stone-200/60 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Không cần đặt cọc trước. Quý khách vui lòng đến đúng giờ để giữ chỗ tốt nhất.</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-md"
              >
                Xác Nhận Giữ Chỗ Ngay
              </button>
            </form>
          </div>
        ) : (
          /* Confirmation Screen with QR Voucher */
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-stone-900">Giữ Chỗ Thành Công!</h3>
              <p className="text-xs text-stone-500">
                Mã xác nhận điện tử của bạn đã sẵn sàng.
              </p>
            </div>

            {/* Voucher Card */}
            <div className="bg-stone-50 border-2 border-dashed border-stone-300 rounded-2xl p-5 space-y-3 text-left">
              <div className="flex justify-between items-center border-b border-stone-200 pb-2">
                <span className="text-xs font-bold text-stone-500">MÃ ĐẶT CHỖ:</span>
                <span className="text-sm font-black text-red-600 tracking-wider">{bookingCode}</span>
              </div>

              <div className="text-xs space-y-1">
                <div><strong>Địa điểm:</strong> {item.name}</div>
                <div><strong>Thời gian:</strong> {time} ngày {date} ({guestCount} người)</div>
                <div><strong>Khách hàng:</strong> {customerName} - {phone}</div>
              </div>

              {/* QR Mock */}
              <div className="pt-2 flex items-center justify-center gap-3">
                <div className="p-2 bg-white rounded-xl border border-stone-200 shadow-2xs">
                  <QrCode className="w-16 h-16 text-stone-800" />
                </div>
                <div className="text-[11px] text-stone-500 max-w-[180px] leading-tight">
                  Xuất trình mã QR này tại quầy để nhận ưu đãi đối tác VietGo AI.
                </div>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              Hoàn tất
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
