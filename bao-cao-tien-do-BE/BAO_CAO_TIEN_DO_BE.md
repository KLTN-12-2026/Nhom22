# Báo cáo tiến độ backend

## 02/10/2026 — Hoàn tất B1.6: tệp tin và ảnh đại diện

| Nội dung | Kết quả |
|---|---|
| Đã làm | Upload/complete/read/delete; MIME/SHA-256/media; avatar; expiry; retry và cleanup |
| Migration | Giữ V2__file.sql; thêm V3__file_cleanup.sql; tiếp theo V4 |
| Compile | mvnw.cmd -q -DskipTests compile pass |
| Test B1.6 | FR03FilesTest 12 + FR03MediaTest 7 + FR03CleanupTest 3 = 22 pass |
| Hồi quy | FR02SettingsTest 7 + StorageServiceTest 2 + SecurityBaselineTest 4 = 13 pass |
| Tổng kiểm chứng | 35 pass; 0 failure/error/skip; MySQL/Redis/RustFS qua Testcontainers |
| Browser upload | Bucket CORS; compose config pass; s3-init exit 0; preflight pass |
| Bàn giao | [Luồng và API B1.6](../docs/luong-backend/B1.6-tep-tin-anh-dai-dien.md) |
| Tiếp theo | B1.7 chủ đề, nhãn, trình độ; V4__content.sql |
| Lưu ý | 4096 pixel/chiều, audio 300 giây; MP3/WAV/FLAC; cleanup eventual, metadata audio chưa phải giải mã toàn bộ |

### File được hoàn thiện

Đường dẫn Java dưới backend/k28/src/main/java/com/do_an_tot_nghiep/k28/.

| File | Vai trò |
|---|---|
| content/controller/FileController.java | API upload, complete, read, delete |
| content/service/FileService.java | Quyền, transaction, promotion, avatar, xóa |
| content/service/FileVerifier.java | Dung lượng, MIME, checksum |
| content/service/MediaValidator.java | Đọc ảnh và metadata/thời lượng âm thanh |
| content/service/FileCleanupWorker.java | Retry, pending hết hạn, orphan, pagination |
| content/entity/TepTin.java | Timestamp xóa object |
| content/entity/enums/LoaiTep.java | Định dạng hỗ trợ |
| content/repository/TepTinRepository.java | Khóa, expiry, retry, kiểm tra tham chiếu |
| content/dto/UploadRequest.java | Giới hạn trường MIME |
| account/controller/MeController.java | Gắn, lấy, gỡ ảnh đại diện |
| account/service/AccountService.java | Cập nhật tài khoản trong transaction chung |
| account/entity/NguoiDung.java | Đổi ảnh đại diện |
| account/dto/UserResponse.java | ID ảnh đại diện |
| common/storage/StorageService.java | Đọc giới hạn, ghi verified, list object |
| common/config/FileCleanupConfig.java | Scheduler có cấu hình |
| backend/k28/src/main/resources/db/migration/V3__file_cleanup.sql | Timestamp/index cleanup |
| backend/k28/src/main/resources/application.yaml | Cấu hình media/worker |
| backend/k28/pom.xml | Dependency WebP và âm thanh |
| backend/k28/docker-compose.yml | Init bucket CORS |
| backend/k28/docker/s3-cors.json | Origin và phương thức browser |
| backend/k28/src/test/java/com/do_an_tot_nghiep/k28/content/FR03FilesTest.java | 12 test API/DB/storage |
| backend/k28/src/test/java/com/do_an_tot_nghiep/k28/content/FR03MediaTest.java | 7 test media |
| backend/k28/src/test/java/com/do_an_tot_nghiep/k28/content/FR03CleanupTest.java | 3 test worker |
| backend/k28/src/test/java/com/do_an_tot_nghiep/k28/content/FileFixtures.java | Ảnh/WAV mẫu |
| roadmap/ROADMAP_BE.md | Hoàn tất B1.6, số migration tương lai |
| docs/luong-backend/B1.6-tep-tin-anh-dai-dien.md | Hợp đồng API và luồng |
| bao-cao-tien-do-BE/BAO_CAO_TIEN_DO_BE.md | Tiến độ và danh sách file |

Giữ nguyên V2__file.sql và DTO/mapper/enum đã đúng từ phần tự gõ. Không sửa FE; chưa có postman/postman.json để sync. Graph được cập nhật bằng graphify update; SQL AST thiếu tree_sitter_sql, migrations đã kiểm chứng qua Flyway/MySQL.
