# Quản trị dữ liệu địa điểm VietGo

Đóng góp từ nhiều máy qua Pull Request: xem [place-contributions.md](place-contributions.md).

Cập nhật: 01/10/2026. Trang quản trị ở `/admin/places`. Backend Express và SQLite của dự án lưu dữ liệu thật; JSON Foursquare/OSM trong `frontend/src/data/places/` là nguồn gốc chỉ đọc. Máy chủ cần Node.js 24 trở lên (`node:sqlite`).

## Cấp admin lần đầu

1. Cấu hình Google Sign-In theo [SETUP_GOOGLE_LOGIN.md](../SETUP_GOOGLE_LOGIN.md), đặt `GOOGLE_CLIENT_ID` ở **máy chủ**.
2. Đăng nhập bằng tài khoản Google cần cấp quyền, rồi mở `/api/admin/identity` trên cùng website để xem `sub` của chính phiên Google đã được máy chủ xác thực. API này chỉ đọc danh tính, không cấp quyền admin; khi chưa có phiên Google, API trả 401. Không dùng email làm căn cứ cấp quyền.
3. Đặt `ADMIN_GOOGLE_SUB` bằng `sub` ấy và `ADMIN_SESSION_SECRET` bằng chuỗi ngẫu nhiên ít nhất 32 ký tự trong cấu hình máy chủ. Khởi động lại máy chủ rồi đăng nhập lại. Không có API tự cấp quyền.
4. Đặt `VIETGO_DB_PATH` và `VIETGO_UPLOAD_DIR` trên ổ lưu trữ bền vững khi triển khai. Mặc định là `./data/vietgo.sqlite` và `./data/place-images/`. Sao lưu cả hai; không đưa chúng vào frontend hoặc Git.

Nếu thiếu Google Client ID, admin sub hoặc secret, chức năng quản trị không hoạt động. Đổi secret sẽ làm phiên hiện tại hết hạn. Chỉ phiên Google được máy chủ xác thực mới có thể được cấp quyền admin; hệ tài khoản email/điện thoại demo trong localStorage không cấp quyền này.

## Dữ liệu và quyền truy cập

- `/api/admin/place-records` và các API chi tiết, thêm, sửa, xóa mềm, khôi phục, trùng lặp, nhật ký, tải/xem ảnh quản trị đều cần cookie admin HttpOnly được ký tại server. Phiên hết hạn sau 8 giờ. Menu chỉ hiện sau khi `/api/admin/session` xác nhận quyền; backend vẫn kiểm tra mỗi yêu cầu.
- SQLite tự tạo hoặc bổ sung cột `version`, `deleted_at` vào bảng `place_overrides`, cùng bảng `place_audit` và `place_images` khi mở cơ sở dữ liệu. Không cần chạy migration thủ công cho bản SQLite hiện có. Bản JSON gốc không bị sửa; bản admin lưu riêng. ID nguồn và nguồn gốc được giữ khi nhập lại.
- API công khai `/api/places/:cityId` chỉ trả bản đã xuất bản, chưa xóa, còn tọa độ hợp lệ và không đóng cửa vĩnh viễn. Dữ liệu trả về chỉ gồm trường dùng trong sản phẩm; ghi chú nội bộ, trạng thái bản nháp, bản ghi audit và phiên bản không được công khai. Địa điểm tạm đóng cửa vẫn có thể xem nhưng bộ tạo lịch trình loại khỏi ứng viên mới.
- Khám phá, Xung quanh và bộ lập lịch mới đọc API chung sau khi làm mới trang. Backend AI cũng đọc API này. Lịch trình đã lưu giữ bản chụp hoạt động, không bị sửa theo dữ liệu mới; giao diện cảnh báo khi điểm đã gỡ hoặc đổi thông tin.
- Giá có ba trạng thái `unknown`, `free`, `priced`. Mức giá giữ đơn vị người/vé/món/cả nhóm; giá thiếu không chuyển thành 0. Giờ theo tuần có `unknown`, `closed`, `open`, `all_day`.
- Ảnh JPEG/PNG/WebP tối đa 5 MB được kiểm tra loại và dung lượng tại server, lưu ở `VIETGO_UPLOAD_DIR`. Ảnh chưa gắn với địa điểm công khai chỉ admin xem được. URL ảnh/website chỉ nhận HTTP(S) hoặc đường dẫn ảnh nội bộ hợp lệ.
- Xóa là xóa mềm, khác trạng thái đóng cửa. Khôi phục và mọi lần thêm/sửa/xóa ghi nhật ký gồm Google `sub` của admin, thời gian, ID và giá trị trường trước/sau. Sửa/xóa dùng `version`; phiên cũ nhận lỗi 409 thay vì ghi đè.

## Giới hạn vận hành

Hiện cấu hình chỉ định **một** Google `sub` làm admin. SQLite và thư mục ảnh phải nằm trên ổ đĩa còn dữ liệu sau khi triển khai lại; môi trường có filesystem tạm sẽ không đáp ứng lưu bền vững. Ảnh tải lên nhưng chưa gắn vào bản ghi có thể còn trong thư mục lưu trữ và cần được dọn theo chính sách vận hành. Danh sách JSON nguồn chỉ hỗ trợ các thành phố đang có trong dự án.

Khu vực được chọn khi tạo địa điểm và giữ cố định sau đó vì ID địa điểm nguồn thuộc danh mục thành phố gốc; để chuyển khu vực cần tạo bản ghi mới rồi xóa mềm bản cũ. Mỗi địa điểm hiện có một ảnh đại diện, chưa có thư viện nhiều ảnh. Chưa kiểm tra giao diện trên trình duyệt hoặc thiết bị thật trong lượt triển khai này.
