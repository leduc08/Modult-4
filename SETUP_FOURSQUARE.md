# 📍 Hướng dẫn lấy API Key miễn phí (Foursquare)

Dự án này sử dụng bản đồ hoàn toàn **miễn phí** cho sinh viên thực tập. Thay vì dùng Google Maps bắt buộc nhập thẻ Visa và có rủi ro bị trừ tiền (800k/tháng), chúng ta sẽ dùng **Foursquare Places API**.

Foursquare cho phép bạn tìm kiếm địa điểm, xem ảnh, đánh giá hoàn toàn miễn phí (500 lượt tìm kiếm / ngày) và **KHÔNG yêu cầu thẻ tín dụng**.

---

## 🛠️ 3 Bước Đơn Giản Lấy API Key

### Bước 1: Đăng ký tài khoản
1. Truy cập trang web: [https://foursquare.com/developer/](https://foursquare.com/developer/)
2. Nhấn vào nút **Create an Account** (Tạo tài khoản) ở góc trên bên phải.
3. Điền Email, Mật khẩu và thông tin cơ bản của bạn để đăng ký (không cần thẻ tín dụng).

### Bước 2: Tạo Project (Dự án)
1. Sau khi đăng nhập, hệ thống sẽ đưa bạn đến trang Dashboard (Bảng điều khiển).
2. Nhấn nút **Create a New Project** (Tạo dự án mới).
3. Đặt tên dự án là gì cũng được, ví dụ: `ThucTapReact`.
4. Nhấn **Save** (Lưu).

### Bước 3: Copy API Key
1. Ngay khi tạo xong dự án, bạn sẽ nhìn thấy một mục tên là **API Keys**.
2. Nhấn nút **Generate New API Key** (Tạo khóa API mới).
3. Hệ thống sẽ tạo ra một đoạn mã dài bắt đầu bằng chữ `fsq3...`.
4. Nhấn nút **Copy** để sao chép đoạn mã này.

---

## 💻 Cách Cài Đặt Vào Code Của Bạn

1. Mở thư mục dự án trên máy tính, tìm file có tên `.env.example`.
2. Đổi tên file đó thành `.env` (xóa chữ `.example` đi).
3. Mở file `.env` lên bằng VSCode, tìm đến dòng có chữ `VITE_FOURSQUARE_API_KEY=`.
4. Dán đoạn mã bạn vừa Copy ở Bước 3 vào sau dấu bằng, ví dụ:
   ```text
   VITE_FOURSQUARE_API_KEY=fsq3_dOanMaBiaMatCuaBan...
   ```
5. Đảm bảo dòng `VITE_GOOGLE_MAPS_API_KEY=` để trống.
6. Lưu file lại (`Ctrl + S`).
7. Tắt Terminal (nếu đang chạy `npm run dev`) và chạy lại lệnh `npm run dev`.

🎉 **XONG!** Bây giờ ứng dụng của bạn đã có dữ liệu thật (hình ảnh, đánh giá, địa chỉ quán ăn, quán cafe) quanh 10 thành phố lớn mà không mất một đồng nào!
