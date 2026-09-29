# Quy tắc bắt buộc trước khi sửa đổi dự án

Mọi trợ lý AI/agent làm việc trong dự án phải đọc và tuân thủ file này trước khi sửa đổi mã nguồn, cấu hình hoặc dữ liệu.

## 1. Chỉ được sửa đổi tính năng Trợ lý AI

- Không được sửa đổi bất kỳ tính năng nào khác ngoài **Trợ lý AI**, trừ khi người dùng cho phép rõ ràng.
- Các tính năng như Khám phá, Xung quanh/Bản đồ, Lịch trình, Yêu thích, hồ sơ và các chức năng khác phải giữ nguyên khi chưa được cho phép.
- Nếu yêu cầu về Trợ lý AI cần sửa trang, thành phần dùng chung, API, cấu hình hoặc dữ liệu có thể ảnh hưởng đến tính năng khác, phải giải thích phạm vi và xin phép người dùng trước khi thực hiện.
- Không xem việc tích hợp với Trợ lý AI là sự cho phép mặc định để sửa tính năng khác.
- Quy tắc này áp dụng cho các thay đổi từ thời điểm file được tạo; không tự ý hoàn tác các thay đổi trước đó nếu người dùng chưa yêu cầu.

## 2. Bảo toàn công việc hiện có

- Không tự ý xoá, ghi đè hoặc hoàn tác thay đổi hiện có của người dùng.
- Chỉ thay đổi những gì cần thiết trong phạm vi được phép; không tự ý tái cấu trúc hoặc chỉnh sửa không liên quan.

## 3. Kiểm tra và báo cáo

- Kiểm tra các thay đổi trong phạm vi phù hợp trước khi bàn giao.
- Nêu rõ những phần đã sửa, phần đã kiểm tra và các giới hạn chưa kiểm chứng.
- Nếu phát hiện cần mở rộng phạm vi sang tính năng khác, dừng phần công việc đó và xin phép người dùng.

## 4. Bảo vệ thông tin bí mật

- Không đưa API key, khoá riêng hoặc thông tin bí mật vào mã nguồn, log, câu trả lời hay commit.
- Không tự ý thay đổi hoặc xoá dữ liệu trên Supabase và các dịch vụ bên ngoài nếu chưa được người dùng cho phép.

## 5. Đồng bộ tài liệu AI với trạng thái dự án

- Mỗi khi thêm hoặc chỉnh sửa tính năng AI, phải cập nhật `docs/AI_AGENT_CHANGELOG.md` trong cùng lượt làm việc.
- Khi một chức năng, cấu hình hoặc luồng AI bị xoá khỏi dự án, xoá mô tả tương ứng đã không còn đúng trong tài liệu; không để người đọc hiểu rằng chức năng đó vẫn tồn tại.
- Khi cách hoạt động thay đổi, thay mô tả cũ bằng mô tả hiện tại, không chỉ thêm ghi chú mâu thuẫn với phần cũ.
- Cập nhật ngày tài liệu và kết quả kiểm tra đúng thực tế; không tự nhận đã kiểm thử những phần chưa kiểm thử.
- Việc cập nhật tài liệu không cho phép tự ý xoá chức năng trong code hay mở rộng phạm vi sửa đổi.
