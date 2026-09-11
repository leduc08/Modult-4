import React from 'react';
import { 
  X, 
  PhoneCall, 
  ShieldAlert, 
  AlertTriangle, 
  HeartHandshake, 
  Building2, 
  Phone
} from 'lucide-react';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const hotlines = [
    { number: '112', title: 'Cứu Nạn & Cứu Hộ Khẩn Cấp Toàn Quốc', desc: 'Yêu cầu tìm kiếm cứu nạn khi đi rừng, leo núi, lạc đường, thiên tai, lũ quét.' },
    { number: '113', title: 'Công An & Cảnh Sát Trực Ban', desc: 'Trình báo trộm cắp, cướp giật, gây rối trật tự công cộng, lừa đảo.' },
    { number: '114', title: 'Phòng Cháy Chữa Cháy & Cứu Nạn', desc: 'Hỏa hoạn, sập đổ công trình, sự cố nguy hiểm.' },
    { number: '115', title: 'Cấp Cứu Y Tế Toàn Quốc', desc: 'Tai nạn giao thông, ngộ độc thực phẩm nặng, cấp cứu sức khỏe.' }
  ];

  const localTourismHotlines = [
    { city: 'Hà Nội', phone: '1800 556 896', name: 'Trung tâm Hỗ trợ Khách Du lịch Hà Nội' },
    { city: 'Đà Nẵng', phone: '0236 3550 111', name: 'Trung tâm Hỗ trợ Du khách Đà Nẵng (24/7)' },
    { city: 'Quảng Nam (Hội An)', phone: '0235 3666 333', name: 'Hotline Phản ánh Du lịch Hội An' },
    { city: 'Lâm Đồng (Đà Lạt)', phone: '0912 905 550', name: 'Đường dây nóng Du lịch Đà Lạt' },
    { city: 'TP. Hồ Chí Minh', phone: '1022 (Nhánh 8)', name: 'Tổng đài Tiếp nhận Phản ánh Du lịch TP.HCM' },
    { city: 'Kiên Giang (Phú Quốc)', phone: '0297 3846 055', name: 'Hỗ trợ Du lịch Phú Quốc' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 relative max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 space-y-5">
        <div className="flex justify-between items-start border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-stone-900">
                Đường Dây Nóng Cứu Hộ & Hỗ Trợ Du Khách
              </h2>
              <p className="text-xs text-stone-500">Hỗ trợ khẩn cấp 24/7 trên toàn lãnh thổ Việt Nam</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* National Emergency Grid */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
            Số khẩn cấp quốc gia (Miễn phí cuộc gọi)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {hotlines.map((h) => (
              <a
                key={h.number}
                href={`tel:${h.number}`}
                className="p-3.5 rounded-2xl bg-red-50/70 hover:bg-red-100 border border-red-200 transition-all flex items-start gap-3 group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-xs">
                  {h.number}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold text-xs text-red-950 group-hover:text-red-700 transition-colors">
                    {h.title}
                  </div>
                  <div className="text-[10px] text-stone-600 mt-0.5 leading-snug">
                    {h.desc}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Provincial Tourism Hotlines */}
        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-600">
            Đường dây nóng hỗ trợ du lịch địa phương (Chống chặt chém & Lừa đảo)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {localTourismHotlines.map((item, idx) => (
              <a
                key={idx}
                href={`tel:${item.phone.replace(/[^0-9]/g, '')}`}
                className="p-3 rounded-xl border border-stone-200 hover:border-stone-400 bg-stone-50 hover:bg-white transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-stone-900">{item.city}</div>
                  <div className="text-[11px] text-stone-500 truncate max-w-[150px]">{item.name}</div>
                </div>
                <span className="font-extrabold text-red-600 font-mono text-xs">{item.phone}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Tourist Safety Protocol Box */}
        <div className="p-3.5 rounded-2xl bg-stone-100 text-stone-700 text-xs space-y-1.5 border border-stone-200">
          <div className="font-bold text-stone-900 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span>Quy tắc ứng phó khi gặp sự cố chặt chém:</span>
          </div>
          <ul className="text-[11px] space-y-1 list-disc pl-4 text-stone-600 leading-normal">
            <li>Luôn chụp ảnh thực đơn hoặc bảng giá niêm yết trước khi gọi món.</li>
            <li>Giữ lại hóa đơn thanh toán hoặc ghi âm/chụp ảnh chứng từ.</li>
            <li>Gọi ngay đến hotline du lịch địa phương hoặc báo công an phường sở tại nếu bị ép buộc trả tiền bất hợp lý.</li>
          </ul>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
        >
          Đóng cửa sổ
        </button>
      </div>
    </div>
  );
};
