# Phân chia công việc Frontend — 2 thành viên

> **Quy tắc:** Ai làm trang nào thì báo nhau. Không sửa file của người kia nếu chưa thống nhất.

---

## 👤 Lê Hữu Thảo — nhánh `Le_Huu_Thao_FE`

| Trang | Route | Trạng thái |
|---|---|---|
| Đăng nhập / Đăng ký / Auth | `/auth/*` | ⬜ |
| Landing Page | `/` | ⬜ |
| Bộ thẻ công khai (Visitor) | `/decks` (public) | ⬜ |
| Màn hình học thẻ SRS | `/study/[deckId]` | ⬜ |
| Lịch sử ôn tập | `/review` | ⬜ |
| Luyện phát âm | `/pronunciation` | ⬜ |
| Navbar, Sidebar, Footer | `components/layout/*` | ⬜ |

---

## 👤 *(Tên thành viên B)* — nhánh `...`

| Trang | Route | Trạng thái |
|---|---|---|
| Dashboard | `/dashboard` | ⬜ |
| Quản lý bộ thẻ cá nhân | `/decks`, `/decks/[deckId]` | ⬜ |
| Quản lý thẻ | `/decks/[deckId]/cards` | ⬜ |
| Luyện tập | `/practice` | ⬜ |
| AI hỗ trợ | `/ai` | ⬜ |
| Sổ tay từ khó | `/notebook` | ⬜ |
| Tiến độ & Thống kê | `/progress` | ⬜ |
| Cài đặt | `/settings` | ⬜ |
| Admin pages | `/admin/*` | ⬜ |

---

## 📁 File dùng chung — Ai sửa phải báo nhau

- `src/types/index.ts`
- `src/constants/index.ts`
- `src/lib/api/*.ts`
- `src/app/layout.tsx`
- `src/app/globals.css`

---

## ✅ Ký hiệu: ⬜ Chưa làm · 🔨 Đang làm · ✅ Hoàn thành
