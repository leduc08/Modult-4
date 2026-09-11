---
name: react-native-workflow
description: >-
  Sử dụng skill này khi phát triển ứng dụng React Native / Expo, thiết lập cấu trúc tài liệu dự án,
  quản lý và phát triển tính năng (FEATURE), gỡ lỗi (BUG), và tuân thủ quy trình spec-driven development
  với bộ template docs (project-brief.md, technical.md, business.md, Done.md, bug.md, bugdone.md).
---

# React Native Spec-Driven Development Workflow

Skill này chuẩn hoá toàn bộ quy trình phối hợp giữa lập trình viên và AI trong các dự án React Native / Expo.
Quy trình đảm bảo code tuân thủ các best practices về hiệu năng, UI, xử lý lỗi và quản lý tiến độ minh bạch qua bộ tài liệu `docs/`.

---

## 📁 Cấu trúc thư mục tài liệu (`docs/`)

Khi bắt đầu một project mới hoặc chuẩn hoá dự án hiện tại, khởi tạo thư mục `docs/` với 6 file cốt lõi (sử dụng các file mẫu trong [resources](./resources/)):

```text
docs/
  project-brief.md           # Tổng quan app, mục đích, tech stack, danh sách diagram (setup 1 lần)
  technical.md               # Best practices React Native bắt buộc tuân thủ (AI đọc trước khi code)
  business.md                # Danh sách tính năng đang làm (FEATURE #N)
  Done.md                    # Lưu trữ các tính năng đã hoàn thành và verify (AI auto-move)
  bug.md                     # Danh sách lỗi đang xử lý (BUG #N)
  bugdone.md                 # Lưu trữ các lỗi đã sửa và verify (AI auto-move)
  diagrams/                  # Sơ đồ Mermaid (.mmd) phạm vi toàn dự án (architecture, sequence, flow...)
```

---

## ⚡ 1. Khởi tạo dự án (Project Initialization)

Khi người dùng yêu cầu bắt đầu dự án mới hoặc áp dụng quy trình:
1. Copy các template từ [resources/](./resources/) vào thư mục `docs/` của dự án.
2. Hướng dẫn người dùng điền thông tin vào `docs/project-brief.md`.
3. Kiểm tra các mục diagram được tick trong `project-brief.md` để sinh các file `.mmd` tương ứng vào `docs/diagrams/`:
   - `architecture.mmd` (Kiến trúc tổng quan)
   - `sequence-<flow>.mmd` (Flow xác thực, thanh toán, v.v.)
   - `data-flow.mmd` (Vòng đời dữ liệu)
   - `er.mmd` (Data models)
   - `navigation.mmd` (Luồng màn hình)
4. **Hỏi người dùng**: *"Bạn có muốn scan một dự án web/desktop có sẵn để chuyển tính năng sang mobile không?"*
   - Nếu có: Quét màn hình, API calls, form, sau đó trích xuất ra `docs/candidates.md`. Khi người dùng chọn, chuyển thành các `FEATURE #N` trong `business.md` (chú ý tối ưu lại cho mobile UX).

---

## 🚀 2. Quy chuẩn Kỹ thuật (Technical Guidelines)

Trước khi viết hoặc sửa bất kỳ component hay service nào, AI **PHẢI** đối chiếu các quy chuẩn tại:
👉 [Chi tiết Technical Guidelines](./references/technical-guidelines.md)

### Tóm tắt các nguyên tắc sống còn:
- **Lists**: Danh sách dài LUÔN dùng `FlatList` hoặc `@shopify/flash-list` với `keyExtractor` duy nhất (không dùng index). Bọc component con bằng `React.memo`.
- **Styles**: `StyleSheet.create()` LUÔN đặt ngoài render body (top-level scope). Không inline styles/functions vào component con đã memoize.
- **UI & Text**: Mọi text phải bọc trong `<Text>`. Dùng `expo-image` thay cho `Image`. Đảm bảo touch target ≥ 44dp (iOS) / 48dp (Android).
- **Layout & Keyboard**: Dùng `useSafeAreaInsets()` và `KeyboardAvoidingView` với cấu hình phù hợp từng hệ điều hành.
- **State**: Ưu tiên state cục bộ; Context API cần bọc `value` trong `useMemo`. Tránh lạm dụng Redux/Zustand khi dịch vụ (services) và hooks đã đủ giải quyết.
- **Errors**: Bọc try/catch cho async, log qua Sentry/logger, hiển thị thông báo thân thiện tới người dùng (không show stack trace).
- **Environment**: Tuyệt đối không hardcode API URL hay Secrets vào code; sử dụng `APP_VARIANT` với `app.config.js` và EAS Secrets / `.env.local`.

---

## ✨ 3. Quy trình Phát triển Tính năng (Feature Workflow)

Mỗi tính năng là một block có số hiệu định danh duy nhất `FEATURE #N`.

### Nguyên tắc đánh số:
- Số thứ tự là duy nhất và **KHÔNG BAO GIỜ** tái sử dụng khi archive.
- `Số tiếp theo = max(tất cả #N trong business.md và Done.md) + 1`.

### 3 Trạng thái (Phases):
1. **`[ ] Open`**: Tính năng đã được lên kế hoạch, chuẩn bị code.
2. **`[~] Implemented, awaiting verify`**:
   - AI thực hiện code xong.
   - AI **bắt buộc** điền mục `Verify steps` chi tiết các bước kiểm thử trên thiết bị thật.
   - AI thông báo người dùng test và tick `[x]`.
3. **`[x] Verified`**:
   - Người dùng test trên máy thật (UX, gesture, animation, cross-device).
   - Khi người dùng xác nhận đạt yêu cầu và tick `[x]`, AI **tự động di chuyển** toàn bộ block tính năng đó sang `docs/Done.md`, bổ sung dòng `**Ngày xong**: <YYYY-MM-DD>` và giữ nguyên mã `FEATURE #N`.

> ⚠️ **LƯU Ý NGHIÊM NGẶT**: AI **TUYỆT ĐỐI KHÔNG** tự chuyển tính năng sang `Done.md` khi đang ở trạng thái `[~]`. Chỉ người dùng mới có thẩm quyền tick `[x] Verified`.

---

## 🐛 4. Quy trình Xử lý Lỗi (Bug Workflow)

Mỗi bug được định danh bằng số hiệu `BUG #N`.

### Nguyên tắc đánh số:
- `Số tiếp theo = max(tất cả #N trong bug.md và bugdone.md) + 1`.

### 3 Trạng thái (Phases):
1. **`[ ] Open`**: Người dùng hoặc AI phát hiện lỗi, mô tả triệu chứng (`Triệu chứng / Symptom`), hành vi mong muốn (`Expected`) và độ nghiêm trọng (`Severity`).
2. **`[~] Fixed, awaiting verify`**:
   - AI debug tìm nguyên nhân gốc (`Root cause`).
   - AI sửa code và ghi rõ vị trí thay đổi (`Fix: file:line`).
   - AI cung cấp `Verify steps` rõ ràng để người dùng thử lại.
3. **`[x] Verified`**:
   - Người dùng test lại trên thiết bị thật.
   - Khi người dùng tick `[x]`, AI **tự động di chuyển** block lỗi đó sang `docs/bugdone.md`, bổ sung dòng `**Ngày verify**: <YYYY-MM-DD>` và giữ nguyên mã `BUG #N`.

---

## 🛠️ Checklist Trước Khi Hoàn Thành Mỗi Task

- [ ] Đã kiểm tra tính tuân thủ với [Technical Guidelines](./references/technical-guidelines.md).
- [ ] Không có `console.log` không bọc `if (__DEV__)`.
- [ ] Không có unhandled memory leaks (timers, subscriptions đều có cleanup).
- [ ] Đã cập nhật trạng thái `[~]` kèm đầy đủ `Verify steps` cho người dùng.
- [ ] Nếu phát hiện block nào người dùng đã đổi thành `[x]`, thực hiện chuyển sang `Done.md` hoặc `bugdone.md` tương ứng ngay lập tức.
