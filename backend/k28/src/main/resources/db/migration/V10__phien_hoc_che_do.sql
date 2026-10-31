ALTER TABLE phien_hoc
    ADD COLUMN che_do VARCHAR(20) NOT NULL DEFAULT 'THUONG' AFTER quy_thoi_gian,
    ADD CONSTRAINT ck_phien_hoc_che_do
        CHECK (che_do IN ('THUONG', 'CUU_LICH'));
