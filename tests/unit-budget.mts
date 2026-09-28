// Unit test quy tắc Quản lý chi tiêu (frontend/src/utils/budgetRules.ts)
// Chạy: npx --prefix .. tsx unit-budget.mts
import { writeFileSync } from 'node:fs';
import { group, test, expect, summary } from './harness.mjs';

const R = await import(new URL('../frontend/src/utils/budgetRules.ts', import.meta.url).href);
const { BUDGET_LIMITS: L } = R;

// ---------------------------------------------------------------------------
group('O. Số tiền');
await test('M01', 'Số nguyên dương hợp lệ (150000)', () => expect(R.parseMoney('150000', L.EXPENSE_MAX).value).toBe(150000));
await test('M02', 'Để trống → yêu cầu nhập', () => expect(R.parseMoney('', L.EXPENSE_MAX).error).toContain('Vui lòng nhập'));
await test('M03', 'Bằng 0 → phải lớn hơn 0', () => expect(R.parseMoney('0', L.EXPENSE_MAX).error).toContain('lớn hơn 0'));
await test('M04', 'Số âm → phải lớn hơn 0', () => expect(R.parseMoney('-50000', L.EXPENSE_MAX).error).toContain('lớn hơn 0'));
await test('M05', 'Số lẻ 1000.5 → VNĐ không có số lẻ', () => expect(R.parseMoney('1000.5', L.EXPENSE_MAX).error).toContain('số nguyên'));
await test('M06', 'Vượt 1 tỷ/khoản chi → chặn', () => expect(R.parseMoney('1000000001', L.EXPENSE_MAX).error).toContain('vượt quá'));
await test('M07', 'Đúng 1 tỷ → hợp lệ (biên trên)', () => expect(R.parseMoney('1000000000', L.EXPENSE_MAX).value).toBe(1_000_000_000));
await test('M08', 'Chữ "abc" → không hợp lệ', () => expect(R.parseMoney('abc', L.EXPENSE_MAX).error).toContain('không hợp lệ'));
await test('M09', 'Ngân sách vượt 10 tỷ → chặn, thông báo dùng chữ "Ngân sách"', () =>
  expect(R.parseMoney('10000000001', L.BUDGET_MAX, 'ngân sách').error).toContain('Ngân sách không được vượt quá'));
await test('M10', 'Khoảng trắng hai đầu được bỏ qua', () => expect(R.parseMoney('  250000 ', L.EXPENSE_MAX).value).toBe(250000));

// ---------------------------------------------------------------------------
group('P. Tên & ghi chú khoản chi');
await test('X01', 'Tên trống → báo lỗi', () => expect(R.validateExpenseText('   ', '')).toContain('tên khoản chi'));
await test('X02', 'Tên 100 ký tự → hợp lệ (biên)', () => expect(R.validateExpenseText('A'.repeat(100), '')).toBe(''));
await test('X03', 'Tên 101 ký tự → chặn', () => expect(R.validateExpenseText('A'.repeat(101), '')).toContain('tối đa 100'));
await test('X04', 'Ghi chú 201 ký tự → chặn', () => expect(R.validateExpenseText('Cơm', 'x'.repeat(201))).toContain('Ghi chú tối đa'));

// ---------------------------------------------------------------------------
group('Q. Ngày & chuyến đi');
await test('D01', '15/10 → 18/10 = "4 ngày 3 đêm"', () => expect(R.describeDuration('2026-10-15', '2026-10-18')).toBe('4 ngày 3 đêm'));
await test('D02', 'Cùng ngày = "1 ngày (đi về trong ngày)"', () => expect(R.describeDuration('2026-10-15', '2026-10-15')).toBe('1 ngày (đi về trong ngày)'));
await test('D03', 'Qua tháng / năm tính đúng (31/12 → 02/01 = 3 ngày 2 đêm)', () =>
  expect(R.describeDuration('2026-12-31', '2027-01-02')).toBe('3 ngày 2 đêm'));
await test('D04', 'Ngày về trước ngày đi → chặn', () => expect(R.validateTripDates('2026-10-18', '2026-10-15')).toContain('Ngày về'));
await test('D05', 'Chuyến 91 ngày → chặn (tối đa 90)', () => expect(R.validateTripDates('2026-01-01', '2026-04-01')).toContain('tối đa 90'));
await test('D06', 'Chuyến đã bắt đầu (ngày trong quá khứ) vẫn hợp lệ', () => expect(R.validateTripDates('2020-01-01', '2020-01-05')).toBe(''));
await test('D07', 'Thiếu ngày → yêu cầu chọn', () => expect(R.validateTripDates('', '2026-10-15')).toContain('Vui lòng chọn'));
await test('D08', 'Ngày địa phương (không bị lùi 1 ngày do UTC lúc 2h sáng)', () =>
  expect(R.toLocalISODate(new Date(2026, 8, 28, 2, 0))).toBe('2026-09-28'));
await test('D09', 'Nhãn "Hôm nay" tính theo ngày hiện tại', () => {
  const now = new Date(2026, 8, 28, 15, 0);
  expect(R.formatExpenseDate({ timestamp: new Date(2026, 8, 28, 10, 5).toISOString() }, now)).toContain('Hôm nay');
});
await test('D10', 'Hôm sau hiển thị "Hôm qua", 2 ngày sau hiển thị ngày cụ thể', () => {
  const ts = new Date(2026, 8, 28, 10, 5).toISOString();
  expect(R.formatExpenseDate({ timestamp: ts }, new Date(2026, 8, 29, 9, 0))).toContain('Hôm qua');
  expect(R.formatExpenseDate({ timestamp: ts }, new Date(2026, 8, 30, 9, 0))).toContain('28/9/2026');
});
await test('D11', 'Dữ liệu cũ không có timestamp → giữ nguyên chữ đã lưu', () => expect(R.formatExpenseDate({ date: '15/04' })).toBe('15/04'));
await test('D12', 'Ngày lưu trữ là ngày tuyệt đối, không phải "Hôm nay"', () =>
  expect(R.formatAbsoluteDate(new Date(2026, 8, 28, 10, 5))).notToContain('Hôm nay'));
await test('V01', 'Tên chuyến trùng (khác hoa thường, khác dấu) → chặn', () =>
  expect(R.validateTripName('da nang 2026', ['Đà Nẵng 2026'])).toContain('trùng tên'));
await test('V02', 'Tên chuyến > 60 ký tự → chặn', () => expect(R.validateTripName('A'.repeat(61), [])).toContain('tối đa 60'));
await test('V03', 'Tên chuyến trống → chặn', () => expect(R.validateTripName('  ', [])).toContain('Vui lòng nhập'));

// ---------------------------------------------------------------------------
group('R. Tìm kiếm & CSV');
await test('N01', 'Tìm không dấu: "Bún Chả" → "bun cha"', () => expect(R.normalizeSearch('Bún Chả')).toBe('bun cha'));
await test('N02', 'Chữ "đ/Đ" → "d": "Đà Nẵng" → "da nang"', () => expect(R.normalizeSearch('Đà Nẵng')).toBe('da nang'));
await test('V04', 'CSV: ngoặc kép trong ô được nhân đôi', () => expect(R.csvCell('Cơm "niêu"')).toBe('"Cơm ""niêu"""'));
await test('V05', 'CSV: ô bắt đầu bằng = + - @ bị vô hiệu công thức', () => {
  for (const v of ['=1+1', '+SUM(A1)', '-2+3', '@cmd']) expect(R.csvCell(v).startsWith(`"'`)).toBe(true);
});
await test('V06', 'CSV: có BOM UTF-8, xuống dòng CRLF, đúng số dòng', () => {
  const csv = R.buildExpenseCsv([
    { id: 'e1', title: 'Cơm, "niêu"', amount: 120000, category: 'food', timestamp: new Date(2026, 8, 28, 10).toISOString(), paymentMethod: 'cash', note: 'chia 2' },
    { id: 'e2', title: 'Taxi', amount: 80000, category: 'transport', date: '15/04' }
  ]);
  expect(csv.charCodeAt(0)).toBe(0xfeff);
  expect(csv.split('\r\n').length).toBe(3);
  expect(csv).toContain('"Cơm, ""niêu"""');
  expect(csv).toContain(',120000,');
});

// ---------------------------------------------------------------------------
group('S. Ảnh hóa đơn & lưu trữ');
await test('F01', 'File PDF → chặn (chỉ nhận ảnh)', () => expect(R.validateReceiptFile({ type: 'application/pdf', size: 1000 })).toContain('Chỉ hỗ trợ ảnh'));
await test('F02', 'Ảnh 11MB → chặn (tối đa 10MB)', () => expect(R.validateReceiptFile({ type: 'image/jpeg', size: 11 * 1024 * 1024 })).toContain('tối đa 10MB'));
await test('F03', 'Ảnh JPG / PNG / WEBP / HEIC hợp lệ', () => {
  for (const t of ['image/jpeg', 'image/png', 'image/webp', 'image/heic']) expect(R.validateReceiptFile({ type: t, size: 500_000 })).toBe('');
});
await test('F04', 'GIF / SVG → chặn (SVG có thể chứa mã độc)', () => {
  expect(R.validateReceiptFile({ type: 'image/gif', size: 100 })).toContain('Chỉ hỗ trợ ảnh');
  expect(R.validateReceiptFile({ type: 'image/svg+xml', size: 100 })).toContain('Chỉ hỗ trợ ảnh');
});
await test('K01', 'Khách dùng khóa cũ (giữ dữ liệu sẵn có)', () => expect(R.budgetStorageKeys('guest').trips).toBe('vietgo_budget_trips'));
await test('K02', 'Mỗi tài khoản có khóa lưu trữ riêng', () => {
  const a = R.budgetStorageKeys('user-a'); const b = R.budgetStorageKeys('user-b');
  expect(a.expenses).toBe('vietgo_budget_expenses__user-a');
  expect(a.expenses === b.expenses).toBe(false);
});
await test('K03', 'Bộ nhớ đầy → safeSetItem trả false (để UI cảnh báo)', () => {
  (globalThis as any).localStorage = { setItem: () => { throw new DOMException('quota', 'QuotaExceededError'); } };
  expect(R.safeSetItem('k', 'v')).toBe(false);
});
await test('K04', 'Lưu thành công → safeSetItem trả true', () => {
  (globalThis as any).localStorage = { setItem: () => {} };
  expect(R.safeSetItem('k', 'v')).toBe(true);
});

const report = summary('Unit – Quản lý chi tiêu');
writeFileSync(new URL('./reports/report-unit-budget.json', import.meta.url), JSON.stringify(report, null, 2));
