INSERT IGNORE INTO giao_dich_thanh_toan
    (ma_don, nguoi_dung_id, goi_ma, chu_ky, so_tien, cong, trang_thai, ma_giao_dich_cong, ma_phan_hoi, tao_at, hoan_tat_at)
WITH RECURSIVE so AS (
    SELECT 0 AS i
    UNION ALL
    SELECT i + 1 FROM so WHERE i < 159
),
don AS (
    SELECT i,
           CONCAT('DEMO-', LPAD(i, 4, '0')) AS ma_don,
           ELT(i % 3 + 1, 'an@vocab.local', 'binh@vocab.local', 'chi@vocab.local') AS email,
           IF(i % 4 = 0, 'PREMIUM', 'PRO') AS goi_ma,
           IF(i % 5 = 0, 'NAM', 'THANG') AS chu_ky,
           CASE WHEN i % 13 = 0 THEN 'THAT_BAI' WHEN i % 17 = 0 THEN 'HET_HAN' ELSE 'THANH_CONG' END AS trang_thai,
           TIMESTAMP('2025-01-01 01:30:00') + INTERVAL (i * 4) DAY + INTERVAL (i % 11) HOUR AS tao_at
    FROM so
)
SELECT d.ma_don,
       u.id,
       d.goi_ma,
       d.chu_ky,
       IF(d.chu_ky = 'NAM', g.gia_nam, g.gia_thang),
       'MO_PHONG',
       d.trang_thai,
       IF(d.trang_thai = 'HET_HAN', NULL, CONCAT('MP', LPAD(d.i, 8, '0'))),
       CASE d.trang_thai WHEN 'THANH_CONG' THEN '00' WHEN 'THAT_BAI' THEN '24' ELSE NULL END,
       d.tao_at,
       IF(d.trang_thai = 'HET_HAN', NULL, d.tao_at + INTERVAL 2 MINUTE)
FROM don d
JOIN nguoi_dung u ON u.email = d.email
JOIN goi_dich_vu g ON g.ma = d.goi_ma;
