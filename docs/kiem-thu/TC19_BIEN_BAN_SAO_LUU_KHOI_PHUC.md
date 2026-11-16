# Biên bản TC-19 — Sao lưu và khôi phục (B4.4)

| Mục | Nội dung |
|---|---|
| Ngày thực hiện | 16/11/2026, 23:44 (giờ VN) |
| Người thực hiện | Nhóm BE (chạy script) |
| Nguồn | Môi trường dev: `vocab-mysql-1` (MySQL 8.4.13, DB `vocab_learn`), `vocab-s3-1` (RustFS 1.0.3, bucket `vocab-files`) |
| Đích | Môi trường mới tạo riêng cho lần thử: container `vocab-restore-mysql` (mysql:8.4, rỗng) và `vocab-restore-s3` (rustfs 1.0.3, rỗng), cùng mạng `vocab_default`; xóa sau khi kiểm |
| Script | `backend/k28/scripts/backup.sh`, `restore.sh`, `verify_restore.sh` |

## Cách làm

```bash
cd backend/k28
./scripts/backup.sh
TARGET_MYSQL_CONTAINER=vocab-restore-mysql TARGET_DB=vocab_learn \
TARGET_S3_URL=http://vocab-restore-s3:9000 TARGET_BUCKET=vocab-files \
  ./scripts/restore.sh backups/20261116T164415Z
TARGET_MYSQL_CONTAINER=vocab-restore-mysql TARGET_DB=vocab_learn \
TARGET_S3_URL=http://vocab-restore-s3:9000 TARGET_BUCKET=vocab-files \
  ./scripts/verify_restore.sh
```

- Sao lưu: `mysqldump --single-transaction --routines --triggers` nén gzip + `aws s3 sync` toàn bucket; ghi `manifest.txt` và `SHA256SUMS`.
- Khôi phục: kiểm `SHA256SUMS` trước, tạo DB đích, nạp dump, tạo bucket nếu chưa có, `aws s3 sync` ngược lại.
- Kiểm tra: so số dòng 10 bảng chính giữa nguồn và đích; mọi `tep_tin.object_key` còn hiệu lực phải có object trong bucket đích.

## Kết quả

| Bước | Thời gian | Kích thước |
|---|---|---|
| Sao lưu | 8 giây | dump 306.176 byte (gzip), 43 object |
| Khôi phục | 23 giây | — |

| Bảng | Nguồn | Đích | Kết quả |
|---|---|---|---|
| `nguoi_dung` | 118 | 118 | Khớp |
| `bo_the` | 124 | 124 | Khớp |
| `the_tu_vung` | 3.644 | 3.644 | Khớp |
| `tien_do_the` | 62 | 62 | Khớp |
| `lich_su_on` | 114 | 114 | Khớp |
| `tep_tin` | 52 | 52 | Khớp |
| `dang_ky_goi` | 57 | 57 | Khớp |
| `giao_dich_thanh_toan` | 6 | 6 | Khớp |
| `nhat_ky_quan_tri` | 1.000 | 1.000 | Khớp |
| `flyway_schema_history` | 32 | 32 | Khớp |

Tham chiếu tệp: 43 `tep_tin` còn hiệu lực, thiếu object 0. **Kết luận: PASS.**

## Giới hạn

- Không lập lịch sao lưu tự động (phạm vi Gọn, KE_HOACH_CAT_DOT3 §1.3). Production: chạy tay hoặc cron với `ENV_FILE=.env.prod MYSQL_CONTAINER=vocab-prod-mysql-1 NETWORK=vocab-prod_default`.
- Redis (phiên đăng nhập, khóa rate limit) không sao lưu: mất Redis chỉ buộc người dùng đăng nhập lại.
- Thư mục `backups/` không commit; cần chép bản sao lưu ra máy khác.
