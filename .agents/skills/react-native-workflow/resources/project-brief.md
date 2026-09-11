# Project Brief

Điền thông tin cơ bản của project. File này là cửa ngõ — AI đọc trước khi làm bất kỳ feature nào để hiểu context.

---

## Tên app

`<APP_NAME>`

## Mục đích

`<1 câu — app giải quyết vấn đề gì cho ai>`

**Ví dụ**: "Giúp user quản lý expense hàng ngày, chia theo category và visualize xu hướng chi tiêu."

## Brief

`<3-5 câu — mô tả tổng quan project, user chính, giá trị cốt lõi, khác biệt so với competitor nếu có>`

**Ví dụ**:
> App mobile giúp user track expense cá nhân với 3 tính năng chính: quick-add transaction, category budget, monthly report.
> Điểm khác biệt: offline-first (không cần internet), auto-categorize qua ML on-device, không thu thập data user (privacy).
> Target user: người trưởng thành muốn kiểm soát chi tiêu nhưng ngại app phức tạp có nhiều tính năng thừa.

## Platform target

- [ ] Android
- [ ] iOS
- [ ] Cả 2

## Tech stack (fill sau khi setup)

- **Framework**: Expo SDK `<version>` + React Native `<version>`
- **Routing**: `<Expo Router / React Navigation>`
- **Local storage**: `<AsyncStorage / MMKV / both>`
- **Backend**: `<ASP.NET / Node / Django / none>`
- **DB**: `<MongoDB / Postgres / SQLite / none>`
- **Auth**: `<Google / Email/pw / none>`

## Links

- **Repo**: `<git url>`
- **Backend URL**: `<dev / staging / prod>`
- **Figma**: `<link>` (nếu có)
- **Analytics dashboard**: `<link>` (nếu có)
- **Sentry**: `<link>` (nếu có)

## Team

- **Owner**: `<name>`
- **Backend dev**: `<name>`
- **Designer**: `<name>` (nếu có)

## Timeline

- **Started**: `<YYYY-MM-DD>`
- **Target MVP**: `<YYYY-MM-DD>`
- **Current phase**: `<Planning / MVP dev / Beta / Production>`

---

## Diagrams (tick nếu muốn AI auto-gen)

Diagram nằm ở **`docs/diagrams/`** (global scope — dùng chung cho project, không nằm trong feature).
AI sẽ generate file `.mmd` (Mermaid) khi user tick:

- [ ] **Architecture** (`architecture.mmd`) — client ↔ backend ↔ DB, component overview
- [ ] **Sequence** (`sequence-<flow>.mmd`) — flow tương tác (VD auth: login → JWT → refresh → retry 401)
- [ ] **Data flow** (`data-flow.mmd`) — state lifecycle (local → mirror → backend → poll → merge)
- [ ] **ER** (`er.mmd`) — entity relationship, data model, foreign keys
- [ ] **Navigation flow** (`navigation.mmd`) — screen ↔ screen (list → detail → edit → back)
- [ ] **Component tree** (`component-tree-<screen>.mmd`) — parent/child hierarchy trong screen phức tạp

Khi có feature mới đủ lớn để đổi architecture → update diagram tương ứng (không tạo mới per-feature).
