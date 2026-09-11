# Bug — Active bugs

> **Cách dùng**: file này chứa **tất cả bug đang xử lý**. Mỗi bug 1 block với format
> `BUG #N`. Bug mới: copy block "Template" cuối file, paste lên đầu, tăng số.
>
> **3 phase status** (user verify là gate cuối):
> - `[ ] Open` — bug reported, chưa fix
> - `[~] Fixed, awaiting verify` — AI fix xong, điền Root cause + Fix (file:line) + Verify steps, đợi user test trên device thật
> - `[x] Verified` — user test OK → **AI auto-move sang `bugdone.md`**
>
> Rule: AI **KHÔNG** auto-move khi mới ở `[~]` — phải chờ user tick `[x]` sau khi verify
> trên device thật (UX, crash, edge case...).
>
> **Số thứ tự (`#N`)**: không reuse — bug nào cũng có số duy nhất, giữ nguyên khi
> move sang `bugdone.md`. Bug mới = max(bug.md + bugdone.md) + 1.

---

## BUG #1: <tên bug>

**Status**: `[ ] Open`
**Ngày tạo**: `<YYYY-MM-DD>`
**Severity**: `<Critical / High / Medium / Low>`

### Triệu chứng (Symptom)

`<mô tả hiện tượng lỗi, các bước tái hiện nếu có>`

**Ví dụ**:
- Khi vào màn hình Home và kéo scroll nhanh, app bị crash văng ra ngoài.
- Thử trên Android 13 bị, iOS không bị.

### Expected behavior

`<hành vi mong muốn>`

**Ví dụ**:
- Danh sách cuộn mượt mà, không giật lag và không văng ứng dụng.

### Root cause (AI fill khi debug)

`<nguyên nhân gốc rễ gây ra lỗi>`

### Fix (AI fill sau khi sửa, kèm file:line)

`<mô tả giải pháp và các vị trí code đã sửa>`
- `src/components/FeedList.tsx:42-45` — Chuyển từ ScrollView sang FlatList và thêm keyExtractor ổn định.

### Verify steps (AI fill sau khi sửa xong)

`<hướng dẫn cụ thể để user test trên device thật>`
1. Mở app, điều hướng tới màn hình Home.
2. Cuộn nhanh danh sách từ trên xuống dưới liên tục 5 lần.
3. Kiểm tra không còn hiện tượng crash hay giật hình.

---

## 📋 Template (copy block này khi thêm bug mới)

```markdown
## BUG #<N>: <tên bug>

**Status**: `[ ] Open`
**Ngày tạo**: `<YYYY-MM-DD>`
**Severity**: `<Critical / High / Medium / Low>`

### Triệu chứng (Symptom)


### Expected behavior


### Root cause (AI fill khi debug)


### Fix (AI fill sau khi sửa, kèm file:line)


### Verify steps (AI fill sau khi sửa xong)

```
