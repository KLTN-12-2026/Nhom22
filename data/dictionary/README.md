# Từ điển Anh – Việt, Việt – Anh

## Nguồn dữ liệu

- **Free Vietnamese Dictionary Project (FVDP)** do Hồ Ngọc Đức và cộng sự biên soạn: http://www.informatik.uni-leipzig.de/~duc/Dict/
  - `anhviet109K.txt`: Anh – Việt, khoảng 109.000 mục, có phiên âm.
  - `vietanh.txt`: Việt – Anh, khoảng 23.400 mục.
- Bản văn bản thô lấy từ kho GitHub `yenthanh132/avdict-database-sqlite-converter`. Kho này chép lại dữ liệu FVDP và ghi nguồn gốc ở trên.
- **Giấy phép:** GNU General Public License phiên bản 2 trở lên, theo mục `00-database-info` của dữ liệu. Bản quyền thuộc The Free Vietnamese Dictionary Project, 1997–2003.

VocabLearning chỉ đổi định dạng sang JSON để tra cứu, không sửa nội dung. Trang `/tu-dien` và mọi thẻ tạo từ từ điển đều ghi nguồn này.

## Tạo lại dữ liệu

```
python -I data/dictionary/build_dictionary.py <anhviet109K.txt> <vietanh.txt> backend/k28/src/main/resources/dictionary
```

Lệnh trên sinh ra hai tệp:

- `anh-viet.jsonl.gz`: khoảng 103.600 mục.
- `viet-anh.jsonl.gz`: khoảng 23.400 mục.

Mỗi dòng là một mục: `{tu, phienAm, tomTat, noiDung: {nhom: [{tuLoai, nghia: [{noiDung, viDu: [{cau, dich}], ghiChu}], thanhNgu: [{cum, nghia}]}]}}`. Các mục trùng từ đầu được gộp lại.

## Nạp vào cơ sở dữ liệu

Backend tự nạp vào bảng `tu_dien` (migration V30) khi khởi động, nếu số dòng ít hơn số mục trong tệp:

- Nạp lại không tạo dòng trùng vì có khóa duy nhất `(chieu, tu)` và dùng `INSERT IGNORE`.
- Lần nạp đầu mất khoảng 30 giây.
- Tắt tự nạp bằng biến môi trường `DICTIONARY_IMPORT=false`.

## API công khai (khách dùng được)

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| GET | `/api/v1/dictionary/suggest?q=&chieu=ANH_VIET\|VIET_ANH&limit=1..20` | Gợi ý theo tiền tố, bỏ dấu và không phân biệt hoa thường |
| GET | `/api/v1/dictionary/lookup?q=&chieu=` | Các mục khớp từ cần tra (`ketQua`) và từ gần giống (`goiY`) |
| GET | `/api/v1/dictionary/entries/{id}` | Chi tiết một mục |
