CREATE TABLE thong_bao_he_thong
(
    id           BIGINT        NOT NULL AUTO_INCREMENT,
    tieu_de      VARCHAR(200)  NOT NULL,
    noi_dung     VARCHAR(2000) NOT NULL,
    muc_do       VARCHAR(20)   NOT NULL,
    lien_ket     VARCHAR(300)  NULL,
    bat_dau_at   DATETIME(3)   NOT NULL,
    ket_thuc_at  DATETIME(3)   NULL,
    hien_thi     BOOLEAN       NOT NULL,
    nguoi_tao_id BIGINT        NOT NULL,
    created_at   DATETIME(3)   NOT NULL,
    updated_at   DATETIME(3)   NOT NULL,
    version      BIGINT        NOT NULL DEFAULT 0,
    CONSTRAINT pk_thong_bao_he_thong PRIMARY KEY (id),
    CONSTRAINT fk_tbht_nguoi_tao FOREIGN KEY (nguoi_tao_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_tbht_muc_do CHECK (muc_do IN ('THONG_TIN', 'QUAN_TRONG')),
    CONSTRAINT ck_tbht_tieu_de CHECK (CHAR_LENGTH(TRIM(tieu_de)) > 0),
    CONSTRAINT ck_tbht_thoi_gian CHECK (ket_thuc_at IS NULL OR ket_thuc_at > bat_dau_at)
);

CREATE INDEX idx_tbht_hieu_luc ON thong_bao_he_thong (hien_thi, bat_dau_at, ket_thuc_at);

CREATE INDEX idx_bo_yeu_thich_bo_ngay ON bo_yeu_thich (bo_the_id, created_at);

ALTER TABLE nhat_ky_quan_tri
    DROP CHECK ck_nkqt_hanh_dong,
    DROP CHECK ck_nkqt_loai_doi_tuong;

ALTER TABLE nhat_ky_quan_tri
    ADD CONSTRAINT ck_nkqt_hanh_dong
        CHECK (hanh_dong IN (
                             'KHOA_TAI_KHOAN', 'MO_KHOA_TAI_KHOAN', 'CAP_QUYEN_QUAN_TRI', 'THU_QUYEN_QUAN_TRI',
                             'TAO_BO_MAU', 'SUA_BO_MAU', 'XUAT_BAN_BO_MAU', 'CHUYEN_VE_NHAP', 'AN_BO_MAU',
                             'HIEN_BO_MAU', 'XOA_BO_MAU', 'TAO_THE_MAU', 'SUA_THE_MAU', 'XOA_THE_MAU',
                             'SUA_GOI_DICH_VU', 'SUA_HAN_GOI', 'CHAY_KIEM_TRA_HET_HAN', 'XOA_TAI_KHOAN',
                             'GIU_NOI_DUNG', 'AN_NOI_DUNG', 'SUA_HAN_MUC',
                             'TAO_THONG_BAO', 'SUA_THONG_BAO', 'XOA_THONG_BAO'
            )),
    ADD CONSTRAINT ck_nkqt_loai_doi_tuong
        CHECK (loai_doi_tuong IN ('NGUOI_DUNG', 'BO_THE', 'THE_TU_VUNG', 'GOI_DICH_VU', 'DANG_KY_GOI',
                                  'YEU_CAU_AI', 'HAN_MUC_DICH_VU', 'THONG_BAO_HE_THONG'));
