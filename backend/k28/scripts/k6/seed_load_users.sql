SET @pw = '$2b$10$U55bodQ/vyIqV8rqVNz.WuPkr2DcNqsgUAhHB4pfZgvHm9hMKBhmy';
SET @now = UTC_TIMESTAMP(3);

INSERT INTO nguoi_dung (email, password_hash, ten_hien_thi, trang_thai, email_xac_thuc_at)
WITH RECURSIVE n AS (SELECT 1 AS i UNION ALL SELECT i + 1 FROM n WHERE i < 50)
SELECT CONCAT('load', LPAD(i, 2, '0'), '@vocab.local'), @pw, CONCAT('Load ', LPAD(i, 2, '0')), 'HOAT_DONG', @now FROM n
ON DUPLICATE KEY UPDATE email = email;

INSERT IGNORE INTO nguoi_dung_vai_tro (nguoi_dung_id, vai_tro_id)
SELECT u.id, r.id FROM nguoi_dung u JOIN vai_tro r ON r.ma = 'USER'
WHERE u.email LIKE 'load__@vocab.local';

INSERT IGNORE INTO ho_so_hoc_tap (nguoi_dung_id, trinh_do, muc_tieu, phut_moi_ngay, tu_moi_moi_ngay, da_hoan_tat_khoi_dau)
SELECT id, 'CO_BAN', 'GIAO_TIEP', 10, 10, TRUE FROM nguoi_dung WHERE email LIKE 'load__@vocab.local';

INSERT IGNORE INTO cai_dat_thong_bao (nguoi_dung_id, gio_nhac)
SELECT id, '20:00:00' FROM nguoi_dung WHERE email LIKE 'load__@vocab.local';

INSERT IGNORE INTO dang_ky_goi (nguoi_dung_id, goi_ma, bat_dau_at, het_han_at, trang_thai)
SELECT u.id, 'PRO', @now, DATE_ADD(@now, INTERVAL 1 YEAR), 'HIEU_LUC'
FROM nguoi_dung u
WHERE u.email LIKE 'load__@vocab.local'
  AND NOT EXISTS (SELECT 1 FROM dang_ky_goi d WHERE d.nguoi_dung_id = u.id AND d.trang_thai = 'HIEU_LUC' AND d.het_han_at > @now);
