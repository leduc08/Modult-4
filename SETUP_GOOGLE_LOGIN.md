# Hướng dẫn bật "Đăng nhập bằng Google" cho VietGo

> Làm **một lần duy nhất**. Sau đó mỗi lần chạy `npm run dev` đều đăng nhập Google được,
> không phải xin quyền lại. Tổng thời gian: ~10 phút, **miễn phí, không cần thẻ thanh toán**.

Nếu chưa làm, app vẫn chạy bình thường với đăng nhập bằng **tên đăng nhập + mật khẩu** —
nút Google chỉ bị mờ kèm dòng nhắc chưa cấu hình.

---

## Mục lục

0. [Chuẩn bị tài khoản Google](#bước-0--chuẩn-bị-tài-khoản-google)
1. [Tạo project trên Google Cloud](#bước-1--tạo-project-trên-google-cloud)
2. [Tạo màn hình xin quyền](#bước-2--tạo-màn-hình-xin-quyền)
3. [Tạo Client ID](#bước-3--tạo-client-id)
4. [Gắn vào dự án và chạy](#bước-4--gắn-vào-dự-án-và-chạy)
5. [Thành viên nhóm chạy dự án](#bước-5--thành-viên-nhóm-chạy-dự-án)
6. [Sửa lỗi thường gặp](#sửa-lỗi-thường-gặp)
7. [Câu hỏi thường gặp](#câu-hỏi-thường-gặp)

---

## Bước 0 — Chuẩn bị tài khoản Google

Google Cloud chỉ đăng nhập được bằng **tài khoản Google**. Nên dùng **một Gmail riêng cho dự án**
(vd: `vietgo.team@gmail.com`) vì email này sẽ hiện công khai trong popup đăng nhập.

**Chưa có Gmail?** Chọn 1 trong 2:

- **Tạo Gmail mới:** vào <https://accounts.google.com/signup> → nhập họ tên, ngày sinh
  (**phải đủ 18 tuổi** mới dùng được Google Cloud) → chọn địa chỉ Gmail → đặt mật khẩu → xác minh SĐT nếu được hỏi.
- **Dùng email sẵn có** (Outlook, Yahoo, email trường...): vào <https://accounts.google.com/signup> →
  ở bước chọn Gmail, bấm **"Sử dụng địa chỉ email hiện tại của bạn"** → nhập email → nhập mã xác nhận.

---

## Bước 1 — Tạo project trên Google Cloud

1. Mở <https://console.cloud.google.com/> và đăng nhập bằng tài khoản ở Bước 0
2. Lần đầu vào: chọn quốc gia **Vietnam**, tích đồng ý điều khoản → **Agree and continue**
3. Bấm ô chọn project ở thanh trên cùng → **New Project**
4. Project name: `VietGo` → **Create**
5. Đợi vài giây → chọn đúng project `VietGo` ở thanh trên cùng

---

## Bước 2 — Tạo màn hình xin quyền

> Đây là popup người dùng thấy khi bấm "Đăng nhập bằng Google".

1. Gõ **"Google Auth Platform"** vào ô tìm kiếm trên cùng
   *(giao diện cũ: **APIs & Services → OAuth consent screen**)*
2. Bấm **Get started** và điền:

   | Mục | Điền |
   |---|---|
   | App name | `VietGo` |
   | User support email | chọn email của bạn |
   | Audience | **External** |
   | Contact information | email của bạn |

3. Tích đồng ý chính sách → **Create**
4. Vào mục **Audience** ở menu trái:
   - Phần **Test users** → **Add users** → nhập Gmail của **bạn và từng thành viên nhóm** → **Save**
   - *Hoặc* bấm **Publish app** → **Confirm** để **mọi Gmail** đều đăng nhập được
     (app chỉ xin tên, email, ảnh nên thường không phải chờ Google duyệt)

---

## Bước 3 — Tạo Client ID

1. Menu trái → **Clients** *(giao diện cũ: **Credentials**)* → **Create client**
2. Điền:

   | Mục | Điền |
   |---|---|
   | Application type | **Web application** |
   | Name | `VietGo Web` |
   | Authorized JavaScript origins | bấm **Add URI** → `http://localhost:3000` |
   | Authorized redirect URIs | **để trống** |

3. Bấm **Create** → copy **Client ID**, có dạng:

   ```
   123456789012-abcd1234efgh5678.apps.googleusercontent.com
   ```

> 📌 **Client ID** là "mã định danh" của app VietGo với Google — **không phải mật khẩu**.
> Google có thể hiện thêm **Client secret**: app **không dùng**, không cần lưu, **không gửi cho ai**.

---

## Bước 4 — Gắn vào dự án và chạy

1. Trong thư mục `Modult-4` (cùng cấp với `package.json`), tạo file tên **đúng là** `.env`:

   ```env
   GOOGLE_CLIENT_ID=123456789012-abcd1234efgh5678.apps.googleusercontent.com

   # Không bắt buộc — để dùng Trợ lý AI (lấy tại https://aistudio.google.com)
   GEMINI_API_KEY=
   ```

   > Trên Windows, nếu Notepad tự thêm đuôi `.txt`: khi lưu chọn *Save as type* = **All files**.

2. Nếu server đang chạy: vào cửa sổ đang chạy → nhấn **Ctrl + C** để tắt
3. Chạy lại:

   ```bash
   cd E:\KADA2026\Modult-4
   npm install     # chỉ cần lần đầu
   npm run dev
   ```

4. **Kiểm tra server đã nhận Client ID:** mở <http://localhost:3000/api/auth/google/config>
   - ✅ Thấy `{"clientId":"123456789012-..."}` → thành công
   - ❌ Thấy trang web / `{"clientId":""}` → xem lại file `.env` và khởi động lại server

5. Mở **<http://localhost:3000>** *(đúng địa chỉ này, không dùng `127.0.0.1`)* →
   menu tài khoản → **Đăng nhập / Đăng ký** → **Đăng nhập bằng Google** 🎉

---

## Bước 5 — Thành viên nhóm chạy dự án

Thành viên **không cần** tạo project hay xin quyền Google lại — dùng chung Client ID của bạn.

| # | Việc | Ai làm |
|---|---|---|
| 1 | Thêm Gmail của thành viên vào **Test users** (Bước 2.4) — *bỏ qua nếu đã Publish app* | Bạn |
| 2 | Gửi Client ID cho thành viên (qua chat nhóm) | Bạn |
| 3 | `git clone` → tạo file `.env` (Bước 4.1) → `npm install` → `npm run dev` | Thành viên |
| 4 | Mở `http://localhost:3000` → đăng nhập bằng **Gmail của chính họ** | Thành viên |

> File `.env` **không được đẩy lên GitHub** (đã chặn trong `.gitignore`), nên mỗi máy phải tự tạo.

**Gửi / không gửi gì cho nhóm:**

| Thứ | Gửi được? | Lý do |
|---|---|---|
| Client ID | ✅ Được | Thông tin công khai, không vào được tài khoản của bạn |
| Gemini API key | ⚠️ Không nên | Gắn với hạn mức/chi phí của bạn — mỗi người tự tạo key miễn phí |
| Client secret | ❌ Không | App không dùng |
| Mật khẩu Gmail | ❌ Tuyệt đối không | — |
| Quyền Owner/Editor project Google Cloud | ❌ Không cần | Họ có thể sửa/xóa Client ID |

---

## Sửa lỗi thường gặp

| Hiện tượng | Nguyên nhân → Cách sửa |
|---|---|
| Nút Google **mờ** + cảnh báo vàng | Server chưa có Client ID → kiểm tra `.env`, **khởi động lại server** |
| `Error 400: origin_mismatch` | Địa chỉ đang mở chưa khai báo → thêm vào **Authorized JavaScript origins** (Bước 3) |
| `Access blocked: ... has not completed the Google verification process` | Gmail chưa có trong **Test users** → thêm vào (Bước 2.4) hoặc **Publish app** |
| "Google chưa xác minh ứng dụng này" | Bình thường khi đang thử nghiệm → bấm **Nâng cao → Tiếp tục** |
| Popup mở rồi đóng ngay, không đăng nhập | Trình duyệt chặn popup/cookie bên thứ ba → cho phép popup cho `localhost:3000` |
| "Email ... đã được dùng để đăng ký tài khoản @... nhưng chưa xác minh" | Email Google trùng tài khoản VietGo chưa xác minh (ràng buộc chống chiếm tài khoản) → đăng nhập bằng mật khẩu, rồi **Hồ sơ → Tài khoản Google → Liên kết** |
| Vừa sửa cấu hình trên Google nhưng vẫn lỗi | Google cần vài phút cập nhật → đợi ~5 phút rồi thử lại |

### Khi chạy qua link Cloudflare (`npm run share`)

Link dạng `https://xxxx.trycloudflare.com` **đổi mỗi lần chạy** → mỗi lần phải thêm link mới vào
**Authorized JavaScript origins** (không có dấu `/` ở cuối). Chạy `localhost:3000` thì không bị vấn đề này.

---

## Câu hỏi thường gặp

**Mỗi lần chạy dự án có phải xin quyền lại không?**
Không. Cấu hình trên Google và file `.env` được giữ nguyên. Chỉ khi đổi địa chỉ chạy (vd: link Cloudflare mới) mới cần thêm origin.

**Người dùng có phải cấp quyền mỗi lần đăng nhập không?**
Chỉ lần đầu Google hỏi đồng ý chia sẻ tên, email, ảnh. Những lần sau chỉ cần chọn tài khoản.

**Đăng nhập VietGo bằng Google có ảnh hưởng tới Gmail không?**
Không. App chỉ nhận **họ tên, email, ảnh đại diện** — không đọc/gửi thư, không xem Drive, danh bạ,
không biết mật khẩu. Muốn ngắt kết nối: <https://myaccount.google.com/connections> → VietGo → **Xóa quyền truy cập**.

**Thành viên nhóm có thể ảnh hưởng tới tài khoản Google của tôi không?**
Không. Mỗi người đăng nhập bằng Gmail của chính họ. Client ID không cho phép truy cập Gmail
hay Google Cloud của bạn. Chỉ cần **không** thêm họ làm Owner/Editor project và **không** chia sẻ mật khẩu.

**Đẩy code lên GitHub có kèm tài khoản / cấu hình của tôi không?**
Không. `.env` bị chặn bởi `.gitignore`; tài khoản đăng nhập trong app lưu trong trình duyệt, không nằm trong code.

**Có mất phí không?**
Không. Đăng nhập Google (chỉ lấy tên, email, ảnh) miễn phí và không cần bật billing.

---

## Ghi chú kỹ thuật (cho dev)

- Frontend lấy Client ID qua `GET /api/auth/google/config` (server đọc `GOOGLE_CLIENT_ID` từ `.env`)
- Nút Google: `frontend/src/components/GoogleSignInButton.tsx` (Google Identity Services, chế độ popup)
- ID token được xác thực ở `POST /api/auth/google` (`backend/server.ts`): kiểm tra chữ ký qua Google
  `tokeninfo`, `aud` = Client ID, `iss`, `exp`, `email_verified`
- Logic liên kết tài khoản & ràng buộc: `frontend/src/services/authService.ts` (`signInWithGoogle`, `linkGoogle`, `unlinkGoogle`)

| Ràng buộc | Xử lý |
|---|---|
| Đã liên kết Google | Nhận diện theo Google ID (`sub`), không phụ thuộc email |
| Email Google trùng tài khoản **đã xác minh** | Tự động liên kết |
| Email Google trùng tài khoản **chưa xác minh** | Từ chối (chống chiếm tài khoản đăng ký trước) |
| Chưa có tài khoản | Tạo mới với tên, Gmail, ảnh từ Google |
| Một Google cho 2 tài khoản VietGo | Không cho phép |
| Hủy liên kết khi chưa có mật khẩu | Không cho phép |
