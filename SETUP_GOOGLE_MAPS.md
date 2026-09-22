# Hướng dẫn cấu hình Google Maps

Tài liệu này hướng dẫn bật Google Maps cho **NearbyPage** (trang "Xung quanh tôi").

Nếu bỏ qua cấu hình này, ứng dụng vẫn hoạt động hoàn toàn bằng **dữ liệu mẫu** (Sample Data Mode).

---

## Bước 1 — Tạo project Google Cloud

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Đảm bảo đã bật **billing** (bắt buộc để dùng Maps APIs)
   > Google cấp **$200 USD free credit/tháng** — đủ cho phát triển và demo với lượng request nhỏ

---

## Bước 2 — Bật các API cần thiết

Vào **APIs & Services → Library**, tìm và bật **hai API sau**:

| API | Ghi chú |
|-----|---------|
| **Maps JavaScript API** | Render bản đồ tương tác |
| **Places API (New)** | Nearby Search + Place Details. **KHÔNG dùng Places API (Legacy)** |

---

## Bước 3 — Tạo API Key

1. Vào **APIs & Services → Credentials**
2. Nhấn **Create Credentials → API key**
3. Copy key vừa tạo

### Giới hạn key (bắt buộc cho production)

Nhấn **Edit API key** → **Application restrictions → HTTP referrers**:

```
localhost:*
localhost:5173/*
your-domain.com/*
*.your-domain.com/*
```

### Giới hạn theo API

Trong phần **API restrictions**, chọn **Restrict key** và tick:
- ✅ Maps JavaScript API
- ✅ Places API (New)

---

## Bước 4 — Cấu hình trong dự án

Tạo file `.env` tại root dự án (copy từ `.env.example`):

```bash
cp .env.example .env
```

Mở `.env` và điền key:

```bash
VITE_GOOGLE_MAPS_API_KEY=AIzaSy...your_actual_key_here
```

> ⚠️ **KHÔNG commit file `.env` vào git.** File `.gitignore` đã exclude nó.

---

## Bước 5 — Kiểm tra

```bash
npm run dev
```

Mở trang **Xung quanh** → nếu cấu hình đúng:
- Badge "📊 Mẫu" **không hiện** nữa
- Nút toggle "🔄 Google Live / 📊 Dữ liệu mẫu" xuất hiện (dành cho nhóm test)
- Nhấn **"Tìm quanh đây"** → kết quả thực từ Google Maps

---

## Chính sách sử dụng

Theo [Google Maps Platform Terms of Service](https://cloud.google.com/maps-platform/terms):

- ✅ Được phép: Hiển thị `place_id` trong database để tham chiếu
- ✅ Được phép: Lưu thứ tự, ngày đi, ghi chú của user
- ❌ Không được: Lưu `name`, `address`, `photos`, `rating` từ Places API vào database lâu dài
- ❌ Không được: Hiển thị kết quả Places trên bản đồ non-Google (Leaflet/OSM)

Attribution "Powered by Google" và tên tác giả ảnh đã được giữ trong code.

---

## Chi phí ước tính

| API | Giá | Ghi chú |
|-----|-----|---------|
| Maps JavaScript API | $7/1000 tải | Chỉ tính khi render bản đồ |
| Nearby Search (Basic fields) | $0.032/request | Dùng `NEARBY_SEARCH_FIELDS` đã chọn lọc |
| Place Details (Advanced) | $0.017/request | Chỉ 1 request khi mở chi tiết, có cache |

Với free credit $200/tháng, ứng dụng có thể xử lý hàng nghìn request trước khi phát sinh chi phí.
