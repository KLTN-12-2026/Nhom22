# Yêu cầu giao diện — VocabLearning

Nguồn: TK §9.8 (nguyên tắc giao diện), hướng thiết kế đã chọn "Phiếu trả lời trắc nghiệm" (`.impeccable/surfaces/mockups-index-html.md`), token trong `mockups/shared/tokens.css`. Tài liệu này thắng mọi ý kiến thiết kế khác.

## 1. Ý tưởng chính

Mỗi màn hình là một **tờ phiếu trả lời**: hệ thống in khung bằng **mực chàm**, người học để lại **dấu chì graphite**. Người học Việt Nam ai cũng từng tô phiếu trắc nghiệm (THPT, TOEIC), nên giao diện quen tay, dễ hiểu.

| Thành phần của phiếu | Trong giao diện |
|---|---|
| Nền giấy trắng | `--sheet` `#FAFAF6`; ngoài tờ phiếu là mặt bàn `--desk` |
| Mực in chàm | `--primary` `#3B47B0`: đường kẻ, nhãn trường, khung, dải tiêu đề phiếu, nút chính, liên kết |
| Dấu chì | `--graphite`: ô tròn đã tô, chữ nội dung, trạng thái đã chọn |
| Vạch định vị ở mép trái | Dải vạch đen dọc mép trái mỗi tờ phiếu (`.sheet::before`) |
| Ô tròn đáp án | `.bubble` cho lựa chọn một; `.bubble.box` cho chọn nhiều |
| Dòng đáp án đánh số | `.answer-list` / `.answer-row` thay cho lưới thẻ bo góc |

## 2. Màu (tỷ lệ 60–30–10)

| Vai trò | Token | Dùng cho | Không dùng cho |
|---|---|---|---|
| Nền trung tính | `--sheet`, `--desk`, `--field` | 60% bề mặt | — |
| Chàm | `--primary`, `--primary-strong`, `--primary-tint` | Hành động chính, liên kết, nav đang chọn, khung | Trạng thái thành công |
| Xanh lá | `--secondary` | Tiến độ, hoàn thành, "Đã xác thực" | **Không bao giờ là nút** |
| Hổ phách | `--accent` (`.btn-accent`, chữ tối) | **Tối đa một** nút học mỗi màn: "Bắt đầu học", "Sao chép để học", "Hoàn tất" | Cảnh báo, nhãn, trang trí |
| Cảnh báo | `--warning`, `--warning-bg` | "Có thể trùng", notice cảnh báo | Nút |
| Lỗi | `--danger` | Lỗi trường, xóa | — |

Không dùng màu làm dấu hiệu duy nhất: luôn kèm chữ hoặc biểu tượng.

## 3. Chữ

| Font | Vai trò |
|---|---|
| Archivo, độ rộng hẹp (`font-stretch` 78–90%) | Giọng "chữ in trên phiếu": tiêu đề, nhãn trường, số thứ tự, nút |
| Archivo thường | Nội dung tiếng Việt |
| Gentium Book Plus | Từ tiếng Anh, IPA, từ loại, câu ví dụ (hỗ trợ đủ ký hiệu IPA và tiếng Việt) |

Nội dung tối thiểu 16px; đoạn văn ≤ 68 ký tự mỗi dòng; không viết HOA toàn bộ.

## 4. Bố cục (breakpoint 1024px)

- **Desktop ≥ 1024px:** header + sidebar trái; nội dung chính + cột phụ 320px; trang xác thực chia đôi (panel chàm đậm + form ≤ 420px).
- **Mobile < 1024px:** thanh trên + bottom nav 5 mục (Học, Thư viện, Luyện tập, Sổ tay, Tôi); một cột; trang xác thực một cột, không panel; màn học ẩn bottom nav.
- Không cuộn ngang ở 360/390px; vùng chạm ≥ 44px (48px cho nút chính); thanh cố định không che nội dung.

## 5. Tiêu chí nghiệm thu GT01–GT12

| ID | Phải đạt |
|---|---|
| GT01 | 60–30–10 như mục 2; một nút hổ phách tối đa mỗi màn |
| GT02–03 | Tương phản chữ ≥ 4.5:1, chữ lớn/điều khiển/viền focus ≥ 3:1; `:focus-visible` rõ |
| GT04 | Quên–Khó–Nhớ–Dễ đúng thứ tự, cùng kích thước, có chữ, phím 1–4 |
| GT05 | Màn học: từ là trọng tâm; không XP, quảng cáo AI, biểu đồ; nghĩa ẩn đến khi lật |
| GT06 | Không gradient tím–xanh, kính mờ, glow, lưới thẻ số liệu lặp lại, emoji làm nav, nhãn HOA phía trên tiêu đề |
| GT07 | Thử với dữ liệu dài: tên bộ 150 ký tự, từ dài, nghĩa nhiều dòng, dấu tiếng Việt, thiếu ảnh/âm thanh |
| GT08 | Hai bố cục như mục 4 |
| GT09/11 | Thời lượng lấy từ token; chỉ animate `opacity`/`transform`/`clip-path`; `prefers-reduced-motion` tắt lật và trượt |
| GT10 | Nút khóa khi đang gửi; tiến độ chỉ đổi sau khi server xác nhận |
| GT12 | Mọi màn có trạng thái tải, rỗng, lỗi (kèm mã yêu cầu), thành công |

## 6. Chữ trên giao diện

- Viết câu thường, động từ ngắn. Nút nói đúng việc nó làm ("Lưu thẻ"), toast dùng lại động từ đó ("Đã lưu thẻ").
- Lỗi nói chuyện gì đã xảy ra và cần làm gì tiếp.
- Không gắn "→" vào nút; không chuỗi "A · B · C".
- Trình độ luôn ghi là tự đánh giá; không hiện số liệu mà dữ liệu chưa có.
