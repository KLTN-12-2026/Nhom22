# Báo cáo bàn giao BE → FE — <PHASE> <Tên giai đoạn>

| Mục | Giá trị |
|---|---|
| Giai đoạn | <PHASE> — <tên> (<từ ngày> – <đến ngày>) |
| Ngày bàn giao | <dd/mm/yyyy> |
| Trạng thái BE | ✅/🟡 <các bước B đã xong> · <n> test xanh · chạy được trong Docker |
| FE làm tương ứng | <các bước F> (`roadmap/ROADMAP_FE.md` §<x>) |
| Báo cáo trước | [<PHASE trước>](<file>) — hợp đồng chung (lỗi, CSRF, phân trang) xem ở đó |

> **Đọc nhanh:** <3 dòng: chạy gì, dùng API nào trước, cái gì còn mock>

---

## 1. BE đã giao gì (đối chiếu 2 roadmap)

| BE bước | Kết quả | FE bước / UI | FE cần làm |
|---|---|---|---|
| B<x.y> <tên> | ✅ <API/chức năng> | F<x.y> UI<nn> `/duong-dan` | <việc cụ thể> |

**Chưa có** (dùng MSW): <liệt kê + lý do + khi nào có>

## 2. Chạy BE

<Lệnh; chỉ ghi phần mới so với báo cáo trước (dịch vụ mới, biến môi trường mới, dữ liệu mẫu, tài khoản demo)>

## 3. Thay đổi hợp đồng chung

<Mã lỗi mới, header mới, cookie mới, quy ước mới — hoặc "Không thay đổi">

## 4. Luồng chính

```mermaid
sequenceDiagram
  <luồng nhiều bước của giai đoạn>
```

## 5. API chi tiết (đã kiểm chứng trên BE thật)

### 5.<n> `<METHOD> /api/v1/<path>` — <mục đích>

| Quyền | FE bước | UI | Trang |
|---|---|---|---|
| G/L/O/A | F<x.y> | UI<nn> | `/duong-dan` |

**Gửi**

| Trường | Kiểu | Bắt buộc | Giới hạn (khớp BE) | Ví dụ |
|---|---|---|---|---|

**Nhận** (thật)

```http
HTTP/1.1 <status>
<header liên quan>
```
```json
<phản hồi thật>
```

**Lỗi**

| HTTP | `code` | Khi nào | FE xử lý |
|---|---|---|---|

**Tác dụng phụ:** <cookie, email Mailpit, tác vụ nền, 202 → hỏi trạng thái>

## 6. Mã FE mẫu

- Zod schema (giới hạn = BE)
- Hook TanStack Query (`queryKey`, invalidate sau khi ghi)
- MSW handler (dữ liệu thật ở mục 5)

## 7. Dữ liệu mẫu / tài khoản demo

<Seed FE có thể dùng; cách tạo tài khoản test qua Mailpit>

## 8. Checklist FE hoàn thành <PHASE>

- [ ] F<x.y> <tiêu chí kiểm được>

## 9. Sắp có ở <PHASE tiếp> — hợp đồng dự kiến

| BE bước | Dự kiến có | API | FE bước | UI |
|---|---|---|---|---|

<Hợp đồng dự kiến theo TK §13 — ghi rõ "dự kiến">

## 10. Lưu ý / giới hạn / chưa kiểm chứng

| Mục | Chi tiết |
|---|---|

## 11. Báo lỗi cho BE

Gửi đường dẫn API + body + `traceId`; BE tra: `docker compose logs api | grep <traceId>`.
