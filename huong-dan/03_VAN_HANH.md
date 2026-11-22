# Vận hành

## Log và giám sát

- Profile `prod` ghi log JSON theo ECS (`logging.structured.format.console=ecs`). Mỗi request `/api/**` có một dòng logger `access`:

  ```json
  {"log":{"level":"INFO","logger":"access"},"message":"GET /api/v1/decks 401 10ms","requestId":"b45-json-log-check-03","http":{"method":"GET","status":401},"url":{"path":"/api/v1/decks"},"durationMs":10}
  ```

- `requestId` lấy từ header `X-Request-Id` (8–64 ký tự `A-Za-z0-9-`) hoặc sinh UUID; trả lại trong header phản hồi và trong body lỗi. Khi người dùng báo lỗi, tìm theo `requestId`:

  ```bash
  docker compose --env-file .env.prod -f docker-compose.prod.yml logs api | grep '"requestId":"<id>"'
  ```

- Log không ghi query string, body, token, mật khẩu hay nội dung email.
- Health: `GET /actuator/health/liveness`, `/actuator/health/readiness` (trong mạng Docker; Nginx chặn `/actuator/` từ ngoài). Healthcheck của service `api` dùng readiness.
- Dev muốn xem log JSON: đặt biến `LOGGING_STRUCTURED_FORMAT_CONSOLE=ecs`.

## Sao lưu và khôi phục

| Việc | Lệnh (trong `backend/k28`) |
|---|---|
| Sao lưu dev | `./scripts/backup.sh` → `backups/<thời điểm UTC>/` (`mysql.sql.gz`, `s3/`, `manifest.txt`, `SHA256SUMS`) |
| Sao lưu prod | `ENV_FILE=.env.prod MYSQL_CONTAINER=vocab-prod-mysql-1 NETWORK=vocab-prod_default ./scripts/backup.sh` |
| Khôi phục | `TARGET_MYSQL_CONTAINER=… TARGET_DB=… TARGET_S3_URL=http://<s3>:9000 TARGET_BUCKET=… ./scripts/restore.sh backups/<thư mục>` |
| Kiểm tra sau khôi phục | cùng biến như trên, `./scripts/verify_restore.sh` (so số dòng, kiểm object của mọi tệp) |

Khôi phục vào DB đang chạy sẽ ghi đè bảng cùng tên: dừng `api` trước (`docker compose … stop api`), khôi phục, rồi chạy lại. Biên bản lần thử: [TC19](../docs/kiem-thu/TC19_BIEN_BAN_SAO_LUU_KHOI_PHUC.md).

### Database nhánh FE đã chạy `V28__admin_motivation.sql`

Sau khi merge `main`, V28 là `dashboard_highlights`, còn phần quản trị huy hiệu/thử thách nằm ở V34. Database đã chạy V28 cũ sẽ báo checksum mismatch và API có thể lặp restart.

Trong `backend/k28`, `python3 scripts/repair_legacy_v28.py` chỉ kiểm tra, không sửa database. Script chỉ nhận đúng V28 cũ với checksum `-34270287`, kiểm tra các migration trước đó và từ chối database đã chuyển đổi hoặc có trạng thái khác.

Trước khi áp dụng, dừng riêng API, sao lưu bằng `mysqldump`, kiểm tra bản sao và diễn tập trên database riêng khôi phục từ bản sao đó. Thư mục sao lưu cần có `mysql.sql.gz` và `manifest.json` ghi `sha256` của file nén. Sao lưu chứa dữ liệu thật, giữ quyền truy cập riêng và không đưa vào Git.

```bash
python3 scripts/repair_legacy_v28.py --database TEN_DB_THU --apply --backup-dir DUONG_DAN_SAO_LUU
python3 scripts/repair_legacy_v28.py --apply --backup-dir DUONG_DAN_SAO_LUU
docker compose --profile app up -d --build --no-deps api
```

Script áp dụng các thay đổi còn thiếu từ V28–V34, giữ các cột `version` đã có và các loại nhật ký của nhánh FE, rồi mới cập nhật lịch sử Flyway theo source hiện tại. Lịch sử cũ, SQL đã chạy và kết quả kiểm tra được lưu trong thư mục sao lưu. Script so sánh số dòng và SHA-256 dữ liệu cũ của từng bảng trước/sau; ba huy hiệu tuần mới từ V33 được bổ sung riêng. Cuối cùng kiểm tra Flyway, health API và các kiểu sắp xếp thư viện. Không dùng `flyway repair` đơn thuần để bỏ qua việc thiếu cấu trúc database.

## Kiểm tra tải

Xem [TC20](../docs/kiem-thu/TC20_BIEN_BAN_HIEU_NANG.md). Tóm tắt: nạp `scripts/k6/seed_load_users.sql`, chạy `scripts/k6/tc20.js` bằng image `grafana/k6:1.3.0`.

## Dữ liệu demo (B5.2b)

Chạy trên server profile `dev` (hoặc `dev,demo` để có thêm 160 giao dịch `DEMO-…` cho màn doanh thu), DB mới:

```bash
cd backend/k28
python scripts/demo/seed_demo.py http://localhost:8080
docker exec -i vocab-mysql-1 sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" vocab_learn' < scripts/demo/make_overdue.sql
```

| Tài khoản | Vai trò | Lịch sử |
|---|---|---|
| `admin@vocab.local` | Admin | Thấy báo cáo của An, ca lỗi dịch vụ ảnh của Chi ở `GET /admin/service-usage`, giao dịch demo |
| `an@vocab.local` | User, `PRO`, cơ bản | 2 bộ, 12 lượt ôn có Quên/Khó, 3 bài luyện nhiều câu sai (sổ tay từ khó, cặp dễ nhầm), 1 lượt AI tạo thẻ còn nháp, 1 báo cáo nội dung |
| `binh@vocab.local` | User, `PREMIUM`, TOEIC | 1 bộ, ôn nhiều, toàn bộ thẻ đã học bị đẩy quá hạn 2–7 ngày (dùng cứu lịch ôn) |
| `chi@vocab.local` | User, `PRO`, nâng cao | 1 bộ, 4 lượt ôn, 1 bài luyện, 1 yêu cầu ảnh AI lỗi (mô phỏng `#mo-phong:LOI`, đã hoàn hạn mức) |

Mật khẩu chung `Vocab@12345`. Script chạy lại được: sao chép bộ theo `Idempotency-Key`, bỏ qua phần ôn/luyện đã có; riêng yêu cầu ảnh lỗi của Chi tạo thêm một bản ghi mỗi lần chạy.

## Công cụ demo gói (chỉ `dev`/`demo`)

`PATCH /api/v1/admin/subscriptions/{id}/expiry` (đổi hạn, cần `version` và lý do ≥ 10 ký tự) và `POST /api/v1/admin/subscriptions/expiry-check` (chạy ngay job nhắc/hết hạn). `prod` tắt, gọi trả 404. Kịch bản kiểm: `scripts/smoke_billing_expiry.py`.
