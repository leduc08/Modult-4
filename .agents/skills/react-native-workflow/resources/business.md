# Business — Active features

> **Cách dùng**: file này chứa **tất cả feature đang làm**. Mỗi feature 1 block với format
> `FEATURE #N`. Feature mới: copy block "Template" cuối file, paste lên đầu, tăng số.
>
> **3 phase status** (giống bug flow — user verify):
> - `[ ] Open` — feature planned, chưa code
> - `[~] Implemented, awaiting verify` — AI code xong, đợi user test trên device thật
> - `[x] Verified` — user test OK → **AI auto-move sang `Done.md`**
>
> Rule: AI **KHÔNG** auto-move khi mới ở `[~]` — phải chờ user tick `[x]` sau khi verify
> trên device (UX, animation, cross-device...).
>
> **Số thứ tự (`#N`)**: không reuse — feature nào cũng có số duy nhất, giữ nguyên khi
> move sang `Done.md`. Feature mới = max(business.md + Done.md) + 1.

---

## FEATURE #1: <tên feature>

**Status**: `[ ] Open`
**Ngày tạo**: `<YYYY-MM-DD>`

### Tôi muốn

`<mô tả feature bằng 1-3 câu, góc nhìn user>`

**Ví dụ**:
- Tôi muốn user thêm 1 transaction expense với amount + category + note.
- Tôi muốn xem list transaction trong tháng, sort theo ngày mới nhất.

### Request backend ở

`<endpoint / sync flow — nếu không có backend, ghi "Local-only">`

**Ví dụ**:
- `POST /api/transactions` — tạo mới, return record với id
- `GET /api/transactions?month=2026-07` — list theo tháng
- `PUT /api/transactions/sync/{id}` — mirror local state (qua interceptor)

### Out of scope

`<liệt kê rõ những gì KHÔNG làm>`

**Ví dụ**:
- Không có recurring transaction (làm phase sau)
- Không import từ bank statement CSV
- Không multi-currency (chỉ VND)

### Verify steps (AI fill khi implement xong, cho user test)

`<AI ghi rõ user cần test cái gì trên device thật để confirm feature hoạt động>`

**Ví dụ**:
1. Mở app, vào tab Home
2. Tap nút "+" → form transaction hiện
3. Nhập amount 50000, chọn category "Ăn uống", note "Trưa"
4. Tap Save → transaction hiện đầu list
5. Rotate device → UI không bị vỡ
6. Kill app + mở lại → transaction vẫn còn

### Notes (optional)

`<edge case, dependency, open question>`

---

## 📋 Template (copy block này khi thêm feature mới)

```markdown
## FEATURE #<N>: <tên feature>

**Status**: `[ ] Open`
**Ngày tạo**: `<YYYY-MM-DD>`

### Tôi muốn


### Request backend ở


### Out of scope


### Verify steps (AI fill khi implement xong)


### Notes (optional)

```
