# Gửi thay đổi địa điểm bằng Pull Request

Cập nhật: 01/10/2026. Luồng này hỗ trợ **thêm** và **sửa** địa điểm đang tồn tại. Xóa/khôi phục chưa được đóng gói. Dữ liệu nguồn JSON vẫn chỉ đọc; trang admin lưu bản sửa vào SQLite.

## Người đóng góp

1. Lấy mã mới nhất có trang admin. Dùng Node.js 24, cài `npm ci`, cấu hình Google admin và SQLite **riêng trên máy của bạn**. Không commit `.env`, SQLite hoặc toàn bộ thư mục ảnh.
2. Nếu muốn sửa địa điểm do PR trước tạo ra, trước hết nhập các gói PR đã duyệt vào SQLite riêng để có cùng ID. Nếu sửa địa điểm nguồn JSON, có thể bắt đầu từ danh mục nguồn.
3. Thêm hoặc sửa trên trang admin. Lấy `cityId` và `placeId` qua API admin hoặc nhờ AI đọc bản ghi SQLite. Mỗi gói chứa một địa điểm:

   ```powershell
   npm run places:export -- da-nang admin-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx contributions/ten-goi
   ```

   Với địa điểm nguồn, thay ID admin bằng ID nguồn, ví dụ `osm-node-13597246831`. Gói gồm `manifest.json` và ảnh tải lên đang dùng (nếu có). Đọc manifest trước khi commit: các trường như `internalNotes` có thể chứa thông tin không nên công khai trong PR.
4. Commit **chỉ thư mục gói**, đẩy nhánh riêng và tạo Pull Request. Không chạy `git add -A` nếu máy có thay đổi khác. Người duyệt kiểm tra nguồn ảnh, quyền sử dụng, trùng lặp và các trường đã sửa.

Nếu sau khi xuất gói bạn tiếp tục sửa **cùng địa điểm**, truyền số `audit cuối` mà lệnh xuất đã in ở tham số thứ tư. Điều này tránh đóng gói lại các thay đổi cũ:

```powershell
npm run places:export -- da-nang <placeId> contributions/ten-goi-tiep-theo <auditCuoi>
```

## Máy chủ chung / người duyệt

Sau khi gộp Pull Request, kéo mã mới về máy chủ chung. Kiểm tra trước, sau đó nhập:

```powershell
npm run places:import -- contributions/ten-goi
npm run places:import -- contributions/ten-goi --apply
```

Lệnh đầu chỉ kiểm tra. Lệnh thứ hai ghi vào SQLite và thư mục ảnh của máy đang chạy lệnh. Hãy sao lưu SQLite và ảnh trước khi nhập. Chạy lặp gói đã nhập sẽ bỏ qua nếu dữ liệu giống nhau. Nếu cùng trường của một địa điểm đã thay đổi ở máy chủ, lệnh báo xung đột để người duyệt xử lý; nó không tự ghi đè. Trường khác không bị thay đổi được giữ nguyên.

Máy chủ dùng `VIETGO_DB_PATH` và `VIETGO_UPLOAD_DIR` hiện có. Sau khi nhập, API địa điểm và các trang đọc dữ liệu từ SQLite sẽ thấy bản mới. GitHub không tự nhập gói khi chỉ gộp PR; người vận hành phải chạy lệnh trên máy chủ chung. Người đóng góp không cần quyền admin trên máy chủ chung.

Giới hạn: mỗi gói chỉ có một địa điểm; địa điểm mới phải giữ ID `admin-...` của máy tạo. Công cụ từ chối địa điểm nghi trùng, ảnh thiếu/sai SHA-256, và trường sửa có xung đột. Nếu người đóng góp đã tự sửa cùng bản ghi nhiều lần, gói xuất chứa trạng thái cuối cùng. Khi tạo PR kế tiếp, dùng mốc audit phù hợp hoặc làm mới SQLite riêng từ các gói đã duyệt.
