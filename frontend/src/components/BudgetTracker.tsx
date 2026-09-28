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
  Minus,
  Video,
  VideoOff,
  ImageIcon,
  ArrowLeft,
  Pencil,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { ExpenseItem, TripBudget } from '../types';
import {
  BUDGET_LIMITS,
  parseMoney,
  validateExpenseText,
  validateTripDates,
  validateTripName,
  describeDuration,
  daysBetween,
  toLocalISODate,
  formatExpenseDate,
  formatAbsoluteDate,
  normalizeSearch,
  buildExpenseCsv,
  validateReceiptFile,
  compressImage,
  readFileAsDataUrl,
  budgetStorageKeys,
  safeSetItem
} from '../utils/budgetRules';

const newId = (prefix: string) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`}`;

const FieldErrorText: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <div className="flex items-start gap-1.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] font-semibold text-rose-700">
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />
      <span>{message}</span>
    </div>
  ) : null;

// Danh sách chuyến đi mặc định
const INITIAL_TRIPS: TripBudget[] = [
  {
    id: 'trip-1',
    name: 'Khám phá Đà Nẵng - Hội An (4N3Đ)',
    destination: 'Đà Nẵng & Hội An',
    duration: '4 ngày 3 đêm',
    totalBudget: 8000000,
    startDate: '2026-10-15',
    endDate: '2026-10-18',
    createdAt: '28/09/2026 08:30'
  },
  {
    id: 'trip-2',
    name: 'Food Tour Hà Nội & Tràng An (3N2Đ)',
    destination: 'Hà Nội - Ninh Bình',
    duration: '3 ngày 2 đêm',
    totalBudget: 5000000,
    startDate: '2026-11-01',
    endDate: '2026-11-03',
    createdAt: '27/09/2026 14:15'
  },
  {
    id: 'trip-3',
    name: 'Săn mây Đà Lạt - Tà Xùa (3N2Đ)',
    destination: 'Đà Lạt',
    duration: '3 ngày 2 đêm',
    totalBudget: 6000000,
    startDate: '2026-12-20',
    endDate: '2026-12-22',
    createdAt: '25/09/2026 19:00'
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
  // 'guest' hoặc id tài khoản — mỗi tài khoản có sổ chi tiêu riêng trên cùng thiết bị
  storageScope?: string;
}

export const BudgetTracker: React.FC<BudgetTrackerProps> = ({ onBack, storageScope = 'guest' }) => {
  const storageKeys = budgetStorageKeys(storageScope);

  // 1. Quản lý Chuyến đi
  const [trips, setTrips] = useState<TripBudget[]>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.trips);
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_TRIPS;
    } catch {
      return INITIAL_TRIPS;
    }
  });

  const [currentTripId, setCurrentTripId] = useState<string>(() => {
    try {
      return localStorage.getItem(storageKeys.currentTrip) || 'trip-1';
    } catch {
      return 'trip-1';
    }
  });

  const activeTrip = trips.find(t => t.id === currentTripId) || trips[0] || INITIAL_TRIPS[0];

  // 2. Danh sách chi tiêu theo từng chuyến
  const [allExpenses, setAllExpenses] = useState<Record<string, ExpenseItem[]>>(() => {
    try {
      const saved = localStorage.getItem(storageKeys.expenses);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  // Lưu localStorage — nếu bộ nhớ đầy thì báo cho người dùng thay vì mất dữ liệu âm thầm
  const [failedStorageKeys, setFailedStorageKeys] = useState<string[]>([]);
  const persist = (key: string, value: string) => {
    const ok = safeSetItem(key, value);
    setFailedStorageKeys((prev) => (ok ? prev.filter((k) => k !== key) : prev.includes(key) ? prev : [...prev, key]));
  };

  useEffect(() => persist(storageKeys.trips, JSON.stringify(trips)), [trips]);
  useEffect(() => persist(storageKeys.currentTrip, currentTripId), [currentTripId]);
  useEffect(() => persist(storageKeys.expenses, JSON.stringify(allExpenses)), [allExpenses]);

  // Chuyến đang chọn không còn tồn tại → chuyển về chuyến đầu tiên
  useEffect(() => {
    if (!trips.some((t) => t.id === currentTripId) && trips[0]) setCurrentTripId(trips[0].id);
  }, [trips, currentTripId]);

  // Chi tiêu của chuyến hiện tại
  const currentTripExpenses = allExpenses[currentTripId] || [];

  // Bộ lọc danh mục nhật ký: 'all' | 'food' | 'stay' | 'transport' | 'other'
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | 'food' | 'stay' | 'transport' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Popups
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [targetTripIdForExpense, setTargetTripIdForExpense] = useState(currentTripId);
  const [isSwitchTripOpen, setIsSwitchTripOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [newBudgetValue, setNewBudgetValue] = useState(activeTrip.totalBudget.toString());
  const [isEditDurationOpen, setIsEditDurationOpen] = useState(false);
  const [selectedReceiptView, setSelectedReceiptView] = useState<string | null>(null);

  // State cho bộ chọn lịch nhỏ gọn (Compact Date Picker)
  const [editStartDate, setEditStartDate] = useState<string>(activeTrip.startDate || '2026-10-15');
  const [editEndDate, setEditEndDate] = useState<string>(activeTrip.endDate || '2026-10-18');

  // Modal Tạo Chuyến Đi Mới
  const [isCreateTripOpen, setIsCreateTripOpen] = useState(false);
  const [createTripName, setCreateTripName] = useState('');
  const [createTripDestination, setCreateTripDestination] = useState('');
  const [createTripStartDate, setCreateTripStartDate] = useState('2026-11-05');
  const [createTripEndDate, setCreateTripEndDate] = useState('2026-11-08');
  const [createTripBudget, setCreateTripBudget] = useState('6000000');

  // Modal Chỉnh Sửa Khoản Chi (sửa giá tiền, địa điểm, phương thức thanh toán)
  const [isEditExpenseOpen, setIsEditExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [editExpenseTitle, setEditExpenseTitle] = useState('');
  const [editExpenseAmount, setEditExpenseAmount] = useState('');
  const [editExpenseCategory, setEditExpenseCategory] = useState<'food' | 'stay' | 'transport' | 'other'>('food');
  const [editExpenseMethod, setEditExpenseMethod] = useState<'cash' | 'transfer' | 'card'>('cash');
  const [editExpenseNote, setEditExpenseNote] = useState('');

  // Thông báo lỗi hiển thị trong từng form (thay vì bỏ qua im lặng)
  const [manualError, setManualError] = useState('');
  const [editError, setEditError] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [createTripError, setCreateTripError] = useState('');
  const [durationError, setDurationError] = useState('');
  const [scanError, setScanError] = useState('');
  // Ảnh hóa đơn đính kèm vào form nhập tay (khi AI không đọc được hoặc người dùng muốn sửa)
  const [manualReceipt, setManualReceipt] = useState<string | null>(null);

  // Hàm tính toán số ngày & số đêm chuẩn xác từ khoảng ngày đã chọn
  const calculateDaysAndNights = (start: string, end: string) => {
    if (!start || !end) return { days: 1, nights: 0, text: '1 ngày' };
    const nights = Math.max(0, daysBetween(start, end));
    return { days: nights + 1, nights, text: describeDuration(start, end) };
  };

  // Đồng bộ giá trị khi đổi chuyến đi
  useEffect(() => {
    setEditStartDate(activeTrip.startDate || '2026-10-15');
    setEditEndDate(activeTrip.endDate || '2026-10-18');
    setNewBudgetValue(activeTrip.totalBudget.toString());
    setTargetTripIdForExpense(currentTripId);
  }, [activeTrip, currentTripId]);

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
    source?: 'ai' | 'demo';
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
    stopRealCamera();
    let dataUrl: string;
    try {
      dataUrl = await compressImage(canvas.toDataURL('image/jpeg', 0.85));
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Không xử lý được ảnh chụp.');
      return;
    }
    setActiveReceiptImage(dataUrl);

    // Gửi ảnh chụp thực tế tới API quét hóa đơn AI
    await processRealReceiptImage(dataUrl);
  };

  // Xử lý gửi ảnh thực tế (chụp hoặc tải lên) tới API AI.
  // AI không chạy / không đọc được → báo lỗi và cho nhập tay, KHÔNG tự bịa số tiền.
  const processRealReceiptImage = async (base64Image: string) => {
    setIsScanning(true);
    setScanSuccess(false);
    setScannedData(null);
    setScanError('');

    try {
      const res = await fetch('/api/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Image })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.data) throw new Error(json.error || 'Không đọc được hóa đơn.');

      const amount = parseMoney(json.data.totalAmount, BUDGET_LIMITS.EXPENSE_MAX);
      if (amount.error) throw new Error('Số tiền AI đọc được không hợp lệ. Vui lòng nhập thủ công.');

      setScannedData({
        store: String(json.data.store || 'Khoản chi từ hóa đơn').slice(0, BUDGET_LIMITS.TITLE_MAX),
        totalAmount: amount.value,
        category: (['food', 'stay', 'transport', 'other'].includes(json.data.category) ? json.data.category : 'other') as any,
        paymentMethod: (['cash', 'transfer', 'card'].includes(json.data.paymentMethod) ? json.data.paymentMethod : 'cash') as any,
        invoiceNo: json.data.invoiceNo || undefined,
        items: json.data.items || [],
        source: 'ai'
      });
      setScanSuccess(true);
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      setScanError(
        !message || message === 'Failed to fetch'
          ? 'Không kết nối được máy chủ để đọc hóa đơn. Bạn có thể nhập thủ công và giữ ảnh đính kèm.'
          : message
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Xử lý tải ảnh từ máy: kiểm tra loại/dung lượng, nén ảnh (tránh đầy bộ nhớ) rồi gửi AI
  const handleRealFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setScanError('');
    const fileError = validateReceiptFile(file);
    if (fileError) {
      setScanError(fileError);
      return;
    }
    try {
      const compressed = await compressImage(await readFileAsDataUrl(file));
      setActiveReceiptImage(compressed);
      await processRealReceiptImage(compressed);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Không xử lý được ảnh.');
    }
  };

  // Chuyển sang form nhập tay, giữ ảnh hóa đơn và (nếu có) dữ liệu AI để người dùng kiểm tra lại
  const openManualWithReceipt = (prefill?: NonNullable<typeof scannedData>) => {
    if (prefill) {
      setManualTitle(prefill.store);
      setManualAmount(String(prefill.totalAmount));
      setManualCategory(prefill.category);
      setManualMethod(prefill.paymentMethod);
    }
    setManualReceipt(activeReceiptImage);
    setScanSuccess(false);
    setScannedData(null);
    setScanError('');
    setManualError('');
    stopRealCamera();
    setAddExpenseTab('manual');
  };

  const renderScanError = () =>
    scanError ? (
      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2.5">
        <div className="flex items-start gap-2 text-[11px] font-semibold text-amber-900">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>{scanError}</span>
        </div>
        {activeReceiptImage && (
          <button
            type="button"
            onClick={() => openManualWithReceipt()}
            className="w-full py-2 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-bold cursor-pointer transition-colors"
          >
            Nhập số tiền thủ công & giữ ảnh hóa đơn
          </button>
        )}
      </div>
    ) : null;

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
    const query = normalizeSearch(searchQuery);
    if (query) {
      matchSearch = normalizeSearch(item.title).includes(query) || normalizeSearch(item.note ?? '').includes(query);
    }
    return matchCat && matchSearch;
  });

  // Xử lý thêm chi tiêu thủ công (cho phép chọn chuyến đi hiện tại hoặc chuyến cũ)
  const handleSaveManualExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const textError = validateExpenseText(manualTitle, manualNote);
    if (textError) return setManualError(textError);
    const amount = parseMoney(manualAmount, BUDGET_LIMITS.EXPENSE_MAX);
    if (amount.error) return setManualError(amount.error);

    const chosenTripId = targetTripIdForExpense || currentTripId;
    if (!trips.some((t) => t.id === chosenTripId)) return setManualError('Chuyến đi đã chọn không còn tồn tại.');

    const now = new Date();
    const newItem: ExpenseItem = {
      id: newId('exp'),
      tripId: chosenTripId,
      title: manualTitle.trim(),
      amount: amount.value,
      category: manualCategory as any,
      // Lưu thời gian tuyệt đối; nhãn "Hôm nay / Hôm qua" được tính lúc hiển thị
      date: formatAbsoluteDate(now),
      timestamp: now.toISOString(),
      paymentMethod: manualMethod,
      note: manualNote.trim() || undefined,
      receiptImage: manualReceipt || undefined
    };

    setAllExpenses(prev => ({
      ...prev,
      [chosenTripId]: [newItem, ...(prev[chosenTripId] || [])]
    }));

    setManualTitle('');
    setManualAmount('');
    setManualNote('');
    setManualError('');
    setManualReceipt(null);
    setActiveReceiptImage(null);
    setIsAddExpenseOpen(false);
  };

  // Kích hoạt quét Demo 1
  const handleTriggerDemo1Scan = () => {
    setActiveReceiptImage('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80');
    setIsScanning(true);
    setScanSuccess(false);
    setScanError('');
    setTimeout(() => {
      setIsScanning(false);
      setScanSuccess(true);
      setScannedData({ ...DEMO_1_RECEIPT, source: 'demo' });
    }, 1100);
  };

  // Xác nhận lưu khoản chi từ quét hóa đơn thực tế / Demo 1
  const handleConfirmScannedExpense = () => {
    if (!scannedData) return;
    const chosenTripId = targetTripIdForExpense || currentTripId;
    const amount = parseMoney(scannedData.totalAmount, BUDGET_LIMITS.EXPENSE_MAX);
    if (amount.error) return setScanError(amount.error);

    const now = new Date();
    const newItem: ExpenseItem = {
      id: newId('exp'),
      tripId: chosenTripId,
      title: scannedData.store.slice(0, BUDGET_LIMITS.TITLE_MAX),
      amount: amount.value,
      category: scannedData.category,
      date: formatAbsoluteDate(now),
      timestamp: now.toISOString(),
      paymentMethod: scannedData.paymentMethod,
      // Ghi đúng nguồn dữ liệu — không ghi "đã xác thực" khi chỉ là AI đọc tự động
      note:
        scannedData.source === 'demo'
          ? 'Hóa đơn mẫu (Demo)'
          : `Đọc tự động bằng AI từ ảnh hóa đơn${scannedData.invoiceNo ? ` (số ${scannedData.invoiceNo})` : ''}`,
      receiptImage: activeReceiptImage || undefined
    };

    setAllExpenses(prev => ({
      ...prev,
      [chosenTripId]: [newItem, ...(prev[chosenTripId] || [])]
    }));

    setIsAddExpenseOpen(false);
    setScanSuccess(false);
    setScannedData(null);
    setActiveReceiptImage(null);
    stopRealCamera();
  };

  // Mở modal chỉnh sửa khoản chi
  const handleOpenEditExpense = (item: ExpenseItem) => {
    setEditingExpense(item);
    setEditExpenseTitle(item.title);
    setEditExpenseAmount(item.amount.toString());
    setEditExpenseCategory((['food', 'stay', 'transport', 'other'].includes(item.category) ? item.category : 'food') as any);
    setEditExpenseMethod(item.paymentMethod || 'cash');
    setEditExpenseNote(item.note || '');
    setEditError('');
    setIsEditExpenseOpen(true);
  };

  // Lưu chỉnh sửa khoản chi
  const handleSaveEditExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const textError = validateExpenseText(editExpenseTitle, editExpenseNote);
    if (textError) return setEditError(textError);
    const amount = parseMoney(editExpenseAmount, BUDGET_LIMITS.EXPENSE_MAX);
    if (amount.error) return setEditError(amount.error);

    const updatedItem: ExpenseItem = {
      ...editingExpense,
      title: editExpenseTitle.trim(),
      amount: amount.value,
      category: editExpenseCategory,
      paymentMethod: editExpenseMethod,
      note: editExpenseNote.trim() || undefined
    };

    setAllExpenses(prev => ({
      ...prev,
      [currentTripId]: (prev[currentTripId] || []).map(item =>
        item.id === editingExpense.id ? updatedItem : item
      )
    }));

    setIsEditExpenseOpen(false);
    setEditingExpense(null);
    setEditError('');
  };

  // Xóa khoản chi
  const handleDeleteExpense = (id: string) => {
    const item = currentTripExpenses.find((e) => e.id === id);
    if (!window.confirm(`Xóa khoản chi "${item?.title ?? ''}" (${(item?.amount ?? 0).toLocaleString('vi-VN')} ₫)?`)) return;
    setAllExpenses(prev => ({
      ...prev,
      [currentTripId]: (prev[currentTripId] || []).filter(e => e.id !== id)
    }));
  };

  // Cập nhật hạn mức ngân sách
  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const budget = parseMoney(newBudgetValue, BUDGET_LIMITS.BUDGET_MAX, 'ngân sách');
    if (budget.error) return setBudgetError(budget.error);

    setTrips(prev => prev.map(t => t.id === currentTripId ? { ...t, totalBudget: budget.value } : t));
    setBudgetError('');
    setIsEditBudgetOpen(false);
  };

  // Cập nhật thời lượng chuyến đi từ chọn lịch (nhỏ gọn, chuẩn xác số ngày & đêm)
  const handleSaveDuration = (e: React.FormEvent) => {
    e.preventDefault();
    const dateError = validateTripDates(editStartDate, editEndDate);
    if (dateError) return setDurationError(dateError);
    const calc = calculateDaysAndNights(editStartDate, editEndDate);
    setDurationError('');

    setTrips(prev => prev.map(t => t.id === currentTripId ? {
      ...t,
      startDate: editStartDate,
      endDate: editEndDate,
      duration: calc.text
    } : t));
    setIsEditDurationOpen(false);
  };

  // Xử lý tạo chuyến đi mới từ Modal (bao gồm chọn lịch & ghi nhận thời gian tạo)
  const handleCreateNewTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (trips.length >= BUDGET_LIMITS.MAX_TRIPS) {
      return setCreateTripError(`Tối đa ${BUDGET_LIMITS.MAX_TRIPS} chuyến đi. Hãy xóa bớt chuyến cũ.`);
    }
    const nameError = validateTripName(createTripName, trips.map((t) => t.name));
    if (nameError) return setCreateTripError(nameError);
    const dateError = validateTripDates(createTripStartDate, createTripEndDate);
    if (dateError) return setCreateTripError(dateError);
    // Không tự thay giá trị người dùng nhập (trước đây 0 bị đổi thành 6.000.000)
    const budget = parseMoney(createTripBudget, BUDGET_LIMITS.BUDGET_MAX, 'ngân sách');
    if (budget.error) return setCreateTripError(budget.error);

    const budgetNum = budget.value;
    const calc = calculateDaysAndNights(createTripStartDate, createTripEndDate);
    const createdAtStr = formatAbsoluteDate();
    setCreateTripError('');

    const newTrip: TripBudget = {
      id: newId('trip'),
      name: createTripName.trim(),
      destination: createTripDestination.trim() || createTripName.trim(),
      duration: calc.text,
      startDate: createTripStartDate,
      endDate: createTripEndDate,
      totalBudget: budgetNum,
      createdAt: createdAtStr
    };

    setTrips(prev => [...prev, newTrip]);
    setCurrentTripId(newTrip.id);
    setIsCreateTripOpen(false);
    setIsSwitchTripOpen(false);
  };

  // Xóa chuyến đi
  const handleDeleteTrip = (tripIdToDelete: string, tripName: string) => {
    if (trips.length <= 1) {
      alert('Không thể xóa chuyến đi duy nhất còn lại! Bạn hãy tạo chuyến đi mới trước khi xóa chuyến này.');
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa chuyến đi "${tripName}" cùng toàn bộ dữ liệu chi tiêu liên quan?`)) {
      return;
    }

    const updatedTrips = trips.filter(t => t.id !== tripIdToDelete);
    setTrips(updatedTrips);

    // Nếu đang chọn chuyến bị xóa, tự động chuyển sang chuyến đầu tiên còn lại
    if (tripIdToDelete === currentTripId) {
      const nextTrip = updatedTrips[0];
      setCurrentTripId(nextTrip.id);
    }

    // Xóa toàn bộ chi tiêu của chuyến bị xóa
    setAllExpenses(prev => {
      const next = { ...prev };
      delete next[tripIdToDelete];
      return next;
    });
  };

  // Xuất báo cáo CSV
  const handleExportCSV = () => {
    // BOM UTF-8 cho Excel, escape ngoặc kép, chặn chèn công thức — xem buildExpenseCsv
    const blob = new Blob([buildExpenseCsv(currentTripExpenses)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bao-cao-chi-tieu-${toLocalISODate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setIsOptionsMenuOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {failedStorageKeys.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-start gap-2" role="alert">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>
            Bộ nhớ trình duyệt đã đầy — thay đổi mới nhất CHƯA được lưu. Hãy xóa bớt khoản chi có ảnh hóa đơn
            hoặc xuất CSV để sao lưu trước khi tải lại trang.
          </span>
        </div>
      )}
      
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
              setEditStartDate(activeTrip.startDate || '2026-10-15');
              setEditEndDate(activeTrip.endDate || '2026-10-18');
              setDurationError('');
              setIsEditDurationOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 text-xs font-semibold self-start sm:self-auto transition-all cursor-pointer border border-stone-200/80 hover:border-stone-400 group shadow-xs"
            title="Bấm để chọn lịch trình chuyến đi"
          >
            <Calendar className="w-3.5 h-3.5 text-stone-500 group-hover:text-[#FF385C] transition-colors" />
            <span>Thời lượng: <strong className="text-stone-900">{activeTrip.duration}</strong></span>
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
                    setBudgetError('');
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
                    setBudgetError('');
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
            setManualError('');
            setScanError('');
            setManualReceipt(null);
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
                            <span>{formatExpenseDate(exp)}</span>
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

                      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                        <div className="text-right mr-1">
                          <div className="font-black text-stone-900 text-sm sm:text-base">
                            {exp.amount.toLocaleString('vi-VN')} <span className="text-xs font-semibold text-stone-500">₫</span>
                          </div>
                        </div>

                        {/* Nút Chỉnh sửa khoản chi (giá tiền, địa điểm, phương thức) */}
                        <button
                          onClick={() => handleOpenEditExpense(exp)}
                          className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                          title="Chỉnh sửa giá tiền, địa điểm, phương thức thanh toán"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {/* Nút Xóa khoản chi */}
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
                  setScanError('');
                  setManualError('');
                  setManualReceipt(null);
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
              <form onSubmit={handleSaveManualExpense} className="space-y-4" noValidate>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                    <span>Lưu vào chuyến đi</span>
                    <span className="text-[10px] text-stone-400 font-normal">Có thể lưu cho chuyến cũ</span>
                  </label>
                  <select
                    value={targetTripIdForExpense}
                    onChange={(e) => setTargetTripIdForExpense(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-hidden cursor-pointer"
                  >
                    {trips.map(tr => (
                      <option key={tr.id} value={tr.id}>
                        {tr.name} ({tr.duration}) {tr.id === currentTripId ? '• Chuyến đang mở' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Địa điểm / Tên khoản chi *</label>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => { setManualTitle(e.target.value); setManualError(''); }}
                    maxLength={BUDGET_LIMITS.TITLE_MAX}
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
                      onChange={(e) => { setManualAmount(e.target.value); setManualError(''); }}
                      min={1}
                      step={1}
                      max={BUDGET_LIMITS.EXPENSE_MAX}
                      inputMode="numeric"
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
                    onChange={(e) => { setManualNote(e.target.value); setManualError(''); }}
                    maxLength={BUDGET_LIMITS.NOTE_MAX}
                    placeholder="VD: Cả nhóm chia đều 4 người..."
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                  />
                </div>

                {manualReceipt && (
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-3">
                    <img src={manualReceipt} alt="Ảnh hóa đơn đính kèm" className="w-10 h-10 rounded-lg object-cover border border-stone-200" />
                    <span className="flex-1 text-[11px] font-semibold text-stone-700">Đã đính kèm ảnh hóa đơn — hãy kiểm tra lại số tiền</span>
                    <button type="button" onClick={() => setManualReceipt(null)} className="p-1 text-stone-400 hover:text-rose-600 cursor-pointer" title="Bỏ ảnh đính kèm">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <FieldErrorText message={manualError} />

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

                {renderScanError()}

                {/* Kết quả bóc tách từ ảnh chụp */}
                {scanSuccess && scannedData && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>AI đã đọc xong — hãy kiểm tra lại số tiền trước khi lưu.</span>
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
                    <button
                      type="button"
                      onClick={() => openManualWithReceipt(scannedData)}
                      className="w-full py-2 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold cursor-pointer transition-colors"
                    >
                      Sửa trước khi lưu
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
                      Hỗ trợ ảnh JPG, PNG, WEBP, HEIC (tối đa 10MB). Ảnh được nén trước khi lưu; AI đọc số tiền và bạn kiểm tra lại trước khi lưu.
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

                {renderScanError()}

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
                      <span>
                        {scannedData.source === 'demo'
                          ? 'Đã đọc hóa đơn mẫu (Demo).'
                          : 'AI đã đọc xong — hãy kiểm tra lại số tiền trước khi lưu.'}
                      </span>
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
                    <button
                      type="button"
                      onClick={() => openManualWithReceipt(scannedData)}
                      className="w-full py-2 rounded-xl border border-emerald-300 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-bold cursor-pointer transition-colors"
                    >
                      Sửa trước khi lưu
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
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'border-[#FF385C] bg-[#FF385C]/5 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <div className="font-extrabold text-xs text-stone-900">{t.name}</div>
                      <div className="text-[11px] text-stone-500">{t.destination} • {t.duration}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mt-0.5">
                        <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>Thời gian tạo: {t.createdAt || '28/09/2026'}</span>
                      </div>
                      <div className="text-[10px] text-stone-500 mt-1 font-medium">
                        Ngân sách: {t.totalBudget.toLocaleString('vi-VN')} ₫ (Đã chi: {spent.toLocaleString('vi-VN')} ₫)
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-[#FF385C] shrink-0" />
                      )}
                      
                      {/* Nút Xóa chuyến đi */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTrip(t.id, t.name);
                        }}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Xóa chuyến đi này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setCreateTripName('');
                setCreateTripDestination('');
                setCreateTripStartDate('2026-11-05');
                setCreateTripEndDate('2026-11-08');
                setCreateTripBudget('6000000');
                setCreateTripError('');
                setIsCreateTripOpen(true);
              }}
              className="w-full py-2.5 border border-dashed border-stone-300 hover:border-stone-400 text-stone-700 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 hover:bg-stone-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo thêm chuyến đi mới</span>
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: TẠO CHUYẾN ĐI MỚI (CHỌN LỊCH GỌN NHẸ & TÍNH NGÀY ĐÊM)    */}
      {/* ============================================================== */}
      {isCreateTripOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900">Tạo chuyến đi mới</h3>
                  <p className="text-[11px] text-stone-500">Khởi tạo hành trình du lịch mới trong VietGo</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateTripOpen(false)} 
                className="p-1.5 text-stone-400 hover:text-stone-700 cursor-pointer rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTrip} className="space-y-3.5" noValidate>
              {/* Tên chuyến đi */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Tên chuyến đi <span className="text-[#FF385C]">*</span></label>
                <input
                  type="text"
                  value={createTripName}
                  onChange={(e) => { setCreateTripName(e.target.value); setCreateTripError(''); }}
                  maxLength={BUDGET_LIMITS.TRIP_NAME_MAX}
                  placeholder="VD: Kỳ nghỉ Phú Quốc, Săn mây Tà Xùa..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden focus:border-[#FF385C] focus:bg-white transition-all"
                  required
                  autoFocus
                />
              </div>

              {/* Điểm đến */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Điểm đến / Tỉnh thành</label>
                <input
                  type="text"
                  value={createTripDestination}
                  onChange={(e) => setCreateTripDestination(e.target.value)}
                  placeholder="VD: Phú Quốc, Kiên Giang (tùy chọn)"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden focus:border-[#FF385C] focus:bg-white transition-all"
                />
              </div>

              {/* Chọn lịch trình dự kiến */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700">Lịch trình & Thời lượng</label>
                  <span className="text-[11px] font-extrabold text-[#FF385C]">
                    ✨ {calculateDaysAndNights(createTripStartDate, createTripEndDate).text}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <span className="text-[10px] text-stone-500 font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#FF385C]" />
                      <span>Ngày khởi hành (đi)</span>
                    </span>
                    <div className="relative">
                      <input
                        type="date"
                        min={toLocalISODate()}
                        value={createTripStartDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCreateTripStartDate(val);
                          if (new Date(val) > new Date(createTripEndDate)) {
                            setCreateTripEndDate(val);
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required
                      />
                      <div className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 flex justify-between items-center pointer-events-none">
                        <span>{createTripStartDate ? new Date(createTripStartDate).toLocaleDateString('vi-VN') : 'DD/MM/YYYY'}</span>
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-stone-500 font-semibold flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-indigo-500" />
                      <span>Ngày kết thúc (về)</span>
                    </span>
                    <div className="relative">
                      <input
                        type="date"
                        min={createTripStartDate}
                        value={createTripEndDate}
                        onChange={(e) => setCreateTripEndDate(e.target.value)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        required
                      />
                      <div className="w-full p-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 flex justify-between items-center pointer-events-none">
                        <span>{createTripEndDate ? new Date(createTripEndDate).toLocaleDateString('vi-VN') : 'DD/MM/YYYY'}</span>
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ngân sách dự kiến */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Tổng ngân sách dự kiến (VNĐ)</label>
                <input
                  type="number"
                  value={createTripBudget}
                  onChange={(e) => { setCreateTripBudget(e.target.value); setCreateTripError(''); }}
                  min={1}
                  step={1}
                  placeholder="VD: 6000000"
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden focus:border-[#FF385C] focus:bg-white transition-all"
                  required
                />
                <div className="flex gap-1.5">
                  {[3000000, 5000000, 8000000, 10000000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setCreateTripBudget(val.toString())}
                      className="flex-1 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      {(val / 1000000)}Tr
                    </button>
                  ))}
                </div>
              </div>

              <FieldErrorText message={createTripError} />

              <div className="flex gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsCreateTripOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Tạo chuyến đi
                </button>
              </div>
            </form>
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

            <form onSubmit={handleSaveBudget} className="space-y-3" noValidate>
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-600">Số tiền ngân sách mới (VNĐ)</label>
                <input
                  type="number"
                  value={newBudgetValue}
                  onChange={(e) => { setNewBudgetValue(e.target.value); setBudgetError(''); }}
                  min={1}
                  step={1}
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

              <FieldErrorText message={budgetError} />
              {!budgetError && Number(newBudgetValue) > 0 && Number(newBudgetValue) < totalSpent && (
                <p className="text-[11px] font-semibold text-amber-700">
                  Lưu ý: ngân sách mới thấp hơn số đã chi ({totalSpent.toLocaleString('vi-VN')} ₫).
                </p>
              )}

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
      {/* MODAL: CHỌN LỊCH TRÌNH - THỜI LƯỢNG (NHỎ GỌN, TÍNH NGÀY ĐÊM)    */}
      {/* ============================================================== */}
      {isEditDurationOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 border border-stone-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FF385C]/10 text-[#FF385C] flex items-center justify-center font-bold">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900">Lịch trình chuyến đi</h3>
                  <div className="text-[11px] text-stone-500 truncate max-w-[200px]">{activeTrip.name}</div>
                </div>
              </div>
              <button 
                onClick={() => setIsEditDurationOpen(false)} 
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDuration} className="space-y-4" noValidate>
              {/* Thẻ hiển thị số ngày, số đêm tự động tính toán từ lịch */}
              {(() => {
                const calc = calculateDaysAndNights(editStartDate, editEndDate);
                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-stone-900 to-stone-800 text-white text-center space-y-1 shadow-sm">
                    <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-[#FF385C]" />
                      <span>Thời lượng tính từ lịch</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {calc.days} ngày {calc.nights > 0 ? `${calc.nights} đêm` : '0 đêm'}
                    </div>
                    <div className="text-[11px] text-stone-300">
                      {editStartDate ? new Date(editStartDate).toLocaleDateString('vi-VN') : ''} → {editEndDate ? new Date(editEndDate).toLocaleDateString('vi-VN') : ''}
                    </div>
                  </div>
                );
              })()}

              {/* 2 Ô chọn ngày nhỏ gọn */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#FF385C]" />
                    <span>Ngày đi</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={editStartDate}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setEditStartDate(newStart);
                        setDurationError('');
                        if (new Date(newStart) > new Date(editEndDate)) {
                          setEditEndDate(newStart);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    <div className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 flex justify-between items-center pointer-events-none">
                      <span>{editStartDate ? new Date(editStartDate).toLocaleDateString('vi-VN') : 'DD/MM/YYYY'}</span>
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-stone-700 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Ngày về</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      min={editStartDate}
                      value={editEndDate}
                      onChange={(e) => { setEditEndDate(e.target.value); setDurationError(''); }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required
                    />
                    <div className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 flex justify-between items-center pointer-events-none">
                      <span>{editEndDate ? new Date(editEndDate).toLocaleDateString('vi-VN') : 'DD/MM/YYYY'}</span>
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    </div>
                  </div>
                </div>
              </div>


              <FieldErrorText message={durationError} />

              <div className="flex gap-2.5 pt-2 border-t border-stone-100">
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
                  Lưu lịch trình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CHỈNH SỬA KHOẢN CHI (GIÁ TIỀN, ĐỊA ĐIỂM, PHƯƠNG THỨC)    */}
      {/* ============================================================== */}
      {isEditExpenseOpen && editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-stone-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900">Chỉnh sửa khoản chi</h3>
                  <div className="text-[11px] text-stone-500">Cập nhật giá tiền, địa điểm và phương thức thanh toán</div>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsEditExpenseOpen(false);
                  setEditingExpense(null);
                }} 
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer rounded-full hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditExpense} className="space-y-3.5" noValidate>
              {/* Địa điểm / Tên khoản chi */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Địa điểm / Tên khoản chi <span className="text-[#FF385C]">*</span></label>
                <input
                  type="text"
                  value={editExpenseTitle}
                  onChange={(e) => { setEditExpenseTitle(e.target.value); setEditError(''); }}
                  maxLength={BUDGET_LIMITS.TITLE_MAX}
                  placeholder="VD: Cơm niêu, Khách sạn..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden focus:border-[#FF385C] focus:bg-white"
                  required
                />
              </div>

              {/* Giá tiền & Danh mục */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Giá tiền (VNĐ) <span className="text-[#FF385C]">*</span></label>
                  <input
                    type="number"
                    value={editExpenseAmount}
                    onChange={(e) => { setEditExpenseAmount(e.target.value); setEditError(''); }}
                    min={1}
                    step={1}
                    placeholder="VD: 350000"
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:outline-hidden focus:border-[#FF385C] focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700">Danh mục chi tiêu</label>
                  <select
                    value={editExpenseCategory}
                    onChange={(e) => setEditExpenseCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-semibold text-stone-800 focus:outline-hidden cursor-pointer"
                  >
                    <option value="food">🍲 Ăn uống ẩm thực</option>
                    <option value="stay">🏨 Khách sạn / Lưu trú</option>
                    <option value="transport">🛵 Di chuyển / Phương tiện</option>
                    <option value="other">🎁 Khác (Vé tour, Quà...)</option>
                  </select>
                </div>
              </div>

              {/* Phương thức thanh toán */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Phương thức thanh toán</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditExpenseMethod('cash')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editExpenseMethod === 'cash' ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Tiền mặt</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditExpenseMethod('transfer')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editExpenseMethod === 'transfer' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Chuyển khoản QR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditExpenseMethod('card')}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      editExpenseMethod === 'card' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-stone-200 bg-white text-stone-600'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Thẻ / POS</span>
                  </button>
                </div>
              </div>

              {/* Ghi chú */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700">Ghi chú thêm (tùy chọn)</label>
                <input
                  type="text"
                  value={editExpenseNote}
                  onChange={(e) => { setEditExpenseNote(e.target.value); setEditError(''); }}
                  maxLength={BUDGET_LIMITS.NOTE_MAX}
                  placeholder="VD: Cả nhóm chia đều, đã bao gồm thuế..."
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden"
                />
              </div>

              <FieldErrorText message={editError} />

              <div className="flex gap-2.5 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditExpenseOpen(false);
                    setEditingExpense(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#FF385C] hover:bg-[#E00B41] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Lưu thay đổi
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

