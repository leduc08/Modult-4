// ============================================================================
// Quy tắc & tiện ích dùng chung cho Quản lý chi tiêu.
// Tách khỏi BudgetTracker để kiểm thử độc lập (xem tests/unit-budget.mts).
// ============================================================================

export const BUDGET_LIMITS = {
  EXPENSE_MAX: 1_000_000_000, // 1 tỷ ₫ cho một khoản chi
  BUDGET_MAX: 10_000_000_000, // 10 tỷ ₫ cho ngân sách một chuyến
  TITLE_MAX: 100,
  NOTE_MAX: 200,
  TRIP_NAME_MAX: 60,
  TRIP_MAX_DAYS: 90,
  MAX_TRIPS: 50,
  RECEIPT_FILE_MAX: 10 * 1024 * 1024, // ảnh gốc tối đa 10MB (sẽ được nén trước khi lưu)
  RECEIPT_MAX_SIDE: 1280
};

const formatVnd = (n: number) => `${n.toLocaleString('vi-VN')} ₫`;

// ---------------------------------------------------------------------------
// Tiền: số nguyên dương (VNĐ không có số lẻ), có giới hạn trên
// ---------------------------------------------------------------------------

export type MoneyResult = { value: number; error?: undefined } | { value?: undefined; error: string };

export const parseMoney = (raw: string | number, max: number, label = 'số tiền'): MoneyResult => {
  const text = String(raw ?? '').trim();
  if (!text) return { error: `Vui lòng nhập ${label}.` };
  const n = Number(text);
  if (!Number.isFinite(n)) return { error: `${capitalize(label)} không hợp lệ.` };
  if (!Number.isInteger(n)) return { error: `${capitalize(label)} phải là số nguyên (VNĐ không có số lẻ).` };
  if (n <= 0) return { error: `${capitalize(label)} phải lớn hơn 0.` };
  if (n > max) return { error: `${capitalize(label)} không được vượt quá ${formatVnd(max)}.` };
  return { value: n };
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const validateExpenseText = (title: string, note: string) => {
  const t = title.trim();
  if (!t) return 'Vui lòng nhập tên khoản chi.';
  if (t.length > BUDGET_LIMITS.TITLE_MAX) return `Tên khoản chi tối đa ${BUDGET_LIMITS.TITLE_MAX} ký tự.`;
  if (note.trim().length > BUDGET_LIMITS.NOTE_MAX) return `Ghi chú tối đa ${BUDGET_LIMITS.NOTE_MAX} ký tự.`;
  return '';
};

// ---------------------------------------------------------------------------
// Ngày
// ---------------------------------------------------------------------------

// Ngày theo giờ địa phương dạng YYYY-MM-DD (toISOString() dùng UTC → sai ngày trước 7h sáng ở VN)
export const toLocalISODate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parseISODate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const daysBetween = (start: string, end: string) =>
  Math.round((parseISODate(end).getTime() - parseISODate(start).getTime()) / 86_400_000);

export const describeDuration = (start: string, end: string) => {
  const nights = Math.max(0, daysBetween(start, end));
  return nights === 0 ? '1 ngày (đi về trong ngày)' : `${nights + 1} ngày ${nights} đêm`;
};

export const validateTripDates = (start: string, end: string) => {
  if (!start || !end) return 'Vui lòng chọn ngày đi và ngày về.';
  const diff = daysBetween(start, end);
  if (Number.isNaN(diff)) return 'Ngày không hợp lệ.';
  if (diff < 0) return 'Ngày về phải sau hoặc trùng ngày đi.';
  if (diff + 1 > BUDGET_LIMITS.TRIP_MAX_DAYS) return `Chuyến đi tối đa ${BUDGET_LIMITS.TRIP_MAX_DAYS} ngày.`;
  return '';
};

export const validateTripName = (name: string, existingNames: string[]) => {
  const n = name.trim();
  if (!n) return 'Vui lòng nhập tên chuyến đi.';
  if (n.length > BUDGET_LIMITS.TRIP_NAME_MAX) return `Tên chuyến đi tối đa ${BUDGET_LIMITS.TRIP_NAME_MAX} ký tự.`;
  if (existingNames.some((e) => normalizeSearch(e) === normalizeSearch(n))) return 'Đã có chuyến đi trùng tên.';
  return '';
};

// Nhãn thời gian hiển thị — tính lại mỗi lần render nên "Hôm nay" luôn đúng ngày
export const formatExpenseDate = (exp: { timestamp?: string; date?: string }, now = new Date()) => {
  if (!exp.timestamp) return exp.date ?? '';
  const d = new Date(exp.timestamp);
  if (Number.isNaN(d.getTime())) return exp.date ?? '';
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const dayDiff = daysBetween(toLocalISODate(d), toLocalISODate(now));
  if (dayDiff === 0) return `Hôm nay, ${time}`;
  if (dayDiff === 1) return `Hôm qua, ${time}`;
  return `${d.toLocaleDateString('vi-VN')} ${time}`;
};

// Ngày tuyệt đối để lưu & xuất CSV (không bao giờ lưu chữ "Hôm nay")
export const formatAbsoluteDate = (d = new Date()) =>
  `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;

// ---------------------------------------------------------------------------
// Tìm kiếm không dấu, không phân biệt hoa thường
// ---------------------------------------------------------------------------

export const normalizeSearch = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim();

// ---------------------------------------------------------------------------
// CSV (RFC 4180 + BOM cho Excel + chặn chèn công thức)
// ---------------------------------------------------------------------------

export const csvCell = (value: unknown) => {
  let s = value === undefined || value === null ? '' : String(value);
  // Ô bắt đầu bằng = + - @ bị Excel/Sheets hiểu là công thức → thêm dấu nháy đơn
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
};

export const buildExpenseCsv = (
  rows: { id: string; title: string; amount: number; category: string; date?: string; timestamp?: string; paymentMethod?: string; note?: string }[]
) => {
  const header = ['Mã', 'Tên khoản chi', 'Số tiền (VNĐ)', 'Danh mục', 'Thời gian', 'Phương thức', 'Ghi chú'].map(csvCell).join(',');
  const body = rows.map((e) =>
    [
      csvCell(e.id),
      csvCell(e.title),
      Number.isFinite(e.amount) ? e.amount : 0,
      csvCell(e.category),
      csvCell(e.timestamp ? formatAbsoluteDate(new Date(e.timestamp)) : e.date),
      csvCell(e.paymentMethod),
      csvCell(e.note)
    ].join(',')
  );
  return '﻿' + [header, ...body].join('\r\n');
};

// ---------------------------------------------------------------------------
// Ảnh hóa đơn: kiểm tra & nén trước khi lưu (localStorage chỉ ~5MB)
// ---------------------------------------------------------------------------

export const validateReceiptFile = (file: { type: string; size: number }) => {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type)) return 'Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc HEIC.';
  if (file.size > BUDGET_LIMITS.RECEIPT_FILE_MAX) return 'Ảnh quá lớn (tối đa 10MB).';
  return '';
};

export const compressImage = (dataUrl: string, maxSide = BUDGET_LIMITS.RECEIPT_MAX_SIDE, quality = 0.7) =>
  new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Trình duyệt không hỗ trợ xử lý ảnh.'));
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('Không đọc được ảnh. File có thể bị hỏng hoặc không phải ảnh.'));
    img.src = dataUrl;
  });

export const readFileAsDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Không đọc được file.'));
    reader.readAsDataURL(file);
  });

// ---------------------------------------------------------------------------
// Lưu trữ theo tài khoản + báo lỗi khi bộ nhớ đầy
// ---------------------------------------------------------------------------

// Khách giữ khóa cũ (không mất dữ liệu đã có); mỗi tài khoản có khóa riêng
export const budgetStorageKeys = (scope: string) => {
  const suffix = scope === 'guest' ? '' : `__${scope}`;
  return {
    trips: `vietgo_budget_trips${suffix}`,
    expenses: `vietgo_budget_expenses${suffix}`,
    currentTrip: `vietgo_current_trip_id${suffix}`
  };
};

// Trả về false thay vì nuốt lỗi — để UI báo cho người dùng khi bộ nhớ đầy
export const safeSetItem = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};
