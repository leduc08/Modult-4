# Bộ kiểm thử VietGo

Kiểm thử tự động cho **Đăng nhập / Đăng ký / Hồ sơ** và **Quản lý chi tiêu** — 227 case, không cần framework test.

## Chạy

```bash
cd tests
npm install        # lần đầu (cài playwright-core, dùng Chrome/Edge có sẵn trên máy)
npm test           # build → server riêng cổng 3100 → unit → API → E2E → tổng kết
```

- Không ảnh hưởng server `npm run dev` (cổng 3000) hay dữ liệu trình duyệt của bạn.
- Server test chạy **không có** `GEMINI_API_KEY` để kiểm tra đúng nhánh "AI không khả dụng".
- Không tìm thấy trình duyệt? Đặt biến `CHROME_PATH` tới file chrome.exe / msedge.exe.
- Đổi cổng: `TEST_PORT=3200 npm test`.

Chạy riêng phần unit (nhanh, không cần trình duyệt): `npm run test:unit`

## Các bộ test

| File | Nội dung | Số case |
|---|---|---|
| `unit-auth.mts` | Logic tài khoản: ràng buộc nhập liệu, đăng ký, đăng nhập, khóa tài khoản, Google, khôi phục, OTP | 91 |
| `unit-budget.mts` | Quy tắc chi tiêu: số tiền, ngày, chuyến đi, tìm kiếm không dấu, CSV, ảnh hóa đơn, lưu trữ | 42 |
| `api.mjs` | API server: xác thực Google (kể cả token giả mạo), quét hóa đơn | 16 |
| `e2e.mjs` | Giao diện thật trên Chrome headless: menu, đăng ký, hồ sơ, OTP, đăng nhập, khôi phục, chi tiêu | 78 |

## Kết quả

Sau mỗi lần chạy, xem trong `tests/reports/` (không đưa lên git):

- `summary.json` — tổng hợp
- `report-*.json` — chi tiết từng case
- `screenshots/<mã case>.png` — ảnh chụp màn hình khi case E2E lỗi
- `run.log` — log đầy đủ (nếu chạy `node run-all.mjs > reports/run.log`)

Báo cáo tổng hợp lần kiểm thử 28/09/2026: `E:\KADA2026\BAO_CAO_KIEM_THU.md`.
