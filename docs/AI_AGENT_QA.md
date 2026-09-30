# Kiểm tra tình huống khách hàng — AI Agent

Ngày kiểm tra: 29/09/2026.

Planner backend đã kiểm tra bằng DeepSeek thật (`deepseek-flash`, suy luận tắt) qua API local: Đà Nẵng 3 ngày/2 khách/10 triệu trả 6 ID không trùng, 3,48 giây; Đà Lạt 2 ngày/3 khách/5 triệu trả 4 ID không trùng, 2,97 giây. Cả hai có summaryAI xác nhận dùng lựa chọn DeepSeek, không fallback. Các lượt trước: 68/68 test cục bộ/mô phỏng, TypeScript và build frontend/backend đạt; frontend còn cảnh báo chunk lớn.

Giao diện thực tế: nút Tạo lịch trình ở trang Lập lịch tạo thành công chuyến Đà Nẵng 3 ngày, nhưng PlannerSearchForm vẫn gọi makeTrip cục bộ, không gọi /api/plan-trip. Vì vậy việc chuyển backend sang DeepSeek chưa chuyển nút này sang DeepSeek. Chỉ xác minh và ghi nhận, không sửa luồng trong lượt kiểm tra. Chưa kiểm tra end-to-end nút tiếp tục từ chat AI bằng dữ liệu mới.

Bố cục AI trên trình duyệt desktop 1280×720: chuyển từ Khám phá, Lập lịch và Lịch trình về AI giữ header 1274×110, main y=110/h=521, ô nhập x=328/y=555, không dịch qua các lượt. Sau cuộn Lịch trình tới scrollY=70, trở về AI có scrollY=0; không có lỗi console trong lượt kiểm tra. Chưa kiểm tra di động/thiết bị cảm ứng. Local bật tạm để kiểm tra rồi đã tắt, không bật Cloudflare. Không sửa dữ liệu Supabase.

Kiểm tra cuộn chat mới nhất trên trình duyệt với phản hồi giả: bám cuối trong lúc hiện chữ, giữ vị trí khi cuộn lên và về cuối đúng; không cuộn toàn trang. TypeScript/build cuối đạt. Chưa kiểm tra thiết bị cảm ứng thật. Fixture và server thử đã dọn; không bật lại server chính/Cloudflare.

Cập nhật phạm vi chat: 65/65 test và TypeScript đạt sau thêm mẫu ngoài phạm vi theo phân loại model (`out_of_scope`). Test kiểm tra mẫu VietGo đúng chức năng, không nút/nguồn/ID, không hứa email/đặt vé, không thay lời xã giao/cập nhật chuyến đi bằng mẫu. Chưa gọi model thật hoặc kiểm tra trình duyệt/build trong lượt này; các kiểm tra trước bên dưới là lịch sử.

Luồng hiện tại: DeepSeek nhận ngữ cảnh rồi tự yêu cầu công cụ tra cứu hoặc trả lời ngay; không bị chặn tư vấn khi thiếu thành phố/vùng ngoài planner/ngày vượt giới hạn. 63/63 test cục bộ/mô phỏng, TypeScript và build đạt. DeepSeek thật với công cụ cục bộ: gợi ý mùa không cần chọn thành phố và đủ dữ kiện qua nhiều tin hiện nút planner. Chưa kiểm thử Supabase thật hoặc trình duyệt với luồng tool mới. Các kết quả bên dưới ghi các lượt trước.

Cập nhật mới nhất: 58/58 test, TypeScript và build đạt sau bổ sung `intent`/`plannerReady`. DeepSeek thật qua 4 tin bổ sung riêng: Hà Nội → 3 ngày → 2 người → 2 triệu; model và bộ kiểm chứng trả nút lịch trình ở lượt đủ thông tin, ba lượt trước chưa hiện. Không dùng Supabase trong phép thử; chưa kiểm tra trình duyệt/endpoint chat có Supabase sau sửa. Số liệu và giới hạn kiểm tra ở các mục dưới thuộc các lượt trước.

Trạng thái mới nhất: nút do DeepSeek đề xuất qua `suggestedActions`, code chỉ kiểm chứng. 56/56 test cục bộ/mô phỏng, TypeScript và build đạt sau chuyển luồng; chưa kiểm tra DeepSeek thật/trình duyệt với luồng mới. Các bảng và số liệu khảo sát bên dưới là lịch sử trước chuyển luồng. Test điều kiện từ khóa đã được thay bằng test đề xuất model, xác minh mục tiêu và dữ kiện khách.

Phạm vi: chạy toàn bộ 48 test trong `scripts/*.test.ts` và thử thêm 15 hội thoại bằng `getSuggestedChatActions`/`resolveChatAction` với model bằng `null`. Không gọi DeepSeek, Supabase hay web trong lượt kiểm tra này; không sửa dữ liệu hay hành vi sản phẩm. Kết quả kiểm tra parser dự phòng không chứng minh chất lượng câu trả lời của DeepSeek thật hoặc độ chính xác OCR trên ảnh thật.

## Kiểm thử tự động hiện có

48/48 đạt. Bao gồm trích xuất chuyến đi, ưu tiên cập nhật mới, ngân sách, chọn nút, định dạng/lỗi client DeepSeek, xử lý ảnh bằng phản hồi mô phỏng, gợi ý món/địa điểm, dữ liệu du lịch, phong cách trả lời, đối chiếu registry thành phố và lỗi chat.

## Thử hội thoại bổ sung trước sửa

Reply mô phỏng: “Mình tư vấn dựa trên dữ liệu hiện có.” Mốc hội thoại ban đầu khi cần: “Lên lịch trình Đà Nẵng 3 ngày 2 người ngân sách 10 triệu”. Các thông số dưới đây là kết quả trích xuất cục bộ, chưa thực hiện điều hướng/lưu lịch trình.

| Tình huống | Kết quả quan sát | Đánh giá |
|---|---|---|
| Đủ thông tin | Đà Nẵng, 3 ngày, 2 người, 10 triệu; có nút | Đạt |
| Thiếu số người | Không hiện nút; resolver riêng còn có mặc định 2 người | Đạt điều kiện UI |
| Điểm đến, ngày, người, ngân sách qua 4 tin | Tổng hợp đủ; hiện nút | Đạt |
| Đổi sang Đà Lạt 4 ngày | Đổi điểm đến/ngày, giữ 2 người và 10 triệu | Đạt |
| Đổi ngân sách còn 7 triệu | Dùng 7 triệu | Đạt |
| Đi cặp đôi | Nhận 2 người | Đạt |
| “Muon di Da Nang 3 ngay 2 nguoi ngan sach 10 trieu” | Không nhận 10 triệu; resolver dùng mặc định 5 triệu, không hiện nút | Cần sửa đơn vị tiền không dấu |
| Hỏi “Quán mì có món 50k không?” sau ngân sách 10 triệu, rồi “Tiếp tục lịch trình” | Nút vẫn hiện nhưng resolver lấy 50k rồi nâng về 100k thay ngân sách 10 triệu | Cần sửa, ưu tiên cao |
| Đổi sang Hà Giang sau Đà Nẵng | Nút vẫn hiện; resolver giữ Đà Nẵng | Cần sửa, ưu tiên cao |
| “3 người ngân sách 5 triệu mỗi người” | Lấy 5 triệu làm ngân sách nhóm | Cần hỏi rõ/đổi đơn vị ngân sách |
| “Ngân sách 5-7 triệu” | Chọn 7 triệu không xác nhận | Cần giữ khoảng/hỏi rõ |
| “2 người lớn 1 trẻ em” | Tính 2 người, bỏ trẻ em; nút vẫn hiện | Cần tách người lớn/trẻ em |
| “10 ngày” | Nút hiện, resolver giới hạn thành 7 ngày | Cần báo giới hạn thay vì âm thầm đổi |
| “Không tạo lịch trình” | Ẩn nút | Đạt |
| Chuyển sang hỏi quy định hành lý | Không kế thừa nút lịch trình | Đạt |

Khảo sát ban đầu: 8/15 đạt, 7/15 sai lệch. Hiện cả 7 đã được sửa và có test hồi quy đạt trong `scripts/tripState.test.ts`: nhận tiền không dấu; giữ ngân sách khi hỏi giá món/vé; chặn thành phố cũ khi đổi vùng chưa hỗ trợ; nhân ngân sách mỗi người theo tổng khách; hỏi mức cụ thể cho khoảng tiền; tính cả trẻ em/em bé; báo giới hạn ngày thay vì âm thầm giảm xuống 7.

Kết quả sau sửa: 55/55 test đạt; TypeScript và build đạt. Build còn cảnh báo bundle lớn. Các số liệu 48 test và bảng khảo sát trên là kết quả lịch sử trước sửa. Không gọi API thật hoặc kiểm tra giao diện trong lượt sửa.

## Hướng cải tiến từ khảo sát

Các mục 1–4 đã áp dụng cho những trường hợp kiểm thử với trạng thái dùng chung `ai/tripState.ts`; chưa lưu tin nhắn nguồn riêng cho từng trường. Mục 5 chưa thực hiện. Cách nói mơ hồ/phủ định vẫn cần khách kiểm tra thẻ.

1. Dùng trạng thái chuyến đi thống nhất cho chat, nút và thẻ xác nhận; cập nhật theo thứ tự tin nhắn, giữ phạm vi ngân sách nhóm/mỗi người và trạng thái thiếu/mơ hồ.
2. Ngăn ghi đè ngân sách bởi giá món/vé; chỉ nhận ngân sách chuyến đi hoặc câu trả lời đang bổ sung ngân sách. Mở rộng đơn vị không dấu và khoảng tiền; hỏi lại khi chưa rõ phạm vi, không tự chọn giá trị.
3. Xử lý đổi chuyến/điểm đến ngoài vùng hỗ trợ: phản hồi đúng điểm đến khách vừa nêu, báo giới hạn lập lịch trình, không quay lại địa điểm cũ. Tách thông tin được giữ sang chuyến mới và trường cần xác nhận.
4. Kiểm tra giới hạn trước khi hiện nút và trước khi thực hiện; không tự giảm 10 ngày xuống 7 hoặc bỏ trẻ em. Giữ form/thẻ xem trước cho khách sửa các trường mơ hồ.
5. Bổ sung bộ đánh giá bằng DeepSeek thật sau khi các lỗi cục bộ được sửa: đổi điểm đến, hỏi nối tiếp, thiếu dữ liệu, nguồn mâu thuẫn, ngắn gọn và không bịa giá. Dùng mẫu nhỏ có kiểm soát, đo token/thời gian và không gửi dữ liệu nhạy cảm. Ảnh cần kiểm tra riêng với hóa đơn/phong cảnh/món ăn thật.

## Chưa kiểm chứng trong lượt này

- Không đánh giá câu trả lời tự do của DeepSeek thật hoặc trải nghiệm trên trình duyệt.
- Không đo token, độ trễ, độ chính xác nhận diện ảnh thật hoặc kết nối Supabase thật.
- Đã sửa lỗi trong phạm vi Trợ lý AI; không sửa dữ liệu địa điểm/Supabase hoặc tính năng khác.
