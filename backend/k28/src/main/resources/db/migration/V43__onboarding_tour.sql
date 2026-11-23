ALTER TABLE ho_so_hoc_tap
    ADD COLUMN buoc_huong_dan  VARCHAR(30) NOT NULL DEFAULT 'CHUA_BAT_DAU',
    ADD COLUMN bo_khoi_dong_id BIGINT      NULL,
    ADD COLUMN bo_sao_chep_id  BIGINT      NULL,
    ADD CONSTRAINT ck_hsht_buoc_huong_dan CHECK (buoc_huong_dan IN (
        'CHUA_BAT_DAU', 'HOC_BO_KHOI_DONG', 'XEM_TONG_KET', 'SAO_CHEP_THU_VIEN',
        'MO_BO_SAO_CHEP', 'THEM_TU', 'HOAN_TAT', 'BO_QUA'
    ));

UPDATE ho_so_hoc_tap
SET buoc_huong_dan = 'BO_QUA'
WHERE da_hoan_tat_khoi_dau = TRUE;
