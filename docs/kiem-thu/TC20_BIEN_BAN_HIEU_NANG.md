# Biên bản TC-20 — Tải 50 người dùng đồng thời (B4.3)

| Mục | Nội dung |
|---|---|
| Ngày thực hiện | 16/11/2026, 23:42 (giờ VN) |
| Công cụ | k6 1.3.0 (image `grafana/k6:1.3.0`), kịch bản `backend/k28/scripts/k6/tc20.js` |
| Máy | Laptop Windows 11, 12 luồng CPU, 15,6 GB RAM; API, MySQL, Redis, RustFS và k6 chạy cùng máy |
| Ứng dụng | Spring Boot 4.1.1, profile `dev`, `spring-boot:run` (JIT `TieredStopAtLevel=1`, devtools), cổng 8081 |
| Dữ liệu | 50 tài khoản `load01…load50@vocab.local` gói `PRO` (`scripts/k6/seed_load_users.sql`), mỗi tài khoản sao chép 1 bộ mẫu 30 thẻ; thư viện 38 bộ mẫu |
| Kết quả gốc | `backend/k28/scripts/k6/last_run.txt` |

## Kịch bản

- Tăng 0 → 50 VU trong 30 giây, giữ 50 VU 2 phút, giảm về 0 trong 15 giây.
- Mỗi VU đăng nhập một lần (phiên cookie), rồi lặp: `GET /learning/today` → `GET /decks` → `GET /library/decks` → `GET /statistics/overview`, nghỉ 1 giây sau mỗi request.
- Ngưỡng đạt: p95 mỗi endpoint < 800 ms, tỷ lệ lỗi ứng dụng < 1%.

```bash
cd backend/k28
docker exec -i vocab-mysql-1 sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" vocab_learn' < scripts/k6/seed_load_users.sql
docker run --rm -i -e VUS=50 -e HOLD=2m -e BASE_URL=http://host.docker.internal:8080 grafana/k6:1.3.0 run - < scripts/k6/tc20.js
```

## Kết quả

| Endpoint | Trung bình | Trung vị | p90 | p95 | Lớn nhất |
|---|---|---|---|---|---|
| `GET /learning/today` | 58,1 ms | 51,7 ms | 77,0 ms | 105,7 ms | 273,2 ms |
| `GET /decks` | 39,6 ms | 35,1 ms | 54,0 ms | 69,0 ms | 304,1 ms |
| `GET /library/decks` | 44,5 ms | 38,8 ms | 62,1 ms | 80,7 ms | 270,4 ms |
| `GET /statistics/overview` | 49,1 ms | 43,5 ms | 66,5 ms | 89,0 ms | 298,8 ms |
| Tất cả request | 49,2 ms | 42,1 ms | 69,5 ms | 100,6 ms | 630,8 ms |

| Chỉ số | Giá trị |
|---|---|
| Tổng request | 7.152 (42,8 request/giây) |
| Request lỗi (`http_req_failed`) | 0 (0,00%) |
| Check đạt | 6.902/6.902 |
| Vòng lặp hoàn tất | 1.713 |

**Kết luận: PASS** — p95 mọi endpoint dưới 110 ms, không lỗi. Không cần thêm index: endpoint chậm nhất (`/learning/today`) p95 105,7 ms, xa ngưỡng.

## Giới hạn

- Đo trên máy dev, chung máy với CSDL và công cụ tải; production (JIT đầy đủ, không devtools) dự kiến nhanh hơn.
- Không đo riêng upload và AI (phạm vi Gọn).
