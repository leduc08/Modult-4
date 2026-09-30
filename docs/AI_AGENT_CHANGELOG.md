# Tổng hợp thay đổi AI Agent — VietGo

Cập nhật tài liệu: 01/10/2026.

- Ngày 01/10/2026: Gói đóng góp địa điểm qua Pull Request được nhập vào cùng SQLite quản trị mà công cụ tra địa điểm của Trợ lý AI đang đọc. Luồng AI và quyền ghi của AI không đổi; địa điểm đã nhập chỉ xuất hiện với AI khi thỏa điều kiện công khai hiện có. Đã kiểm tra TypeScript, build và kiểm thử xuất/nhập địa điểm; chưa kiểm tra dịch vụ AI bên ngoài.

- Ngày 29/09/2026: API công khai địa điểm dùng chung với Trợ lý AI và `/api/plan-trip` chỉ trả địa điểm đã xuất bản, chưa xóa và có tọa độ hợp lệ; bộ lập lịch AI loại địa điểm tạm đóng cửa và đóng cửa vĩnh viễn. Chỉnh sửa quản trị nằm riêng trong SQLite, nên nhập lại JSON nguồn không ghi đè bản admin. Không thay đổi prompt hay quyền ghi của công cụ AI. Đã kiểm tra kiểu dữ liệu, build và kiểm thử API quản trị; chưa gọi thử dịch vụ AI bên ngoài.
- Ngày 29/09/2026: tab Trợ lý AI giữ khoảng thanh cuộn ngoài và đặt vị trí cuộn trang về đầu trước khi vẽ để giảm lệch bố cục khi chuyển tab. Chỉ khoá cuộn ngoài khi tab AI được gắn; khôi phục các style trước đó khi rời tab, giữ cuộn bên trong chat. Không sửa các tab khác. TypeScript và git diff --check đạt; chưa kiểm tra trực quan trên trình duyệt cho thay đổi này.
- Ngày 29/09/2026: sau khi đồng bộ nhánh `main`, công cụ tra địa điểm của Trợ lý AI đọc danh mục đã ghép các chỉnh sửa quản trị từ SQLite. Chat và lịch trình vẫn dùng DeepSeek; Gemini chỉ phục vụ đọc hóa đơn. TypeScript, bản build và 15 bài kiểm thử liên quan đã đạt; chưa kiểm tra tương tác AI với dịch vụ bên ngoài.

Tài liệu ghi lại phần Trợ lý AI hiện trên nhánh làm việc, bao gồm các tích hợp dữ liệu địa điểm và planner. Đây là mô tả trạng thái triển khai, không phải cam kết rằng mọi tình huống đã được kiểm thử.

Quy tắc duy trì: thêm thay đổi AI mới vào tài liệu; cập nhật mô tả khi cách hoạt động thay đổi; xoá mô tả chức năng đã bị xoá khỏi dự án. Tài liệu phải phản ánh trạng thái hiện tại, không giữ các mô tả tính năng đã lỗi thời. Quy tắc bắt buộc được ghi trong `AGENTS.md`.

## 1. Đổi nhà cung cấp AI sang DeepSeek

- Thay kết nối Gemini của trợ lý du lịch bằng client DeepSeek chạy ở backend.
- Model mặc định hiện tại: `deepseek-flash`.
- Tắt suy luận mặc định bằng tham số API `thinking: { type: 'disabled' }` để tránh phát sinh phần token suy luận cho tác vụ thông thường.
- Cho phép cấu hình model và chế độ suy luận qua biến môi trường.
- Giữ API key ở server; frontend không nhận hoặc lưu key.
- Có xử lý lỗi kết nối, xác thực, số dư, giới hạn yêu cầu, phản hồi trống và phản hồi vượt giới hạn độ dài.
- Hỗ trợ phản hồi JSON và kiểm tra cấu trúc JSON cho các tác vụ trích xuất/lập lịch trình.

Hiện tại, DeepSeek Flash phục vụ chat, phân tích ảnh và backend tạo lịch trình `/api/plan-trip`. Gemini vẫn giữ riêng cho bộ đọc hóa đơn sẵn có của nhóm. Các file chính: `ai/deepseekClient.ts`, `backend/server.ts`, `backend/verifiedChat.ts`, `backend/verifiedPlanRoute.ts`, `.env.example`.

## 2. Trả lời dựa trên dữ liệu Supabase

DeepSeek **không trực tiếp truy cập Supabase**. `/api/chat` gửi tin mới, 8 tin gần nhất (tối đa 1.200 ký tự/tin) và thông tin khách tổng hợp từ toàn bộ lịch sử cho model. Model quyết định trả lời/hỏi bổ sung ngay hoặc gọi công cụ chỉ đọc; backend thực hiện, trả kết quả về model rồi model viết câu trả lời và đề xuất nút.

- `search_tourism_knowledge`: tra Supabase/Kaggle và nguồn dự phòng theo cấu hình, query do model tạo có ngữ cảnh điểm đến. Không tự truy vấn Supabase trước mọi tin nhắn nữa.
- `search_place_catalog`: đọc danh mục địa điểm của thành phố được allowlist cùng các chỉnh sửa quản trị trong SQLite, lọc nhóm tham quan/ăn uống, tối đa 12 ứng viên; chỉ các ID model chọn từ kết quả công cụ mới được xác minh để mở bản đồ/quán ăn.
- `get_seasonal_destinations`: đọc `bestMonths`/`weatherSummary` từ `database/vietnamData.ts`; không cần khách nêu thành phố. Model được gửi ngày hiện tại tại Việt Nam để hiểu “mùa này”, không coi khí hậu tham khảo là dự báo.
- Giới hạn một đợt tối đa 2 công cụ và tối đa 2 lần gọi DeepSeek/tin; lần cuối không cho gọi thêm công cụ. Công cụ không có SQL, URL tùy ý, ghi/xóa dữ liệu hoặc tự tạo lịch trình. Tham số được kiểm tra, đường dẫn catalog chỉ lấy từ registry thành phố.
- Chat không còn bị dừng vì chưa có thành phố, điểm đến ngoài planner, ngày quá giới hạn, khoảng ngân sách hoặc catalog thiếu. Model vẫn tư vấn/hỏi rõ, biết `plannerIssues`; chỉ nút/API thao tác giữ giới hạn riêng.

Thứ tự nguồn khi model gọi `search_tourism_knowledge` và cấu hình Supabase hợp lệ:

1. Tìm danh mục VietGo trong bảng `tourism_catalog` qua hàm `search_tourism_catalog`.
2. Nếu không có kết quả đủ liên quan, tìm dữ liệu Kaggle trong bảng `knowledge_documents` qua hàm `search_knowledge_documents`.
3. Nếu không có thông tin phù hợp hoặc truy vấn lỗi, thử tìm web bằng Tavily khi đã có `TAVILY_API_KEY`.
4. Nếu không dùng được nguồn web, chuyển sang kiến thức tổng quát của model, với hướng dẫn không tự bịa thông tin thực tế.

Nếu thiếu cấu hình Supabase hoặc không có từ khóa tìm kiếm, dùng dữ liệu dự phòng cục bộ của dự án.

Các thay đổi liên quan:

- Bổ sung dữ liệu Kaggle Vietnam Tourism V2 và công cụ truy xuất cục bộ.
- Bổ sung script import Kaggle và danh mục VietGo lên Supabase.
- Bổ sung migration cho bảng dữ liệu và các hàm tìm kiếm phục vụ AI.
- Hiện nguồn tham khảo bên dưới câu trả lời; các bản ghi danh mục không có URL được hiển thị dưới dạng tên nguồn.
- DeepSeek chọn tối đa ba ID từ catalog đã tra bằng công cụ, soạn câu trả lời theo dữ liệu được cung cấp. Supabase cung cấp tri thức; ID Supabase khác catalog không được tự gán làm ghim bản đồ.
- Chat chỉ hiển thị `answer` tự nhiên, không nối danh sách kỹ thuật. Thông tin khách tổng hợp ưu tiên cập nhật mới nhất; thông tin AI tự giả định không tính là khách xác nhận. Model có thể gợi ý điểm đến trước khi khách chọn nhưng không tự coi đó là đủ dữ kiện planner. Trần mỗi phản hồi tool chat là 1.300 token; nếu tra cứu thì tổng chi phí gồm cả lượt gọi công cụ và lượt trả lời cuối.
- ID địa điểm được giữ trong `actionContextText` ẩn, lưu cùng kết quả chat và chỉ ghép vào ngữ cảnh khi bấm nút thao tác; không cần hiển thị mã trong câu trả lời để mở bản đồ/lịch trình. DeepSeek lỗi, thiếu key hoặc trả JSON không hợp lệ sẽ hiển thị thông báo lỗi ngắn và ẩn nút, không tự thay câu trả lời bằng ba địa điểm đầu danh sách.
- Nếu DeepSeek trả câu trả lời hợp lệ nhưng chọn ID ngoài danh sách địa điểm thành phố (ví dụ ID từ nguồn Supabase khác), chỉ bỏ ID đó khỏi đích thao tác; vẫn giữ câu trả lời, không báo nhầm mất kết nối. Thiếu key, lỗi HTTP và phản hồi không hợp lệ có thông báo riêng.
- Giới hạn thời gian mỗi truy vấn tìm kiếm Supabase ở 4,5 giây.

Thông báo `Supabase AI retrieval unavailable; using configured fallback.` nghĩa là một truy vấn Supabase đã lỗi hoặc quá thời gian chờ. Đây không phải bằng chứng rằng API key luôn sai; code hiện chỉ ghi cảnh báo chung, chưa ghi nguyên nhân cụ thể.

Các file chính: `ai/deepseekClient.ts`, `ai/travelTools.ts`, `ai/supabaseKnowledge.ts`, `ai/ragContext.ts`, `database/tourismKnowledge.ts`, `database/datasets/vietnam-tourism-v2/`, `scripts/import-kaggle-to-supabase.ts`, `scripts/import-tourism-catalog-to-supabase.ts`, `supabase/migrations/`, `backend/verifiedChat.ts`.

## 3. Lưu lịch sử chat và điều chỉnh giao diện

- Khung chat AI tự cuộn theo chiều cao nội dung đang hiện từng chữ bằng `ResizeObserver`, không chỉ khi thêm tin nhắn. Chỉ cuộn panel chat, không kéo toàn trang. Tự bám cuối khi mở cuộc chat/gửi tin mới; tạm dừng khi khách cuộn lên bằng chuột, cảm ứng, scrollbar hoặc phím để đọc tin cũ và tiếp tục khi về gần cuối. Không dùng cuộn mượt liên tục gây trễ; observer được dọn khi rời trang. Không thêm lần gọi API.

### Phong cách câu trả lời chat

- `ai/chatScope.ts` định nghĩa mẫu giới thiệu VietGo khi DeepSeek phân loại câu hỏi thành `intent=out_of_scope`. Backend dùng mẫu tiếng Việt cố định, xoá các đề xuất nút/ID/nguồn của phản hồi đó. Mẫu nêu gợi ý điểm đến/mùa, lịch trình theo ngân sách, món/quán, bản đồ, phân tích ảnh/hóa đơn có xác nhận và văn hóa/an toàn; không nhận là GuideGeek hoặc hứa đặt vé/khách sạn/tour, email hay hơn 50 ngôn ngữ. Model được yêu cầu không tra công cụ cho câu ngoài phạm vi. Phân loại vẫn phụ thuộc model; lỗi API/JSON không bị giấu bằng mẫu giới thiệu.
- Xã giao/cảm ơn/từ chối dùng `other` và trả lời tự nhiên. Các cập nhật ngắn trong ngữ cảnh chuyến đi, câu hỏi mùa/thời tiết địa điểm, giờ bay/giờ mở cửa và múi giờ du lịch không bị coi là ngoài phạm vi. Câu hỏi giờ hiện tại đơn thuần, giải toán hoặc viết code được hướng về chủ đề du lịch. Mẫu giới thiệu ngoài phạm vi hiện cố định tiếng Việt; không có bản dịch riêng theo tham số language.

- File `ai/AI_RESPONSE_STYLE.md` hướng dẫn tư vấn ngắn, gần gũi, khoảng 3 gợi ý với thông tin dễ chọn; ưu tiên cập nhật mới nhất và hỏi tối đa một thông tin còn thiếu mỗi lượt.
- `ai/systemPrompt.ts` đọc file một lần khi server khởi động và đưa vào prompt chat DeepSeek. Sửa file cần khởi động lại server; chạy server từ gốc dự án và giữ file Markdown này khi triển khai bản build.
- Trình bày bằng văn bản thuần, đánh số/dấu • và dòng trống phù hợp giao diện hiện tại; không yêu cầu Markdown in đậm vốn chưa được render.
- Lấy cảm hứng từ cách GuideGeek giới thiệu tư vấn gần gũi/cá nhân hóa, không sao chép prompt nội bộ, không cam kết trả lời giống hệt hoặc tự thêm đặt chỗ/dữ liệu thời gian thực.
- Quy tắc Supabase/nguồn/an toàn/ngôn ngữ giữ ưu tiên. Không thay prompt JSON của lịch trình, trích xuất hoặc phân tích ảnh. Giới hạn từ là hướng dẫn cho model, không phải bộ cắt câu trả lời cưỡng chế.
- File phong cách làm tăng prompt đầu vào; câu trả lời ngắn có thể giảm token đầu ra, chưa đo tổng token thực tế.

- Lưu nhiều cuộc trò chuyện bằng `localStorage`, khóa `vietgo_chat_history_v1`.
- Có danh sách lịch sử ở bên trái, tạo chat mới, mở lại chat và xóa từng cuộc trò chuyện sau xác nhận.
- Không mất nội dung chat khi chuyển sang tab khác rồi quay lại.
- Có xử lý dữ liệu lưu không hợp lệ và lỗi lưu trữ.
- Điều chỉnh khu vực Trợ lý AI theo chiều cao trình duyệt, có vùng cuộn bên trong.
- Hiển thị trạng thái nhà cung cấp/model khi lấy được thông tin từ `/api/health`.

Lưu ý: lịch sử này lưu trong trình duyệt, không đồng bộ lên Supabase hay giữa các thiết bị. Xóa dữ liệu trình duyệt có thể làm mất lịch sử.

Các file chính: `frontend/src/components/AIAssistantPage.tsx`, `frontend/src/components/chatHistory.ts`, phần bố cục AI trong `frontend/src/App.tsx` và `frontend/src/components/Navbar.tsx`.

## 4. Thực hiện ba thao tác từ cuộc chat

| Nút | Hành vi hiện tại |
|---|---|
| Mở trên Bản đồ số | Chuyển sang Xung quanh/Bản đồ, chọn tỉnh và tập trung vào các địa điểm đã nhắc nếu khớp danh mục hỗ trợ. |
| Tạo lịch trình chi tiết | Tổng hợp thông tin hội thoại, tạo thẻ xem trước ngay trong chat; chưa chuyển sang Lịch trình. |
| Xem quán ăn bản địa | Chuyển sang Xung quanh, lọc nhóm ăn uống và các món/quán đã nhắc nếu có mục phù hợp. |

- Thêm endpoint `POST /api/chat-action` để trích xuất ngữ cảnh cho thao tác.
- Địa điểm và mã bản ghi được đối chiếu với danh mục tỉnh có trong dự án.
- Khi không xác định được điểm đến, hiển thị lỗi thay vì tự chọn Đà Nẵng.
- Bản đồ và quán ăn dùng hội thoại đến câu trả lời có nút được bấm.
- ID từ danh sách địa điểm đã xác minh của main được chuyển sang ngữ cảnh bản đồ mới; các ID legacy tiếp tục được tra theo danh mục cũ.
- Riêng tạo lịch trình dùng toàn bộ cuộc trò chuyện hiện tại để lấy các cập nhật mới nhất, kể cả khi bấm nút dưới một câu trả lời cũ.
- Trước khi gọi planner, kết nối AI đổi nhãn/mã tỉnh legacy sang mã thành phố hiện có: Lâm Đồng (Đà Lạt) → `da-lat`, Quảng Nam (Hội An) → `hoi-an`, Kiên Giang (Phú Quốc) → `phu-quoc`, Thừa Thiên Huế → `hue`, TP. Hồ Chí Minh → `tp-hcm`. Mã thành phố được dùng nhất quán cho request, lịch trình và các điểm đã lưu. Không đổi bảng dữ liệu hoặc file JSON địa điểm.
- `ai/plannerDestination.ts` đối chiếu tên điểm đến với registry thành phố của frontend. AI hỗ trợ thêm Sa Pa và Nha Trang vốn có file dữ liệu nhưng thiếu trong danh mục tỉnh legacy; đọc tọa độ trung tâm từ JSON thành phố, không tự tạo tọa độ. Test đối chiếu registry AI với đủ 10 thành phố của frontend để phát hiện lệch danh mục.
- Có trạng thái đang xử lý, chống bấm lặp và hiển thị lỗi thao tác.
- DeepSeek chọn nút theo ngữ cảnh khách và nội dung trả lời, trả `suggestedActions` cùng JSON `answer`/`placeIds`/`intent` trong phản hồi cuối. Ba action cho phép: `open_map`, `open_food`, `open_planner`; có thể trả nhiều nút hoặc `[]`. `intent` phân loại `trip_planning`, `places`, `food`, `other`. Model nhận `plannerReady` từ dữ kiện khách đã tổng hợp; khi đang tư vấn chuyến đi và đủ dữ kiện, prompt bắt buộc đề xuất `open_planner`. Backend kiểm tra nhất quán: `intent=trip_planning` và đủ dữ kiện thì bổ sung nút nếu model bỏ sót; ý định khác hoặc thiếu dữ kiện thì bỏ nút lịch trình. Không phân loại ý định bằng từ khóa; không gọi model riêng để chọn nút nhưng có thể thêm lượt trả lời sau khi tra cứu công cụ. Xã giao, đổi chủ đề hoặc từ chối được yêu cầu phân loại `other`; chất lượng phân loại vẫn phụ thuộc model. Không tự thực hiện thao tác.
- `ai/suggestedChatActions.ts` chỉ kiểm chứng đề xuất, không còn chọn nút bằng từ khóa: lọc action lạ/trùng, dùng nhãn cố định, ẩn nút lỗi/ảnh/thẻ xác nhận. Lịch trình chỉ được hiện khi đủ điểm đến hỗ trợ, số ngày, số khách và ngân sách rõ ràng từ khách. Bản đồ/Quán ăn phải có `verifiedActions` do backend xác minh ID trong catalog; Quán ăn cần ID thuộc nhóm food/cafe. AI tự giả định dữ kiện không làm đủ điều kiện lập lịch trình.
- Backend và frontend dùng cùng bộ kiểm chứng; frontend lưu đề xuất và thông tin xác minh cùng tin nhắn. Chat cũ chưa có đề xuất từ model không được suy ra nút bằng từ khóa và cần gửi tin mới để model đề xuất; không tự gọi API để phân tích lại lịch sử. Không xóa/sửa nội dung lịch sử cũ hoặc cách hoạt động của tab đích. Chưa thêm action mới cho yêu thích/chi tiêu; luồng hóa đơn hiện có giữ nguyên.

Các file chính: `ai/chatActions.ts`, `database/chatActionTypes.ts`, `frontend/src/components/AIAssistantPage.tsx`, phần kết nối AI trong `frontend/src/App.tsx` và `frontend/src/components/NearbyPage.tsx`.

Giới hạn: các thao tác bản đồ/lịch trình vẫn phụ thuộc danh mục tỉnh và địa điểm hỗ trợ trong dự án; dữ liệu Kaggle phong phú hơn không đồng nghĩa mọi địa điểm đều có ghim bản đồ hoặc tạo được lịch trình. Model phân loại ý định/đề xuất nút có thể sai hoặc bỏ sót; bộ kiểm chứng chỉ bảo đảm điều kiện thao tác. Chỉ hiện Bản đồ khi có ID đã tra và xác minh, không suy đoán tọa độ từ tên. Giới hạn thao tác không chặn tư vấn chung.

## 5. Tổng hợp chuyến đi và ưu tiên cập nhật gần nhất

Thẻ trích xuất không còn tự xuất hiện sau mỗi câu trả lời AI. Quy trình hiện tại:

1. Người dùng trao đổi yêu cầu trong chat.
2. Bấm **Tạo lịch trình chi tiết** để tổng hợp và hiện thẻ xác nhận.
3. Kiểm tra điểm đến, số ngày, số khách, ngân sách và phong cách.
4. Bấm **Tiếp tục ở Lịch trình** để gọi API tạo lịch trình rồi chuyển tab.

Quy tắc tổng hợp:

- Ưu tiên yêu cầu mới nhất của khách cho từng mục.
- Mục không được cập nhật giữ thông tin đã nêu trước đó.
- Quét thông tin rõ ràng trong lịch sử để giữ các chi tiết cũ, đồng thời giới hạn phần hội thoại gửi model ở 10 tin nhắn gần nhất và độ dài có giới hạn.
- Nếu người dùng nhắn thêm sau khi tạo thẻ, nút đổi thành **Cập nhật theo chat mới nhất**; phải tổng hợp lại trước khi tạo lịch trình.
- Khi xác nhận thẻ chưa thay đổi, tái sử dụng ngữ cảnh đã tổng hợp, không gọi model trích xuất lần nữa.
- Tạo lịch trình từ chat yêu cầu đủ điểm đến hỗ trợ, số ngày, số khách và ngân sách rõ ràng; không dùng mặc định để bù bốn mục này. Phong cách chưa nêu vẫn có thể dùng Phượt & Khám phá.

Ngân sách:

- Thêm hàm phân tích số tiền cục bộ, hỗ trợ các dạng như `6 triệu`, `6tr`, `1,5 triệu`, `600k`, `6.000.000đ`, `6000000 đồng`.
- Hiển thị ngân sách theo định dạng VNĐ trên thẻ.
- Lấy ngân sách chuyến đi cập nhật gần nhất, không lấy giá món/vé nối tiếp để ghi đè. Hỗ trợ đơn vị không dấu; ngân sách mỗi người nhân với tổng khách kể cả trẻ em. Khoảng ngân sách cần khách xác nhận một mức cụ thể.
- Hàm phân tích ngân sách không gọi thêm DeepSeek.

Phần chuyển tiếp lịch trình:

- Theo sự cho phép riêng của người dùng, `/api/plan-trip` dùng cùng client DeepSeek/key/model/thinking với chat thay vì Gemini. DeepSeek chọn mỗi ngày một điểm tham quan và một quán ăn từ ID catalog đã xác minh; backend kiểm tra đủ số ngày, đúng nhóm, không lặp ID rồi dựng payload lịch trình hiện có. Prompt nhận số khách, ngân sách, phong cách, nhóm đồng hành và chatContext có giới hạn. Chưa mở rộng số điểm/ngày, thời gian hay chi phí; phần không có dữ liệu vẫn giữ null/ghi chú kiểm tra, không tự bịa giá.
- Nếu thiếu key, provider lỗi, JSON sai, ID sai/khác nhóm/lặp hoặc sai số ngày, giữ phương án lựa chọn cục bộ sẵn có. `summaryAI` ghi rõ khi DeepSeek chọn thành công hoặc kết quả không dùng DeepSeek. Không sửa UI/tab Lịch trình, dữ liệu địa điểm hoặc cách lưu. Gemini đọc hóa đơn giữ nguyên.

- Truyền điểm đến, thời lượng, số khách, ngân sách, phong cách và ngữ cảnh chat vào `POST /api/plan-trip`.
- Hiển thị lịch trình trả về từ API thay vì chỉ mở lịch trình mẫu mặc định ở frontend.
- Bổ sung ID và tọa độ cho điểm dừng khi khớp danh mục.
- Ô số khách ở trang Lịch trình giữ các lựa chọn cũ và bổ sung giá trị nhận từ chat, ví dụ 3 người. Thay đổi ô này đã được người dùng cho phép riêng.

Các file chính: `ai/chatActions.ts`, `ai/chatBudget.ts`, `frontend/src/components/AIAssistantPage.tsx`, phần kết nối AI trong `frontend/src/App.tsx`, `frontend/src/components/ItineraryPage.tsx`, `backend/server.ts`.

Giới hạn: các cách diễn đạt mơ hồ, phủ định hoặc nhiều mức giá trong cùng tin nhắn cần kiểm tra lại trên thẻ. Không tự đổi ngoại tệ. `ai/tripState.ts` dùng chung cho chat, nút và thẻ; ngoài 1–7 ngày hoặc điểm đến chưa hỗ trợ thì chat vẫn tư vấn nhưng không hiện nút planner, API thao tác báo giới hạn rõ, không âm thầm đổi giá trị hay dùng lại thành phố cũ.

## 6. Hiệu ứng câu trả lời hiện dần

- Câu trả lời mới của AI xuất hiện dần, có con trỏ gõ chữ.
- Nội dung đầy đủ vẫn được lưu ngay; hiệu ứng chỉ thay đổi cách hiển thị.
- Chat đã lưu/mở lại hiển thị đầy đủ ngay.
- Người dùng bật `prefers-reduced-motion: reduce` thấy câu trả lời ngay, không chạy hiệu ứng.
- Có dọn bộ đếm thời gian khi component thay đổi hoặc bị tháo khỏi giao diện.

Đây là **hiệu ứng frontend sau khi đã nhận phản hồi đầy đủ**, không phải streaming token trực tiếp từ DeepSeek. Hiệu ứng không phát sinh thêm token.

Các file chính: `frontend/src/components/AIReplyText.tsx`, `frontend/src/components/AIAssistantPage.tsx`.

## 7. Chụp ảnh và tải ảnh lên trong Trợ lý AI

- Thêm nút **Chụp ảnh** và **Tải ảnh lên** ngay tại thanh nhập chat.
- Camera chỉ xin quyền khi người dùng bấm nút; không dùng microphone. Có chụp, xem trước và hủy.
- Dừng camera khi đóng, chụp xong, chuyển tab chức năng làm video bị ẩn, chuyển ứng dụng/tab trình duyệt hoặc tháo component.
- Camera yêu cầu HTTPS hoặc localhost và quyền truy cập thiết bị. Nếu không có camera hoặc bị từ chối quyền, vẫn có thể tải ảnh lên.
- Nhận file JPG, PNG, WEBP tối đa 10MB; thu nhỏ cạnh dài tối đa 1.600 pixel và chuyển sang JPEG trước khi gửi. Backend giới hạn ảnh đã xử lý tối đa 3MB và kiểm tra chữ ký định dạng.
- Ảnh chỉ gửi đến DeepSeek khi bấm **Phân tích ảnh** sau bước xem trước. Giao diện nhắc che thông tin cá nhân trước khi gửi.
- Endpoint mới: `POST /api/ai/analyze-image`, không dùng hoặc sửa endpoint quét hóa đơn của Quản lý chi tiêu.
- Gửi ảnh thật bằng content block `image_url` tới DeepSeek Flash, không gửi chuỗi base64 như văn bản.
- AI phân loại thành **Hóa đơn**, **Phong cảnh**, **Đồ ăn** hoặc **Ảnh khác**, rồi mô tả và nêu lưu ý/chỗ không chắc chắn.
- Với phong cảnh, DeepSeek suy luận địa danh ứng viên từ tổ hợp kiến trúc/cảnh quan đặc trưng, không cần đọc được biển hiệu; ứng viên và tỉnh đi kèm mức chắc chắn ước lượng, không phải xác minh. Nếu model mô tả đôi bàn tay đá khổng lồ nâng cầu nhưng bỏ trống tên, backend nhận diện dấu hiệu đặc trưng này và gợi ý Cầu Vàng ở Bà Nà Hills, Đà Nẵng với độ chắc chắn vừa. Cảnh phổ biến không có dấu hiệu riêng biệt vẫn không bị gán địa danh; catalog chỉ dùng để gợi ý điểm tương tự, không xác nhận nơi chụp.
- Với đồ ăn, DeepSeek nêu tên món và mức chắc chắn; backend tìm quán có món khớp trong `tourism_catalog`, rồi dùng danh mục cục bộ làm dự phòng. Thẻ quán/địa điểm hiện ngay trong chat AI và dùng dữ liệu đã lưu.
- Hóa đơn: đọc thông tin nhìn rõ và trích xuất cửa hàng, tổng tiền, tiền tệ, ngày, danh mục, phương thức thanh toán ngay trong lượt phân tích ảnh. Kết quả hiện thẻ **Thông tin hóa đơn** và nút **Thêm vào chi tiêu** trong chat; bấm nút chuyển sang Quản lý chi tiêu với form đã điền sẵn, cho chọn chuyến đi và chỉnh thông tin trước khi **Lưu khoản chi vào sổ**. Không tự ghi chi tiêu sau khi quét. Đồ ăn: không kết luận an toàn hay chất gây dị ứng chỉ từ ảnh.
- Tổng tiền phải là số nguyên VNĐ dương, tối đa 1 tỷ; thiếu tiền tệ/tổng tiền, số không hợp lệ hoặc hóa đơn ngoại tệ sẽ để trống số tiền cho người dùng nhập lại, không tự đổi ngoại tệ. Ngày đọc được được kiểm tra lịch hợp lệ; ngày trống mặc định ngày hiện tại trong form và có thể sửa. Ảnh thu nhỏ đi kèm khoản chi; không gửi ảnh lại cho AI.
- Khoản chi được lưu qua luồng có sẵn của Quản lý chi tiêu vào localStorage theo tài khoản và chuyến đi đã chọn; không ghi Supabase. Cùng một kết quả hóa đơn trong chat không thể lưu hai lần trong sổ của cùng tài khoản (kể cả chọn chuyến khác). Lịch sử chat giữ dữ liệu đã trích xuất nên có thể mở lại form sau khi chuyển tab. Hóa đơn được tải lên trong một tin nhắn mới vẫn được coi là kết quả mới.
- Không gửi lịch sử chat dài cho tác vụ ảnh; chỉ gửi ảnh và câu hỏi thêm tối đa 600 ký tự. Tối đa 1.350 token đầu ra cho một lượt phân tích; tra cứu thẻ sau đó không gọi model lần nữa và chỉ gửi các từ khóa trích xuất tới Supabase.
- Kết quả phân tích và ảnh thu nhỏ được lưu trong lịch sử chat cục bộ. Không lưu ảnh gốc vào Supabase hoặc filesystem của server; ảnh được xử lý và gửi tới nhà cung cấp trong request.
- Khi thiếu key hoặc API lỗi, hiển thị lỗi thật, không giả lập kết quả nhận diện.

Các file chính: `ai/imageAnalysis.ts`, `ai/deepseekClient.ts`, `database/aiReceiptTypes.ts`, endpoint ảnh trong `backend/server.ts`, `frontend/src/components/AIImageInput.tsx`, `frontend/src/components/AIAssistantPage.tsx`, kết nối trong `frontend/src/App.tsx` và `frontend/src/components/BudgetTracker.tsx`, `scripts/imageAnalysis.test.ts`.

Lưu ý: nhận diện ảnh dùng token hình ảnh và văn bản; không thể miễn phí token. Ảnh mờ hoặc bị thu nhỏ có thể làm mất chữ nhỏ trên hóa đơn. Câu hỏi chat tiếp theo chỉ có văn bản phân tích và ảnh thu nhỏ trong giao diện; backend không tự gửi lại ảnh gốc cho model. Chưa có tìm kiếm vector ảnh hoặc dùng GPS EXIF; ảnh hang động/cảnh chung vẫn chỉ cho phép phỏng đoán hoặc gợi ý điểm tương tự, không xác minh chính xác nơi chụp.

## 8. Cấu hình cần dùng

Điền key thật trong `.env` ở gốc dự án, không đưa key vào Git hoặc tài liệu:

```env
DEEPSEEK_API_KEY=<key chỉ dùng ở backend>
DEEPSEEK_MODEL=deepseek-flash
DEEPSEEK_THINKING=disabled
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=<key chỉ dùng ở backend>
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key nếu cần>
TAVILY_API_KEY=<tùy chọn>
```

Backend truy xuất dữ liệu AI dùng `SUPABASE_SECRET_KEY`, hoặc `SUPABASE_SERVICE_ROLE_KEY` nếu không có secret key. Publishable key không phải key truy xuất AI của backend hiện tại.

Đọc hóa đơn sẵn có của nhóm dùng `GEMINI_API_KEY` riêng; tạo lịch trình, chat và phân tích ảnh của Trợ lý AI dùng `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `DEEPSEEK_THINKING`. Đăng nhập Google dùng `GOOGLE_CLIENT_ID`.

Sau khi thay biến môi trường, cần khởi động lại server:

```powershell
npm.cmd run dev
```

Dùng `Ctrl+C` trong terminal đang chạy để dừng server. Dùng `npm.cmd` trên Windows nếu PowerShell chặn `npm.ps1`.

## 9. Các biện pháp tiết kiệm token đã có

- Dùng Flash và mặc định tắt suy luận.
- Model tự quyết định cần tra cứu hay trả lời ngay; không tra Supabase trước mọi tin nhắn. Query database không tiêu token DeepSeek, nhưng gửi kết quả vào lượt trả lời tiếp theo có tính token. Chat trực tiếp dùng 1 lần gọi; có công cụ tối đa 2 lần, không lặp vô hạn.
- Chỉ đưa các kết quả liên quan vào prompt, không gửi toàn bộ database.
- Giới hạn ngữ cảnh chat thường ở 8 tin nhắn, tối đa 1.200 ký tự mỗi tin.
- Giới hạn số lượng và độ dài các đoạn kiến thức Supabase/web gửi model.
- Phân tích ngân sách bằng code cục bộ.
- Tái sử dụng ngữ cảnh của thẻ xác nhận khi chưa có tin nhắn mới.
- Hiệu ứng gõ chữ không gọi thêm API.

Giới hạn đầu ra mặc định trong client: 2.048 token cho phản hồi thường và 8.192 token cho tác vụ có JSON schema; phân tích ảnh dùng giới hạn riêng 1.350 token. Đây là trần đầu ra, không phải số token bắt buộc phải tiêu mỗi lần.

Chat agent dùng giới hạn riêng 1.300 token/lượt, tối đa 2 lượt; giữ nguyên giới hạn các tác vụ AI khác. Kết quả kiến thức đưa model tối đa 5.000 ký tự, nguồn tối đa 6; catalog tối đa 12 địa điểm/tool, ID được chọn tối đa 3. Lịch sử cũ không gửi nguyên văn toàn bộ mà dùng trạng thái tổng hợp; chưa có bộ nhớ ngữ nghĩa dài hạn cho mọi sở thích ngoài các trường chuyến đi.

Chưa triển khai: cache câu trả lời ở ứng dụng, trả lời trực tiếp toàn bộ câu hỏi tra cứu đơn giản không qua model, thống kê token/chi phí trên giao diện.

## 10. Kiểm tra đã thực hiện

### Kết nối dịch vụ

- Gọi hai hàm tìm kiếm Supabase và đọc bảng `knowledge_documents`: nhận HTTP 200 và dữ liệu trong các lượt kiểm tra thành công.
- Có một lượt tìm Kaggle quá thời gian 4,5 giây; thử lại thành công.
- Thử luồng dữ liệu Supabase → DeepSeek bằng một bản ghi món ăn: trả lời đúng, dùng 100 token ở lượt thử với model `deepseek-chat` trước khi đổi sang Flash.
- Thử client sau khi đổi sang Flash, yêu cầu trả lời `OK`: HTTP 200, không có nội dung suy luận, dùng 9 token. Đây là lượt thử tối giản, không đại diện chi phí cuộc chat du lịch thông thường.

### Code và giao diện

- Lint và build đã chạy thành công trong quá trình phát triển và sau khi ghép main mới; build có cảnh báo kích thước bundle lớn.
- Kiểm tra Browser: bản đồ/quán ăn từ chat, chuyển đúng điểm đến–số ngày–số khách, hiện ngân sách, xem trước rồi xác nhận lịch trình, cập nhật theo tin nhắn mới nhất.
- Các lượt kiểm tra Browser dùng server riêng và vô hiệu hóa key trong tiến trình để không gọi API trả phí; không sửa `.env` thật.
- Browser kiểm tra bật giảm chuyển động, nên chưa xác minh trực quan hiệu ứng gõ chữ khi tắt tùy chọn này.
- Sau khi cập nhật main: 13 bài test phần AI/dữ liệu, 91 unit test tài khoản và 42 unit test chi tiêu đều đạt. Chưa chạy lại toàn bộ kiểm thử giao diện của các tính năng mới.
- Sau khi thêm phân tích ảnh: lint, build và 16 bài test AI/dữ liệu đều đạt; test ảnh dùng phản hồi mô phỏng, kiểm tra bốn nhóm ảnh, định dạng/kích thước không hợp lệ và lỗi nhà cung cấp.
- Browser đã kiểm tra nút tải ảnh, xem trước, hủy/chọn lại và thông báo thiếu key (HTTP 503) trên server nội bộ không có key. Chưa kiểm thử camera trên thiết bị thật hoặc độ chính xác nhận diện bằng API DeepSeek thật; lượt thử gửi ảnh ra DeepSeek chưa thực hiện vì cần sự cho phép của người dùng.
- Sau khi nối file phong cách trả lời: lint, build và 18 bài test AI/dữ liệu đều đạt. Test kiểm tra Markdown thực sự nằm trong prompt, giữ quy tắc nguồn/ngôn ngữ và không tác động prompt JSON lịch trình. Chưa gọi DeepSeek thật để đánh giá độ ngắn gọn hay đo token trong lượt thay đổi này; build vẫn có cảnh báo bundle lớn.
- Sau khi thêm điều kiện hiện nút: lint, build và 22 bài test AI/dữ liệu đều đạt. Kiểm tra gợi ý địa điểm, quán ăn, lịch trình đủ/thiếu thông tin, cập nhật nhiều lượt, hủy lịch trình, chuyển chủ đề, ảnh/lỗi/thẻ xác nhận và không nhầm giá món ăn thành ngân sách. Chưa kiểm thử trực tiếp giao diện hoặc gọi DeepSeek thật trong lượt này; phân loại bằng từ khóa có giới hạn như nêu ở mục 4.
- Sau khi cập nhật `main` đến `90052ae` và nối AI: lint/build đạt; test AI dùng phản hồi mô phỏng, và unit test sẵn có của main cho tài khoản/chi tiêu lần lượt đạt 91/42. Chưa gọi DeepSeek/Supabase thật; chức năng quét hóa đơn và planner verified vẫn dùng Gemini theo main. Snapshot stash WIP được giữ làm bản dự phòng khôi phục.
- Ngày 29/09/2026: mở rộng phân tích ảnh để nhận diện tên món, trích dấu hiệu phong cảnh và mức chắc chắn; tìm thẻ quán/POI phù hợp trước trong Supabase rồi mới dùng danh mục cục bộ. Lint và build đạt; 30 test AI/dữ liệu trước đó đạt bằng phản hồi mô phỏng cho AI/Supabase. Chưa gọi DeepSeek thật, truy vấn Supabase thật hoặc kiểm tra trực quan trên trình duyệt sau thay đổi này. Build vẫn có cảnh báo bundle thành phố lớn hơn 500 kB.
- Ngày 29/09/2026: sửa nhận diện địa danh ảnh bằng cách yêu cầu model suy luận từ dấu hiệu kiến trúc đặc trưng và thêm dự phòng cục bộ cho đôi bàn tay đá khổng lồ nâng cầu → Cầu Vàng, Bà Nà Hills, Đà Nẵng (độ chắc chắn vừa). Năm test ảnh đạt, gồm ảnh cầu có mô tả dấu hiệu nhưng model trả landmark rỗng và kiểm tra cảnh chung vẫn không gán tên; TypeScript `tsc --noEmit` đạt. Build bị môi trường chặn khi esbuild mở tiến trình con (`spawn EPERM`); test `imageRecommendations` không chạy được với Node tích hợp do import không có đuôi file và tsx cũng bị chặn tạo tiến trình esbuild. Chưa gọi DeepSeek/Supabase thật hoặc kiểm tra giao diện trình duyệt trong lượt này.
- Ngày 29/09/2026: nối hóa đơn từ chat AI vào form Quản lý chi tiêu có bước người dùng xác nhận lưu; dùng lại kết quả DeepSeek, không gọi model lần nữa. TypeScript và build đạt (chạy build với quyền cho phép tiến trình con đã khắc phục giới hạn EPERM trong kiểm tra); build còn cảnh báo bundle lớn. Sáu test ảnh và 42 kiểm tra unit chi tiêu sẵn có đạt, gồm tổng tiền VNĐ/ngoại tệ và ngày không hợp lệ. Browser trên origin cục bộ riêng, dữ liệu giả: kiểm tra thẻ hóa đơn, form tự điền đúng tên quán–250.000 VNĐ–ngày hóa đơn, xác nhận lưu thành khoản chi và chặn lưu trùng từ cùng tin nhắn. Chưa gọi DeepSeek thật để đo độ chính xác OCR hoặc thử hóa đơn thật; không dùng hay sửa dữ liệu Supabase. Kết quả quét cũ trong chat chưa có dữ liệu cấu trúc sẽ cần quét lại để hiện nút chuyển chi tiêu.

- Ngày 29/09/2026: điều kiện nút tạo lịch trình yêu cầu đủ điểm đến, ngày, số người và ngân sách từ toàn bộ tin nhắn khách đến câu trả lời đang hiển thị, nhận ý định du lịch tự nhiên và thông tin bổ sung qua nhiều lượt. Khi bấm nút, tổng hợp toàn bộ chat hiện tại; các giá trị khách nêu rõ mới nhất được ưu tiên hơn kết quả trích xuất model cho điểm đến, số ngày, số người, ngân sách và phong cách. Phản hồi danh sách địa điểm dự phòng vẫn hỗ trợ nút khi đủ dữ kiện. TypeScript và 11 test điều kiện nút/trích xuất đạt, gồm trường hợp bổ sung số người qua tin nhắn sau và model trích sai nhưng vẫn giữ các cập nhật mới nhất của khách. Chưa kiểm tra trình duyệt, chạy build hoặc gọi API thật trong lượt sửa này.

- Ngày 29/09/2026: sửa chat khi đổi thành phố hoặc yêu cầu chuyến đi: không nối danh sách kỹ thuật vào câu trả lời và không giấu lỗi DeepSeek bằng danh sách dự phòng. Metadata địa điểm ẩn vẫn phục vụ nút thao tác. TypeScript, build và 14 test chat/nút/trích xuất đạt bằng phản hồi mô phỏng, gồm đổi Đà Nẵng → Đà Lạt, giữ thông tin khách và lỗi/thiếu key; build còn cảnh báo bundle lớn. Chưa gọi DeepSeek thật hoặc kiểm tra trình duyệt trong lượt này.

- Ngày 29/09/2026: tái hiện API chat đang chạy báo “chưa kết nối” khi hỏi Đà Nẵng rồi Đà Lạt, trong khi health xác nhận có key. Sửa nhánh loại toàn bộ phản hồi khi model chọn ID ngoài danh sách thành phố: giữ câu trả lời và chỉ lọc ID thao tác không hợp lệ; phản hồi rỗng không còn báo nhầm thiếu key. TypeScript và 4 test verified chat đạt bằng dữ liệu mô phỏng, gồm ID ngoài catalog. Lượt kiểm tra riêng gửi ngữ cảnh Supabase sang DeepSeek bị auto-review chặn; không thực hiện lại bằng cách khác, chưa kiểm thử live sau sửa hoặc build trong lượt này.

- Ngày 29/09/2026: sửa lỗi “Khu vực chưa được hỗ trợ” khi thẻ AI gửi mã tỉnh legacy vào planner nhận mã thành phố. Đối chiếu 10 file thành phố và các nhãn tỉnh AI tương ứng; TypeScript và 14 test ánh xạ/trích xuất/điều kiện nút đạt. Tạo lịch trình Đà Lạt 3 ngày, 2 người, 10 triệu thành công trực tiếp bằng dữ liệu cục bộ và không gọi model. Không sửa dữ liệu địa điểm, Supabase hay danh mục tỉnh; chưa kiểm tra trình duyệt hoặc gọi dịch vụ ngoài trong lượt này.

- Build sau thay đổi ánh xạ thành phố đạt; vẫn có cảnh báo bundle lớn hơn 500 kB.

- Ngày 29/09/2026: kiểm tra mở rộng theo yêu cầu người dùng, 48/48 test hiện có đạt. Thử thêm 15 hội thoại bằng parser cục bộ: 8 đạt mục tiêu, 7 có hạn chế/lỗi (tiền không dấu, giá món ghi đè ngân sách, đổi sang vùng chưa hỗ trợ giữ điểm đến cũ, ngân sách mỗi người/khoảng tiền, trẻ em, giới hạn số ngày). Ghi cách tái hiện và ưu tiên cải tiến trong `docs/AI_AGENT_QA.md`. Không sửa hành vi sản phẩm/dữ liệu hoặc gọi dịch vụ ngoài trong lượt đánh giá này; chưa đánh giá model thật/giao diện/ảnh thật.

- Ngày 29/09/2026: sửa 7 lỗi khảo sát bằng `ai/tripState.ts` dùng chung cho chat, điều kiện nút và trích xuất. Hỗ trợ tiền không dấu, ngân sách mỗi người nhân tổng khách, người lớn/trẻ em/em bé; không lấy giá món/vé ghi đè ngân sách. Khoảng tiền cần xác nhận mức cụ thể; điểm đến chưa hỗ trợ và ngày ngoài 1–7 được báo rõ, không tự dùng thành phố cũ hoặc giảm số ngày. API thao tác trả lỗi 422 khi dữ kiện không hợp lệ/thiếu; ngữ cảnh DeepSeek có thông tin chuyến đi chuẩn hóa. 55/55 test cục bộ/mô phỏng, TypeScript và build đạt; build còn cảnh báo bundle lớn. Cập nhật `docs/AI_AGENT_QA.md`; không gọi DeepSeek/Supabase thật, không sửa dữ liệu hoặc kiểm tra trình duyệt trong lượt này.

- Ngày 29/09/2026: bổ sung tín hiệu từ nội dung trả lời AI cho nút Lịch trình khi lịch sử khách đã đủ thông tin, không gọi thêm model. Test tình huống “thấy chán chán”, thiếu số khách dù AI giả định, từ chối/hành lý, câu xã giao và lỗi đều đạt. Toàn bộ 56/56 test cục bộ/mô phỏng và TypeScript đạt; chưa chạy lại build, kiểm tra trình duyệt hoặc gọi API thật trong lượt này. Chỉ sửa logic nút AI, test và tài liệu.

- Ngày 29/09/2026: kiểm tra trực tiếp component Trợ lý AI trên trình duyệt, origin cục bộ riêng với hội thoại mẫu và API thao tác mô phỏng dùng parser thật. Tin cuối “thấy chán chán” cùng phản hồi gợi ý tham quan Hà Nội hiện nút khi khách đã đủ dữ kiện; bấm nút hiện thẻ đúng Hà Nội, 3 ngày, 2 khách, 2.000.000 VNĐ. Thiếu số khách dù AI giả định 2 người, từ chối tạo lịch trình và trả lời xã giao đều không hiện nút. Không gọi DeepSeek/Supabase, không kiểm tra API tạo lịch trình/tab đích; không đụng lịch sử chat người dùng. Đã xoá hai file fixture tạm, đóng tab và dừng server kiểm thử; không sửa hành vi sản phẩm trong lượt này.

- Ngày 29/09/2026: chuyển lựa chọn ba nút chat sang DeepSeek, thêm `suggestedActions` vào JSON/prompt và xác minh mục tiêu thao tác bằng ID catalog. Không thêm lần gọi model; trần phản hồi chat tăng từ 1.000 lên 1.100 token cho metadata nút (không phải mức tiêu thụ cố định). Thay test chính sách từ khóa bằng test đề xuất model, cập nhật test giới hạn chuyến đi để có đề xuất giả lập; kiểm tra một lần gọi model trả đề xuất, chặn ID/nút lạ, thiếu dữ kiện và chat cũ. 56/56 test cục bộ/mô phỏng, TypeScript và build đạt; build còn cảnh báo bundle lớn. Chưa gọi DeepSeek/Supabase thật hoặc kiểm tra trình duyệt sau thay đổi này; không sửa dữ liệu/tính năng khác.

- Ngày 29/09/2026: khắc phục model bỏ sót nút khi khách bổ sung từng thông tin. Thêm `intent`, `plannerReady` và kiểm tra nhất quán giữa ý định model/dữ kiện/nút; 58/58 test cục bộ/mô phỏng, TypeScript và build đạt (còn cảnh báo bundle lớn). Thử DeepSeek thật qua 4 lượt Hà Nội → 3 ngày → 2 người → 2 triệu, giữ các câu trả lời thật trong lịch sử: ba lượt đầu chưa đủ thông tin không hiện nút, lượt cuối model trả `intent=trip_planning`, đề xuất `open_planner` và bộ kiểm chứng cho phép hiện nút. Chỉ gọi model với hội thoại mẫu/catalog công khai cục bộ, không truy vấn/gửi dữ liệu Supabase; có sử dụng token API. Chưa kiểm tra lại trình duyệt hoặc endpoint chat với Supabase sau sửa. Không sửa tính năng khác/dữ liệu.

- Ngày 29/09/2026: chuyển chat thành agent dùng Tool Calls DeepSeek; bỏ các nhánh chặn tư vấn bởi giới hạn planner và bỏ tra Supabase bắt buộc trước chat. Bổ sung 3 công cụ chỉ đọc, ngày hiện tại và trạng thái tổng hợp. 63/63 test cục bộ/mô phỏng, TypeScript và build đạt (còn cảnh báo bundle lớn), gồm mùa chưa có thành phố, vùng ngoài planner, 10 ngày/khoảng tiền vẫn tư vấn, ID catalog, tool lạ/tham số lỗi và giới hạn lượt gọi. DeepSeek thật: câu “mùa này đi đâu” gọi công cụ mùa rồi trả lời; bổ sung ngân sách sau điểm đến/ngày/khách trả nút lịch trình. Phép thử thật chỉ bật công cụ cục bộ, không gọi/gửi dữ liệu Supabase; có dùng token. Supabase tool đã kiểm tra bằng dependency mô phỏng, chưa kiểm chứng end-to-end Supabase thật. Chưa kiểm tra trình duyệt sau sửa; không sửa dữ liệu/tính năng khác.

- Ngày 29/09/2026: bổ sung `intent=out_of_scope` và mẫu giới thiệu VietGo theo chức năng thực tế trong `ai/chatScope.ts`. Backend bảo đảm không hiện nút/nguồn/ID cho phản hồi ngoài phạm vi; giữ xã giao và câu hỏi trong ngữ cảnh du lịch. 65/65 test cục bộ/mô phỏng và TypeScript đạt; chưa chạy lại build, gọi DeepSeek/Supabase thật hoặc kiểm tra trình duyệt trong lượt này. Local/Cloudflare vẫn tắt theo yêu cầu trước đó; không sửa tính năng khác hoặc dữ liệu.

- Ngày 29/09/2026: sửa tự cuộn trong lúc AI hiện từng chữ, giữ vị trí khi người dùng đọc phía trên; chỉ sửa `AIAssistantPage.tsx`. Kiểm tra trình duyệt với component thật và phản hồi giả trên origin riêng: đang gõ có khoảng cách tới cuối bằng 0; cuộn lên lúc đang gõ giữ scrollTop 3.108 dù nội dung tăng đến khi hoàn tất; về cuối lại có khoảng cách 0; window.scrollY vẫn 0. Không gọi DeepSeek/Supabase hoặc đụng lịch sử người dùng. Đã xoá fixture, đóng tab và dừng server thử; server chính/Cloudflare vẫn tắt. TypeScript và build cuối đạt; build còn cảnh báo bundle lớn. Chưa kiểm tra thao tác cảm ứng/scrollbar/phím trên thiết bị thật.

- Ngày 29/09/2026: được người dùng cho phép riêng sửa backend tạo lịch trình, chuyển `/api/plan-trip` từ Gemini sang DeepSeek, giữ giao diện/payload/lưu trữ/catalog và luồng Gemini đọc hóa đơn. Thêm JSON schema, thông tin khách vào prompt, xác minh ID/nhóm/không lặp và ghi rõ phương án dự phòng. 68/68 test cục bộ/mô phỏng và TypeScript đạt, gồm test planner mới; chưa gọi DeepSeek thật hoặc kiểm tra giao diện/API đang chạy. Frontend build bằng Vite và backend build bằng esbuild trực tiếp đều đạt (npm.cmd không có trong PATH); frontend còn cảnh báo kích thước chunk lớn. Server local/Cloudflare vẫn tắt; không sửa dữ liệu.

Chạy lại các bài test AI:

```powershell
npm.cmd run lint
node --import tsx --test scripts/tripState.test.ts
node --import tsx --test scripts/chatActions.test.ts scripts/chatBudget.test.ts scripts/deepseekClient.test.ts scripts/tourismKnowledge.test.ts scripts/imageAnalysis.test.ts scripts/imageRecommendations.test.ts
node --import tsx --test scripts/responseStyle.test.ts
node --import tsx --test scripts/suggestedChatActions.test.ts
node --import tsx --test scripts/verifiedChat.test.ts
npm.cmd run build
```

## 11. Đồng bộ nhánh làm việc

- Project dùng remote `https://github.com/leduc08/Modult-4`; nhánh làm việc local là `ai-agents`.
- `ai-agents` và `main` trên GitHub cùng ở commit `90052ae` sau khi fast-forward nhánh AI vào main; không push phần thay đổi AI chưa commit.
- Phần AI hiện tại đang là thay đổi cục bộ chưa commit. Git stash dự phòng trước khi cập nhật main vẫn được giữ.

Trước mọi chỉnh sửa tiếp theo, đọc `AGENTS.md`: chỉ sửa Trợ lý AI; muốn sửa tính năng khác hoặc mở rộng phạm vi ảnh hưởng phải xin phép người dùng. Không tự ý hoàn tác thay đổi cũ hoặc ghi đè công việc của thành viên khác.
