ALTER TABLE dang_ky_goi
    DROP CHECK ck_dang_ky_goi_trang_thai,
    ADD COLUMN huy_at DATETIME(3) NULL,
    ADD CONSTRAINT ck_dang_ky_goi_trang_thai
        CHECK (trang_thai IN ('HIEU_LUC', 'HET_HAN', 'DA_HUY')),
    ADD CONSTRAINT ck_dang_ky_goi_huy
        CHECK ((trang_thai = 'DA_HUY' AND huy_at IS NOT NULL)
            OR (trang_thai <> 'DA_HUY' AND huy_at IS NULL));
