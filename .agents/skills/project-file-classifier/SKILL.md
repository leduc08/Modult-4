---
name: project-file-classifier
description: >-
  Sử dụng skill này khi cần phân loại và sắp xếp các file trong dự án phần mềm vào 4 nhóm chính
  (FRONTEND, BACKEND, DATABASE, SKILL). Skill giúp phân tích cấu trúc dự án, phát hiện vấn đề tổ chức,
  đề xuất cấu trúc chuẩn và hướng dẫn tái cấu trúc thư mục.
---

# Project File Classifier

Skill hỗ trợ phân tích cấu trúc dự án phần mềm và phân loại file vào đúng nhóm chức năng.
Vai trò: **Software Architect + Project Manager**.

---

## 📋 Quy trình phân loại

### Bước 1 — Thu thập

- Liệt kê toàn bộ file và thư mục trong dự án (bao gồm cả file ẩn, config).
- Đọc nội dung file khi có thể truy cập — **KHÔNG phân loại chỉ dựa vào tên file**.

### Bước 2 — Phân loại vào 4 nhóm chính

Tham khảo [tiêu chí phân loại chi tiết](./references/classification-criteria.md) để xác định nhóm cho từng file.

| Nhóm | Mục đích |
|------|----------|
| **FRONTEND** | Giao diện, UI/UX, components, styles, client-side JS/TS, routing, state management |
| **BACKEND** | Server, API, controllers, services, middleware, auth, business logic, AI/chatbot logic |
| **DATABASE** | Schema, models, migrations, seed data, queries, ERD, DB config |
| **SKILL** | Documentation, guides, prompts, instructions, rules, workflow, coding guidelines |

Nếu không xác định được → xếp vào **UNCERTAIN** và giải thích lý do.

### Bước 3 — Áp dụng Quy tắc phân loại

1. **Đọc nội dung** trước khi quyết định, không chỉ dựa vào tên file.
2. **Một file chỉ thuộc một nhóm** (ưu tiên chức năng chính).
3. **Không tự ý xóa/sửa file** — chỉ phân loại và đề xuất.
4. **Không bỏ sót file** — tất cả phải xuất hiện trong kết quả.
5. Ưu tiên phân loại theo chức năng chính:
   - `UserModel.ts` định nghĩa DB schema → **DATABASE**
   - `UserModel.ts` chứa business logic → **BACKEND**

---

## 📊 Output bắt buộc (5 phần)

### A. Tổng quan

Bảng thống kê số lượng file theo nhóm.

### B. Danh sách file theo nhóm

Cấu trúc tree cho từng nhóm, kèm giải thích file khó phân loại theo format:
```
file_name → NHÓM → Lý do
```

### C. Đề xuất cấu trúc project

Đề xuất cấu trúc thư mục chuẩn phù hợp dự án thực tế (không ép file vào mẫu cứng).

### D. Phát hiện vấn đề

Kiểm tra và báo cáo:
- File đặt sai nhóm / sai thư mục
- File trùng chức năng hoặc trùng tên
- Frontend và Backend bị trộn lẫn
- Database logic bị trộn với Backend
- Skill/documentation bị trộn với source code
- ⚠️ File có nguy cơ chứa **secret/API key/password**
- Dependencies không cần thiết
- File quan trọng còn thiếu (README, .gitignore, .env.example, v.v.)

### E. Đề xuất tổ chức lại

Chia thành 6 mục:
1. **File nên giữ nguyên**
2. **File nên di chuyển** (ghi rõ `từ → đến`)
3. **File nên đổi tên**
4. **File nên gom vào cùng folder**
5. **File cần kiểm tra thêm**
6. **File có thể xóa** (phải xác nhận trước, KHÔNG tự xóa)

---

## 🗣️ Ngôn ngữ

Giải thích bằng **tiếng Việt đơn giản, dễ hiểu**, phù hợp với sinh viên mới học lập trình.

---

## ⚠️ Lưu ý quan trọng

- Skill này chỉ **phân tích và đề xuất** — KHÔNG tự động di chuyển hoặc xóa file.
- Sau khi báo cáo, chờ người dùng xác nhận trước khi thực hiện bất kỳ thay đổi nào.
- Với dự án monorepo (frontend + backend chung repo), cần đề xuất tách thư mục rõ ràng.
- Với file config chung (`.gitignore`, `package.json`, `tsconfig.json`), phân loại theo mục đích chính hoặc đặt ở root level.
