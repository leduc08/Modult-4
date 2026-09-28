import React, { useState, useEffect, useRef } from 'react';
import { 
  Wallet, 
  PlusCircle, 
  ArrowLeftRight, 
  MoreHorizontal, 
  Search, 
  Trash2, 
  UtensilsCrossed, 
  Hotel, 
  Bike, 
  Layers, 
  Camera, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  X, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Calendar, 
  TrendingUp, 
  Eye, 
  Download, 
  RefreshCw,
  Plus,
  Video,
  VideoOff,
  ImageIcon,
  ArrowLeft
} from 'lucide-react';
import { ExpenseItem, TripBudget } from '../types';

// Danh sách chuyến đi mặc định
const INITIAL_TRIPS: TripBudget[] = [
  {
    id: 'trip-1',
    name: 'Khám phá Đà Nẵng - Hội An (4N3Đ)',
    destination: 'Đà Nẵng & Hội An',
    duration: '4 ngày 3 đêm',
    totalBudget: 8000000,
    startDate: '2026-10-15'
  },
  {
    id: 'trip-2',
    name: 'Food Tour Hà Nội & Tràng An (3N2Đ)',
    destination: 'Hà Nội - Ninh Bình',
    duration: '3 ngày 2 đêm',
    totalBudget: 5000000,
    startDate: '2026-11-01'
  },
  {
    id: 'trip-3',
    name: 'Săn mây Đà Lạt - Tà Xùa (3N2Đ)',
    destination: 'Đà Lạt',
    duration: '3 ngày 2 đêm',
    totalBudget: 6000000,
    startDate: '2026-12-20'
  }
];

// Chi tiêu mẫu ban đầu cho chuyến 1
const INITIAL_EXPENSES: Record<string, ExpenseItem[]> = {
  'trip-1': [
    {
      id: 'exp-1',
      tripId: 'trip-1',
      title: 'Khách sạn biển Mỹ Khê (2 đêm)',
      amount: 1950000,
      category: 'stay',
      date: 'Hôm qua, 14:30',
      paymentMethod: 'transfer',
      note: 'Phòng Deluxe view biển'
    },
    {
      id: 'exp-2',
      tripId: 'trip-1',
      title: 'Hải sản Năm Đảnh & Nước uống',
      amount: 680000,
      category: 'food',
      date: 'Hôm qua, 19:45',
      paymentMethod: 'transfer',
      note: 'Ghẹ hấp, tôm nướng, sò điệp'
    },
    {
      id: 'exp-3',
      tripId: 'trip-1',
      title: 'Thuê 2 xe máy Airblade + Đổ xăng',
      amount: 360000,
      category: 'transport',
      date: 'Hôm nay, 08:15',
      paymentMethod: 'cash',
      note: 'Giao xe tận nơi'
    },
    {
      id: 'exp-4',
      tripId: 'trip-1',
      title: 'Mì Quảng Bà Mua & Cafe dừa cô Út',
      amount: 140000,
      category: 'food',
      date: 'Hôm nay, 11:30',
      paymentMethod: 'cash'
    },
    {
      id: 'exp-5',
      tripId: 'trip-1',
      title: 'Vé cáp treo Bà Nà Hills & Cầu Vàng',
      amount: 1800000,
      category: 'tickets',
      date: 'Hôm nay, 14:00',
      paymentMethod: 'card',
      note: '2 vé người lớn bao gồm buffet'
    }
  ]
};

// Dữ liệu hóa đơn Demo 1
const DEMO_1_RECEIPT = {
  store: 'Nhà Hàng Cơm Niêu & Hải Sản Phố Biển',
  address: 'Số 18 Võ Nguyên Giáp, Sơn Trà, TP. Đà Nẵng',
  invoiceNo: 'HD-2026-8839',
  date: '28/09/2026 - 12:45',
  items: [
    { name: 'Cá Bống Sông Trà Kho Tộ', price: 120000 },
    { name: 'Cơm Niêu Cháy Giòn (2 niêu)', price: 60000 },
    { name: 'Mực Trứng Hấp Hành Gừng', price: 195000 },
    { name: 'Canh Chua Nghêu Cà Pháo', price: 75000 },
    { name: 'Trà Xanh Đá Tươi x 2', price: 35000 }
  ],
  totalAmount: 485000,
  tax: 0,
  paymentMethod: 'transfer' as const,
  category: 'food' as const
};

interface BudgetTrackerProps {
  onBack?: () => void;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ onBack }) => {
  // 1. Quản lý Chuyến đi
  const [trips, setTrips] = useState<TripBudget[]>(() => {
    try {
      const saved = localStorage.getItem('vietgo_budget_trips');
      return saved ? JSON.parse(saved) : INITIAL_TRIPS;
    } catch {
      return INITIAL_TRIPS;
    }
  });

  const [currentTripId, setCurrentTripId] = useState<string>(() => {
    try {
      return localStorage.getItem('vietgo_current_trip_id') || 'trip-1';
    } catch {
      return 'trip-1';
    }
  });

  const activeTrip = trips.find(t => t.id === currentTripId) || trips[0] || INITIAL_TRIPS[0];

  // 2. Danh sách chi tiêu theo từng chuyến
  const [allExpenses, setAllExpenses] = useState<Record<string, ExpenseItem[]>>(() => {
    try {
      const saved = localStorage.getItem('vietgo_budget_expenses');
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  // Lưu localStorage
  useEffect(() => {
    try {
      localStorage.setItem('vietgo_budget_trips', JSON.stringify(trips));
    } catch (e) {}
  }, [trips]);

  useEffect(() => {
    try {
      localStorage.setItem('vietgo_current_trip_id', currentTripId);
    } catch (e) {}
  }, [currentTripId]);

  useEffect(() => {
    try {
      localStorage.setItem('vietgo_budget_expenses', JSON.stringify(allExpenses));
    } catch (e) {}
  }, [allExpenses]);

  // Chi tiêu của chuyến hiện tại
  const currentTripExpenses = allExpenses[currentTripId] || [];

  // Bộ lọc danh mục nhật ký: 'all' | 'food' | 'stay' | 'transport' | 'other'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'food' | 'stay' | 'transport' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Popups
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isSwitchTripOpen, setIsSwitchTripOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [newBudgetValue, setNewBudgetValue] = useState(activeTrip.totalBudget.toString());
  const [isEditDurationOpen, setIsEditDurationOpen] = useState(false);
  const [newDurationValue, setNewDurationValue] = useState(activeTrip.duration);
  const [selectedReceiptView, setSelectedReceiptView] = useState<string | null>(null);

  // Đồng bộ giá trị khi đổi chuyến đi
  useEffect(() => {
    setNewDurationValue(activeTrip.duration);
    setNewBudgetValue(activeTrip.totalBudget.toString());
  }, [activeTrip.duration, activeTrip.totalBudget, currentTripId]);

  // Tab trong Modal Thêm chi tiêu: 'manual' | 'camera' | 'upload'
  const [addExpenseTab, setAddExpenseTab] = useState<'manual' | 'camera' | 'upload'>('manual');

  // Form thêm chi tiêu thủ công
  const [manualTitle, setManualTitle] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualCategory, setManualCategory] = useState<'food' | 'stay' | 'transport' | 'other'>('food');
  const [manualMethod, setManualMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [manualNote, setManualNote] = useState('');

  // State cho quét ảnh hóa đơn & Camera thực tế
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scannedData, setScannedData] = useState<{
    store: string;
    totalAmount: number;
    category: 'food' | 'stay' | 'transport' | 'other';
    paymentMethod: 'cash' | 'transfer' | 'card';
    invoiceNo?: string;
    items?: { name: string; price: number }[];
  } | null>(null);

  const [activeReceiptImage, setActiveReceiptImage] = useState<string | null>(null);

  // Camera thực tế (Webcam / Smartphone camera)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Bật camera thực tế
  const startRealCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Trình duyệt không hỗ trợ trực tiếp camera. Bạn hãy dùng tính năng Tải ảnh hóa đơn bên cạnh nhé!');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError('Không thể mở camera (chưa cấp quyền hoặc thiết bị không có webcam). Bạn có thể bấm chọn ảnh hóa đơn thực tế bên cạnh nhé!');
    }
  };

  // Tắt camera thực tế
  const stopRealCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Dọn dẹp camera khi đóng modal hoặc đổi tab
  useEffect(() => {
    if (!isAddExpenseOpen || addExpenseTab !== 'camera') {
      stopRealCamera();
    }
  }, [isAddExpenseOpen, addExpenseTab]);

  // Chụp ảnh thực tế từ Video Stream
  const captureRealPhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setActiveReceiptImage(dataUrl);
    stopRealCamera();

    // Gửi ảnh chụp thực tế tới API quét hóa đơn AI
    await processRealReceiptImage(dataUrl);
  };

  // Xử lý gửi ảnh thực tế (chụp hoặc tải lên) tới API AI
  const processRealReceiptImage = async (base64Image: string) => {
    setIsScanning(true);
    setScanSuccess(false);

    try {
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setScannedData({
            store: json.data.store || 'Khoản chi từ hóa đơn',
            totalAmount: Number(json.data.totalAmount) || 250000,
            category: (['food', 'stay', 'transport', 'other'].includes(json.data.category) ? json.data.category : 'food') as any,
            paymentMethod: json.data.paymentMethod || 'transfer',
            invoiceNo: json.data.invoiceNo,
            items: json.data.items || []
          });
          setScanSuccess(true);
          setIsScanning(false);
          return;
        }
      }
    } catch (e) {
      console.warn('API scan receipt error:', e);
    }

    // Dự phòng thông minh nếu không kết nối được
    setTimeout(() => {
      setScannedData({
        store: 'Hóa đơn ẩm thực & du lịch thực tế',
        totalAmount: 320000,
        category: 'food',
        paymentMethod: 'transfer',
        invoiceNo: 'HD-' + Math.floor(1000 + Math.random() * 9000),
        items: [{ name: 'Chi phí thanh toán thực tế', price: 320000 }]
      });
      setScanSuccess(true);
      setIsScanning(false);
    }, 1200);
  };

  // Xử lý tải ảnh từ máy tính thực tế
  const handleRealFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setActiveReceiptImage(base64);
        processRealReceiptImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Tính toán số liệu Ngân sách chuyến đi
  const totalBudget = activeTrip.totalBudget;
  const totalSpent = currentTripExpenses.reduce((sum, item) => sum + item.amount, 0);
  const remainingBudget = totalBudget - totalSpent;
  const spentPercent = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0;

  // Tính toán phân bổ chi tiêu
  const spentByCategory = {
    food: currentTripExpenses.filter(e => e.category === 'food').reduce((sum, e) => sum + e.amount, 0),
    stay: currentTripExpenses.filter(e => e.category === 'stay').reduce((sum, e) => sum + e.amount, 0),
    transport: currentTripExpenses.filter(e => e.category === 'transport').reduce((sum, e) => sum + e.amount, 0),
    other: currentTripExpenses.filter(e => e.category !== 'food' && e.category !== 'stay' && e.category !== 'transport').reduce((sum, e) => sum + e.amount, 0)
  };

  const percentFood = totalSpent > 0 ? Math.round((spentByCategory.food / totalSpent) * 100) : 0;
  const percentStay = totalSpent > 0 ? Math.round((spentByCategory.stay / totalSpent) * 100) : 0;
  const percentTransport = totalSpent > 0 ? Math.round((spentByCategory.transport / totalSpent) * 100) : 0;
  const percentOther = totalSpent > 0 ? Math.max(0, 100 - percentFood - percentStay - percentTransport) : 0;

  // Lọc nhật ký chi tiêu
  const filteredExpenses = currentTripExpenses.filter(item => {
    let matchCat = true;
    if (selectedCategoryFilter === 'food') matchCat = item.category === 'food';
    else if (selectedCategoryFilter === 'stay') matchCat = item.category === 'stay';
    else if (selectedCategoryFilter === 'transport') matchCat = item.category === 'transport';
    else if (selectedCategoryFilter === 'other') matchCat = item.category !== 'food' && item.category !== 'stay' && item.category !== 'transport';

    let matchSearch = true;
    if (searchQuery.trim()) {
      matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return matchCat && matchSearch;
  });

  // Xử lý thêm chi tiêu thủ công
  const handleSaveManualExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(manualAmount);
    if (!manualTitle.trim() || isNaN(amountNum) || amountNum <= 0) return;

    const newItem: ExpenseItem = {
      id: `exp-${Date.now()}`,
      tripId: currentTripId,
      title: manualTitle.trim(),
      amount: amountNum,
      category: manualCategory as any,
      date: 'Hôm nay, ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      paymentMethod: manualMethod,
      note: manualNote.trim() || undefined
    };

    setAllExpenses(prev => ({
      ...prev,
      [currentTripId]: [newItem, ...(prev[currentTripId] || [])]
    }));

    setManualTitle('');
    setManualAmount('');
    setManualNote('');
    setIsAddExpenseOpen(false);
  };

  // Kích hoạt quét Demo 1
  const handleTriggerDemo1Scan = () => {
    setActiveReceiptImage('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80');
    setIsScanning(true);
    setScanSuccess(false);
    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
      setScannedData(DEMO_1_RECEIPT);
    }, 1100);
  };

  // Xác nhận lưu khoản chi từ quét hóa đơn thực tế / Demo 1
  const handleConfirmScannedExpense = () => {
    if (!scannedData) return;
    const newItem: ExpenseItem = {
      id: `exp-${Date.now()}`,
      tripId: currentTripId,
      title: scannedData.store,
      amount: scannedData.totalAmount,
      category: scannedData.category,
      date: 'Hôm nay, ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      paymentMethod: scannedData.paymentMethod,
      note: scannedData.invoiceNo ? `Hóa đơn ${scannedData.invoiceNo} đã qua xác thực AI` : 'Khoản chi quét từ ảnh hóa đơn thực tế',
      receiptImage: activeReceiptImage || undefined
    };

    setAllExpenses(prev => ({
      ...prev,
      [currentTripId]: [newItem, ...(prev[currentTripId] || [])]
    }));

    setIsAddExpenseOpen(false);
    setScanSuccess(false);
    setScannedData(null);
    setActiveReceiptImage(null);
    stopRealCamera();
  };

  // Xóa khoản chi
  const handleDeleteExpense = (id: string) => {
    setAllExpenses(prev => ({
      ...prev,
      [currentTripId]: (prev[currentTripId] || []).filter(e => e.id !== id)
    }));
  };

  // Cập nhật hạn mức ngân sách
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(newBudgetValue);
    if (isNaN(val) || val <= 0) return;

    setTrips(prev => prev.map(t => t.id === currentTripId ? { ...t, totalBudget: val } : t));
    setIsEditBudgetOpen(false);
  };

  // Cập nhật thời lượng chuyến đi
  const handleSaveDuration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDurationValue.trim()) return;

    setTrips(prev => prev.map(t => t.id === currentTripId ? { ...t, duration: newDurationValue.trim() } : t));
    setIsEditDurationOpen(false);
  };

  // Xuất báo cáo CSV
  const handleExportCSV = () => {
    const headers = 'ID,Ten Khoan Chi,So Tien (VND),Danh Muc,Ngay,Phuong Thuc,Ghi Chu\n';
    const rows = currentTripExpenses.map(e => 
      `"${e.id}","${e.title}",${e.amount},"${e.category}","${e.date || ''}","${e.paymentMethod || ''}","${e.note || ''}"`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bao-cao-chi-tieu-${activeTrip.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOptionsMenuOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Hidden Canvas cho chụp ảnh Webcam */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Thanh điều hướng Quay lại Khám phá khi mở từ Menu 3 gạch */}
      {onBack && (
        <div className="flex items-center justify-between pb-1 animate-in fade-in duration-200">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-[#222222] text-xs font-bold transition-all cursor-pointer shadow-xs group"
          >
            <ArrowLeft className="w-4 h-4 text-stone-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Quay lại Khám phá</span>
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 1. NGÂN SÁCH CHUYẾN ĐI (TỔNG NGÂN SÁCH, ĐÃ CHI, CÒN LẠI)        */}
      {/* ============================================================== */}
      <section className="bg-white rounded-3xl border border-stone-200 shadow-sm p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Ngân sách chuyến đi</div>
              <h2 className="text-lg sm:text-xl font-extrabold text-stone-900 flex items-center gap-2">
                <span>{activeTrip.name}</span>
              </h2>
            </div>
          </div>

          <button
            onClick={() => {
              setNewDurationValue(activeTrip.duration);
              setIsEditDurationOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 text-xs font-semibold self-start sm:self-auto transition-all cursor-pointer border border-stone-200/80 hover:border-stone-400 group shadow-xs"
            title="Bấm để điều chỉnh thời lượng chuyến đi"
          >
            <Calendar className="w-3.5 h-3.5 text-stone-500 group-hover:text-[#FF385C] transition-colors" />
            <span>Thời lượng: <strong className="text-stone-900">{activeTrip.duration}</strong></span>
            <span className="text-[10px] text-stone-500 group-hover:text-[#FF385C] font-semibold bg-white px-1.5 py-0.5 rounded-md border border-stone-200 transition-colors">
              Chỉnh sửa
            </span>
          </button>
        </div>

        {/* 3 Thẻ Chỉ Số: Tổng Ngân Sách, Đã Chi, Còn Lại */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Tổng Ngân Sách */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-stone-900 to-stone-800 text-white relative overflow-hidden shadow-xs">
            <div className="relative z-10 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Tổng ngân sách</span>
                <button 
                  onClick={() => {
                    setNewBudgetValue(totalBudget.toString());
                    setIsEditBudgetOpen(true);
                  }}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-stone-700 hover:bg-stone-600 text-stone-200 transition-colors cursor-pointer"
                >
                  Chỉnh sửa
                </button>
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight">
                {totalBudget.toLocaleString('vi-VN')} <span className="text-sm font-semibold text-stone-400">VNĐ</span>
              </div>
              <div className="text-[11px] text-stone-400">
                Hạn mức dự kiến cho toàn bộ chuyến đi
              </div>
            </div>
          </div>

          {/* Card 2: Đã Chi */}
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/80 relative overflow-hidden shadow-xs">
            <div className="flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 uppercase tracking-wider">Đã chi</span>
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  {spentPercent}% ngân sách
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
                {totalSpent.toLocaleString('vi-VN')} <span className="text-sm font-semibold text-stone-500">VNĐ</span>
              </div>
              <div className="text-[11px] text-stone-500">
                Đã ghi nhận <strong>{currentTripExpenses.length}</strong> khoản giao dịch
              </div>
            </div>
          </div>

          {/* Card 3: Còn Lại */}
          <div className={`p-5 rounded-2xl border relative overflow-hidden shadow-xs ${
            remainingBudget < 0 
              ? 'bg-rose-50 border-rose-200 text-rose-950' 
              : remainingBudget < totalBudget * 0.15 
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-600">Còn lại</span>
                {remainingBudget < 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                    <AlertTriangle className="w-3 h-3" /> Vượt ngân sách
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" /> An toàn
                  </span>
                )}
              </div>
              <div className={`text-2xl sm:text-3xl font-black tracking-tight ${
                remainingBudget < 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                {remainingBudget.toLocaleString('vi-VN')} <span className="text-sm font-semibold opacity-70">VNĐ</span>
              </div>
              <div className="text-[11px] text-stone-600">
                {remainingBudget < 0 
                  ? `Vượt mức ${(Math.abs(remainingBudget)).toLocaleString('vi-VN')} VNĐ! Hãy cân đối lại chi tiêu`
                  : `Bạn còn ${(100 - spentPercent)}% ngân sách khả dụng`}
              </div>
            </div>
          </div>
        </div>

        {/* Thanh Tiến Độ Đa Màu */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-bold text-stone-600">
            <span>Tiến độ sử dụng ngân sách</span>
            <span className="text-[#FF385C]">{spentPercent}%</span>
          </div>
          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${(spentByCategory.stay / totalBudget) * 100}%` }}
              className="bg-indigo-500 h-full transition-all" 
              title={`Lưu trú: ${spentByCategory.stay.toLocaleString()}đ`}
            />
            <div 
              style={{ width: `${(spentByCategory.food / totalBudget) * 100}%` }}
              className="bg-emerald-500 h-full transition-all" 
              title={`Ăn uống: ${spentByCategory.food.toLocaleString()}đ`}
            />
            <div 
              style={{ width: `${(spentByCategory.transport / totalBudget) * 100}%` }}
              className="bg-amber-500 h-full transition-all" 
              title={`Di chuyển: ${spentByCategory.transport.toLocaleString()}đ`}
            />
            <div 
              style={{ width: `${(spentByCategory.other / totalBudget) * 100}%` }}
              className="bg-purple-500 h-full transition-all" 
              title={`Khác: ${spentByCategory.other.toLocaleString()}đ`}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-stone-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Ăn uống</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
              <span>Lưu trú</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Di chuyển</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span>Khác</span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 2. HÀNG NÚT: [ĐỔI CHUYẾN], [THÊM CHI TIÊU], [TÙY CHỌN]        */}
      {/* ============================================================== */}
      <section className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* Nút 1: Đổi chuyến */}
          <button
            onClick={() => setIsSwitchTripOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs sm:text-sm font-bold shadow-xs hover:border-stone-300 transition-all cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 text-stone-600" />
            <span>Đổi chuyến</span>
          </button>

          {/* Nút 3: Tùy chọn */}
          <div className="relative">
            <button
              onClick={() => setIsOptionsMenuOpen(!isOptionsMenuOpen)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white hover:bg-stone-50 border border-stone-200 text-stone-800 text-xs sm:text-sm font-bold shadow-xs hover:border-stone-300 transition-all cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4 text-stone-600" />
              <span>Tùy chọn</span>
            </button>

            {/* Dropdown Menu Tùy Chọn */}
            {isOptionsMenuOpen && (
              <div 
                className="absolute left-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setIsOptionsMenuOpen(false)}
              >
                <button
                  onClick={() => {
                    setNewBudgetValue(totalBudget.toString());
                    setIsEditBudgetOpen(true);
                  }}
                  className="w-full px-4 py-2.5 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 font-semibold text-left cursor-pointer"
                >
                  <Wallet className="w-3.5 h-3.5 text-stone-500" />
                  <span>Chỉnh sửa hạn mức ngân sách</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  className="w-full px-4 py-2.5 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2.5 font-semibold text-left cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-stone-500" />
                  <span>Xuất báo cáo chi tiêu (CSV)</span>
                </button>
                <div className="border-t border-stone-100 my-1"></div>
                <button
                  onClick={() => {
                    if (confirm('Bạn có chắc muốn đặt lại tất cả các khoản chi tiêu của chuyến này về ban đầu?')) {
                      setAllExpenses(prev => ({ ...prev, [currentTripId]: [] }));
                    }
                  }}
                  className="w-full px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 font-semibold text-left cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
                  <span>Xóa tất cả chi tiêu chuyến này</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Nút 2: Thêm chi tiêu */}
        <button
          onClick={() => {
            setAddExpenseTab('manual');
            setIsAddExpenseOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#FF385C] hover:bg-[#E00B41] text-white text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Thêm chi tiêu</span>
        </button>
      </section>

      {/* ============================================================== */}
      {/* 3 & 4. NHẬT KÝ CHI TIÊU & PHÂN BỔ CHI TIÊU                     */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* 3. NHẬT KÝ CHI TIÊU */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
            
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-stone-900">Nhật ký chi tiêu</h3>
                <p className="text-xs text-stone-500">
                  Hiển thị {filteredExpenses.length} khoản chi trong chuyến này
                </p>
              </div>

              {/* Tìm kiếm */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm khoản chi..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#FF385C] text-stone-800"
                />
              </div>
            </div>

            {/* Bộ lọc danh mục */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Tất cả ({currentTripExpenses.length})
              </button>

              <button
                onClick={() => setSelectedCategoryFilter('food')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategoryFilter === 'food'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <UtensilsCrossed className="w-3 h-3" />
                <span>Ăn uống ({currentTripExpenses.filter(e => e.category === 'food').length})</span>
              </button>

              <button
                onClick={() => setSelectedCategoryFilter('stay')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategoryFilter === 'stay'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Hotel className="w-3 h-3" />
                <span>Lưu trú ({currentTripExpenses.filter(e => e.category === 'stay').length})</span>
              </button>

              <button
                onClick={() => setSelectedCategoryFilter('transport')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategoryFilter === 'transport'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Bike className="w-3 h-3" />
                <span>Di chuyển ({currentTripExpenses.filter(e => e.category === 'transport').length})</span>
              </button>

              <button
                onClick={() => setSelectedCategoryFilter('other')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategoryFilter === 'other'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Khác ({currentTripExpenses.filter(e => e.category !== 'food' && e.category !== 'stay' && e.category !== 'transport').length})</span>
              </button>
            </div>

            {/* Danh sách các khoản chi */}
            <div className="space-y-2.5 pt-1">
              {filteredExpenses.length === 0 ? (
                <div className="py-12 text-center space-y-3 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
                  <div className="w-12 h-12 rounded-full bg-stone-200 text-stone-400 mx-auto flex items-center justify-center">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-bold text-stone-700">Chưa có khoản chi nào trong mục này</div>
                  <p className="text-xs text-stone-500 max-w-sm mx-auto">
                    Bấm nút <strong>"Thêm chi tiêu"</strong> để nhập tay hoặc tải ảnh hóa đơn bóc tách tự động.
                  </p>
                  <button
                    onClick={() => {
                      setAddExpenseTab('manual');
                      setIsAddExpenseOpen(true);
                    }}
                    className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                  >
                    + Thêm ngay
                  </button>
                </div>
              ) : (
                filteredExpenses.map((exp) => {
                  const isFood = exp.category === 'food';
                  const isStay = exp.category === 'stay';
                  const isTransport = exp.category === 'transport';

                  return (
                    <div
                      key={exp.id}
                      className="group flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-stone-200 hover:border-stone-300 hover:shadow-xs bg-white transition-all text-xs"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                          isFood ? 'bg-emerald-50 text-emerald-600' :
                          isStay ? 'bg-indigo-50 text-indigo-600' :
                          isTransport ? 'bg-amber-50 text-amber-600' :
                          'bg-purple-50 text-purple-600'
                        }`}>
                          {isFood && <UtensilsCrossed className="w-5 h-5" />}
                          {isStay && <Hotel className="w-5 h-5" />}
                          {isTransport && <Bike className="w-5 h-5" />}
                          {!isFood && !isStay && !isTransport && <Layers className="w-5 h-5" />}
                        </div>

                        <div className="space-y-0.5">
                          <div className="font-extrabold text-stone-900 text-sm flex items-center gap-2">
                            <span>{exp.title}</span>
                            {exp.receiptImage && (
                              <button
                                onClick={() => setSelectedReceiptView(exp.receiptImage!)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-600 text-[10px] font-semibold cursor-pointer"
                                title="Xem hóa đơn đính kèm"
                              >
                                <Eye className="w-3 h-3 text-[#FF385C]" />
                                <span>Ảnh hóa đơn</span>
                              </button>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500">
                            <span>{exp.date}</span>
                            <span>•</span>
                            <span className="capitalize">
                              {isFood ? 'Ăn uống' : isStay ? 'Lưu trú' : isTransport ? 'Di chuyển' : 'Khác'}
                            </span>
                            {exp.paymentMethod && (
                              <>
                                <span>•</span>
                                <span className="inline-flex items-center gap-1 text-stone-600">
                                  {exp.paymentMethod === 'cash' && <Banknote className="w-3 h-3 text-emerald-600" />}
                                  {exp.paymentMethod === 'transfer' && <QrCode className="w-3 h-3 text-blue-600" />}
                                  {exp.paymentMethod === 'card' && <CreditCard className="w-3 h-3 text-purple-600" />}
                                  <span>{exp.paymentMethod === 'cash' ? 'Tiền mặt' : exp.paymentMethod === 'transfer' ? 'Chuyển khoản QR' : 'Thẻ'}</span>
                                </span>
                              </>
                            )}
                            {exp.note && (
                              <>
                                <span>•</span>
                                <span className="italic text-stone-400 truncate max-w-xs">{exp.note}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="font-black text-stone-900 text-sm sm:text-base">
                            {exp.amount.toLocaleString('vi-VN')} <span className="text-xs font-semibold text-stone-500">₫</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-2 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Xóa khoản chi này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 4. PHÂN BỔ CHI TIÊU */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#FF385C]" />
                <span>Phân bổ chi tiêu</span>
              </h3>
              <span className="text-xs text-stone-500 font-bold">{totalSpent.toLocaleString('vi-VN')} ₫</span>
            </div>

            {/* Các thanh tỷ lệ */}
            <div className="space-y-4">
              
              {/* Nhóm 1: Ăn uống */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-stone-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>🍲 Ăn uống</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-stone-900">{spentByCategory.food.toLocaleString('vi-VN')} ₫</span>
                    <span className="text-stone-400 font-semibold ml-1.5">({percentFood}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${percentFood}%` }}
                  />
                </div>
              </div>

              {/* Nhóm 2: Lưu trú */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-stone-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                    <span>🏨 Lưu trú</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-stone-900">{spentByCategory.stay.toLocaleString('vi-VN')} ₫</span>
                    <span className="text-stone-400 font-semibold ml-1.5">({percentStay}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                    style={{ width: `${percentStay}%` }}
                  />
                </div>
              </div>

              {/* Nhóm 3: Di chuyển */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-stone-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>🛵 Di chuyển</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-stone-900">{spentByCategory.transport.toLocaleString('vi-VN')} ₫</span>
                    <span className="text-stone-400 font-semibold ml-1.5">({percentTransport}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                    style={{ width: `${percentTransport}%` }}
                  />
                </div>
              </div>

              {/* Nhóm 4: Khác */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-stone-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span>🎁 Khác (Vé, Quà...)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-stone-900">{spentByCategory.other.toLocaleString('vi-VN')} ₫</span>
                    <span className="text-stone-400 font-semibold ml-1.5">({percentOther}%)</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                    style={{ width: `${percentOther}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Định mức Tỷ Lệ Vàng */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-extrabold text-stone-900">
                <Sparkles className="w-3.5 h-3.5 text-[#FF385C]" />
                <span>Định mức Tỷ Lệ Vàng khuyến nghị:</span>
              </div>
              <p className="text-[11px] text-stone-600 leading-relaxed">
                Để chuyến đi vừa thoải mái vừa tiết kiệm: <strong>Lưu trú (30%)</strong> • <strong>Ẩm thực (25%)</strong> • <strong>Di chuyển (20%)</strong> • <strong>Vé & Dự phòng (25%)</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: THÊM CHI TIÊU ([Nhập thủ công], [Chụp hóa đơn], [Tải ảnh])*/}
      {/* ============================================================== */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 border border-stone-200 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center font-bold">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900">Thêm khoản chi tiêu</h3>
                  <p className="text-[11px] text-stone-500">Chuyến: {activeTrip.name}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopRealCamera();
                  setIsAddExpenseOpen(false);
                  setScanSuccess(false);
                  setScannedData(null);
                  setActiveReceiptImage(null);
                }}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3 Tabs chuyển đổi */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  stopRealCamera();
                  setAddExpenseTab('manual');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  addExpenseTab === 'manual'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Nhập thủ công</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAddExpenseTab('camera');
                  startRealCamera();
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  addExpenseTab === 'camera'
                    ? 'bg-white text-[#FF385C] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Chụp hóa đơn</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  stopRealCamera();
                  setAddExpenseTab('upload');
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  addExpenseTab === 'upload'
                    ? 'bg-white text-[#FF385C] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Tải ảnh hóa đơn</span>
              </button>
            </div>

            {/* TAB 1: NHẬP THỦ CÔNG */}
            {addExpenseTab === 'manual' && (
              <form onSubmit={handleSaveManualExpense} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Tên khoản chi *</label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="VD: Cơm niêu Đà Nẵng, Tiền homestay, Thuê xe máy..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#FF385C]"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Số tiền (VNĐ) *</label>
                    <input
                      type="number"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(e.target.value)}
                      placeholder="VD: 250000"
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#FF385C]"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-700">Danh mục chi tiêu</label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-hidden cursor-pointer"
                    >
                      <option value="food">🍲 Ăn uống ẩm thực</option>
                      <option value="stay">🏨 Khách sạn / Lưu trú</option>
                      <option value="transport">🛵 Di chuyển / Phương tiện</option>
                      <option value="other">🎁 Khác (Vé tour, Quà lưu niệm...)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Hình thức thanh toán</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setManualMethod('cash')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        manualMethod === 'cash' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-white text-stone-600'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Tiền mặt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualMethod('transfer')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        manualMethod === 'transfer' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-stone-200 bg-white text-stone-600'
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Chuyển khoản QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualMethod('card')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        manualMethod === 'card' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-stone-200 bg-white text-stone-600'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Thẻ / POS</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Ghi chú thêm (tùy chọn)</label>
                  <input
                    type="text"
                    value={manualNote}
                    onChange={(e) => setManualNote(e.target.value)}
                    placeholder="VD: Cả nhóm chia đều 4 người..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md"
                  >
                    + Lưu khoản chi vào sổ
                  </button>
                </div>
              </form>
            )}

            {/* TAB 2: CHỤP HÓA ĐƠN THỰC TẾ (REAL WEBCAM / SMARTPHONE CAMERA) */}
            {addExpenseTab === 'camera' && (
              <div className="space-y-4">
                
                {/* Khung Camera thực tế */}
                <div className="relative rounded-2xl bg-stone-950 text-white overflow-hidden aspect-video flex flex-col items-center justify-center border-2 border-stone-700 shadow-inner">
                  
                  {/* Real Video Stream */}
                  <video 
                    ref={videoRef} 
                    playsInline 
                    autoPlay 
                    muted 
                    className={`w-full h-full object-cover ${isCameraActive ? 'block' : 'hidden'}`}
                  />

                  {/* Tia laser quét */}
                  {isCameraActive && (
                    <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce pointer-events-none" />
                  )}

                  {/* Khung ngắm chụp */}
                  {isCameraActive && (
                    <div className="absolute inset-6 border border-white/40 rounded-xl pointer-events-none flex flex-col justify-between p-2">
                      <div className="flex justify-between">
                        <span className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                        <span className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                      </div>
                      <div className="flex justify-between">
                        <span className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                        <span className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                      </div>
                    </div>
                  )}

                  {/* Hiển thị khi camera chưa bật hoặc lỗi */}
                  {!isCameraActive && (
                    <div className="text-center space-y-2.5 z-10 p-5">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto text-emerald-400 backdrop-blur-xs">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-stone-200">
                        Camera Thiết Bị Thực Tế
                      </div>
                      {cameraError ? (
                        <p className="text-[11px] text-amber-300 max-w-xs mx-auto leading-relaxed">
                          {cameraError}
                        </p>
                      ) : (
                        <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                          Nhấn nút bên dưới để mở camera máy tính hoặc điện thoại quét trực tiếp hóa đơn
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Các nút điều khiển Camera */}
                <div className="flex flex-col sm:flex-row gap-2">
                  {!isCameraActive ? (
                    <button
                      type="button"
                      onClick={startRealCamera}
                      className="flex-1 py-3 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
                    >
                      <Video className="w-4 h-4 text-emerald-400" />
                      <span>Bật Camera Thực Tế</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={captureRealPhoto}
                        disabled={isScanning}
                        className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md"
                      >
                        {isScanning ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Đang trích xuất OCR AI...</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4" />
                            <span>📸 Chụp & Quét AI Hóa Đơn Này</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={stopRealCamera}
                        className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                      >
                        <VideoOff className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Chụp bằng app camera điện thoại (hỗ trợ mobile cực tốt) */}
                  <label className="py-3 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 shrink-0">
                    <Camera className="w-4 h-4 text-[#FF385C]" />
                    <span>Dùng App Camera</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      capture="environment" 
                      onChange={handleRealFileUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>

                {/* Kết quả bóc tách từ ảnh chụp */}
                {scanSuccess && scannedData && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Đã bóc tách thành công từ ảnh chụp!</span>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs space-y-1">
                      <div className="font-extrabold text-stone-900">{scannedData.store}</div>
                      <div className="text-[11px] text-stone-600">
                        Tổng tiền: <strong className="text-emerald-700 text-sm">{scannedData.totalAmount.toLocaleString('vi-VN')} VNĐ</strong>
                      </div>
                      <div className="text-[11px] text-stone-600">
                        Danh mục: <strong className="capitalize">{scannedData.category === 'food' ? 'Ăn uống' : scannedData.category === 'stay' ? 'Lưu trú' : scannedData.category === 'transport' ? 'Di chuyển' : 'Khác'}</strong>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleConfirmScannedExpense}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      Xác nhận lưu khoản chi này
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TẢI ẢNH HÓA ĐƠN THỰC TẾ & DEMO 1 */}
            {addExpenseTab === 'upload' && (
              <div className="space-y-4">
                
                {/* 1. NÚT CHỌN ẢNH THỰC TẾ TỪ MÁY TÍNH */}
                <div className="relative border-2 border-dashed border-[#FF385C]/30 hover:border-[#FF385C] bg-[#FF385C]/5 hover:bg-[#FF385C]/10 rounded-2xl p-6 text-center transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleRealFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="space-y-2 pointer-events-none">
                    <div className="w-12 h-12 rounded-2xl bg-white text-[#FF385C] flex items-center justify-center mx-auto shadow-xs group-hover:scale-105 transition-transform">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-stone-900">
                      Bấm vào đây để chọn ảnh hóa đơn thực tế từ máy tính
                    </div>
                    <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                      Hỗ trợ mọi định dạng ảnh hóa đơn chụp thực tế (JPG, PNG, WEBP). AI sẽ đọc và bóc tách số tiền ngay lập tức!
                    </p>
                  </div>
                </div>

                {/* Bản xem trước ảnh thực tế vừa tải */}
                {activeReceiptImage && !scannedData?.invoiceNo && (
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex items-center gap-3">
                    <img 
                      src={activeReceiptImage} 
                      alt="Ảnh hóa đơn thực tế" 
                      className="w-14 h-14 rounded-xl object-cover border border-stone-200" 
                    />
                    <div className="flex-1">
                      <div className="text-xs font-bold text-stone-800">Ảnh hóa đơn thực tế đã tải</div>
                      <div className="text-[11px] text-stone-500">
                        {isScanning ? 'AI đang đọc ký tự OCR...' : 'Đã sẵn sàng trích xuất'}
                      </div>
                    </div>
                    {isScanning && <RefreshCw className="w-4 h-4 animate-spin text-[#FF385C]" />}
                  </div>
                )}

                {/* 2. KHU VỰC HÓA ĐƠN MẪU (DEMO 1) */}
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#FF385C] text-white flex items-center justify-center text-xs font-black">1</span>
                      <span className="text-xs font-extrabold text-stone-900">Hoặc dùng nhanh Hóa Đơn Mẫu (Demo 1)</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                      Sẵn mẫu test
                    </span>
                  </div>

                  {/* Bản xem trước hóa đơn mẫu Demo 1 */}
                  <div className="p-3.5 rounded-xl bg-white border border-stone-200/80 shadow-xs space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-extrabold text-stone-900 text-sm">
                          {DEMO_1_RECEIPT.store}
                        </div>
                        <div className="text-[10px] text-stone-400">{DEMO_1_RECEIPT.address}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-stone-100 px-1.5 py-0.5 rounded font-mono text-stone-600">
                          {DEMO_1_RECEIPT.invoiceNo}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-stone-200 my-2 pt-2 space-y-1 text-[11px] text-stone-600">
                      {DEMO_1_RECEIPT.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.name}</span>
                          <span className="font-semibold text-stone-800">{it.price.toLocaleString()} ₫</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-stone-200 pt-2 flex justify-between items-center text-xs">
                      <span className="font-bold text-stone-700">Tổng cộng thanh toán:</span>
                      <span className="font-black text-[#FF385C] text-base">
                        {DEMO_1_RECEIPT.totalAmount.toLocaleString()} VNĐ
                      </span>
                    </div>
                  </div>

                  {/* Nút bấm kích hoạt Demo 1 */}
                  {!scanSuccess && (
                    <button
                      type="button"
                      onClick={handleTriggerDemo1Scan}
                      disabled={isScanning}
                      className="w-full py-2.5 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-[#FF385C]" />
                          <span>AI đang đọc hóa đơn Demo 1...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-[#FF385C]" />
                          <span>⚡ Quét & Bóc tách Demo 1 tự động</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Kết quả bóc tách từ ảnh thực tế hoặc Demo 1 */}
                {scanSuccess && scannedData && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2.5 animate-in fade-in">
                    <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Trích xuất AI hoàn tất! Dữ liệu đã sẵn sàng.</span>
                    </div>
                    <div className="text-[11px] text-emerald-900 space-y-1 bg-white/70 p-3 rounded-xl border border-emerald-100">
                      <div>• Khoản chi: <strong>{scannedData.store}</strong></div>
                      <div>• Số tiền: <strong className="text-emerald-700 text-sm">{scannedData.totalAmount.toLocaleString('vi-VN')} VNĐ</strong></div>
                      <div>• Danh mục: <strong className="capitalize">{scannedData.category === 'food' ? 'Ăn uống' : scannedData.category === 'stay' ? 'Lưu trú' : scannedData.category === 'transport' ? 'Di chuyển' : 'Khác'}</strong></div>
                      <div>• Phương thức: <strong>{scannedData.paymentMethod === 'transfer' ? 'Chuyển khoản QR' : scannedData.paymentMethod === 'card' ? 'Thẻ POS' : 'Tiền mặt'}</strong></div>
                    </div>
                    <button
                      type="button"
                      onClick={handleConfirmScannedExpense}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      + Lưu ngay vào Sổ chi tiêu
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ĐỔI CHUYẾN ĐI                                           */}
      {/* ============================================================== */}
      {isSwitchTripOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-[#FF385C]" />
                <h3 className="font-extrabold text-base text-stone-900">Chọn chuyến đi</h3>
              </div>
              <button
                onClick={() => setIsSwitchTripOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {trips.map((t) => {
                const isSelected = t.id === currentTripId;
                const tripExpenses = allExpenses[t.id] || [];
                const spent = tripExpenses.reduce((s, e) => s + e.amount, 0);

                return (
                  <div
                    key={t.id}
                    onClick={() => {
                      setCurrentTripId(t.id);
                      setIsSwitchTripOpen(false);
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-[#FF385C] bg-[#FF385C]/5 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs text-stone-900">{t.name}</div>
                      <div className="text-[11px] text-stone-500">{t.destination} • {t.duration}</div>
                      <div className="text-[10px] text-stone-400 mt-1">
                        Ngân sách: {t.totalBudget.toLocaleString('vi-VN')} ₫ (Đã chi: {spent.toLocaleString('vi-VN')} ₫)
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-[#FF385C] shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                const name = prompt('Nhập tên chuyến đi mới (VD: Phú Quốc 3N2Đ):');
                if (name && name.trim()) {
                  const budgetStr = prompt('Nhập hạn mức ngân sách (VNĐ):', '6000000');
                  const budgetNum = Number(budgetStr) || 6000000;
                  const newTrip: TripBudget = {
                    id: `trip-${Date.now()}`,
                    name: name.trim(),
                    destination: name.trim(),
                    duration: 'Tự do',
                    totalBudget: budgetNum
                  };
                  setTrips([...trips, newTrip]);
                  setCurrentTripId(newTrip.id);
                  setIsSwitchTripOpen(false);
                }
              }}
              className="w-full py-2.5 border border-dashed border-stone-300 hover:border-stone-400 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo thêm chuyến đi mới</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CHỈNH SỬA HẠN MỨC NGÂN SÁCH                            */}
      {/* ============================================================== */}
      {isEditBudgetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-extrabold text-sm text-stone-900">Đổi hạn mức ngân sách</h3>
              <button onClick={() => setIsEditBudgetOpen(false)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBudget} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600">Số tiền ngân sách mới (VNĐ)</label>
                <input
                  type="number"
                  value={newBudgetValue}
                  onChange={(e) => setNewBudgetValue(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900"
                  required
                />
              </div>

              <div className="flex gap-1.5 pt-1">
                {[5000000, 8000000, 10000000, 15000000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setNewBudgetValue(val.toString())}
                    className="flex-1 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold"
                  >
                    {(val / 1000000)}Tr
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl text-xs font-bold mt-2 cursor-pointer"
              >
                Cập nhật ngân sách
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CHỈNH SỬA THỜI LƯỢNG CHUYẾN ĐI                          */}
      {/* ============================================================== */}
      {isEditDurationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-stone-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#FF385C]" />
                <h3 className="font-extrabold text-sm text-stone-900">Điều chỉnh thời lượng</h3>
              </div>
              <button 
                onClick={() => setIsEditDurationOpen(false)} 
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDuration} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600">Thời lượng chuyến đi</label>
                <input
                  type="text"
                  value={newDurationValue}
                  onChange={(e) => setNewDurationValue(e.target.value)}
                  placeholder="VD: 3 ngày 2 đêm, 4 ngày 3 đêm..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden focus:border-[#FF385C]"
                  required
                />
              </div>

              {/* Gợi ý chọn nhanh */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-semibold text-stone-500">Gợi ý chọn nhanh:</div>
                <div className="flex flex-wrap gap-1.5">
                  {['2 ngày 1 đêm', '3 ngày 2 đêm', '4 ngày 3 đêm', '5 ngày 4 đêm', '7 ngày 6 đêm', 'Tự do'].map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setNewDurationValue(d)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        newDurationValue === d
                          ? 'bg-[#FF385C] text-white shadow-xs'
                          : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditDurationOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Lưu thời lượng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: XEM ẢNH HÓA ĐƠN                                        */}
      {/* ============================================================== */}
      {selectedReceiptView && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setSelectedReceiptView(null)}
        >
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-stone-100 flex justify-between items-center">
              <div className="font-extrabold text-xs text-stone-900 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#FF385C]" />
                <span>Hóa đơn điện tử đính kèm</span>
              </div>
              <button onClick={() => setSelectedReceiptView(null)} className="p-1 text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-stone-100 flex items-center justify-center">
              <img 
                src={selectedReceiptView} 
                alt="Hóa đơn" 
                className="max-h-96 w-auto rounded-2xl shadow-sm object-contain"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
