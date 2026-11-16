CREATE TABLE bao_cao_noi_dung
(
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    nguoi_bao_cao_id  BIGINT       NOT NULL,
    loai_doi_tuong    VARCHAR(20)  NOT NULL,
    doi_tuong_id      BIGINT       NOT NULL,
    ly_do             VARCHAR(20)  NOT NULL,
    mo_ta             VARCHAR(500) NOT NULL,
    noi_dung_json     JSON         NOT NULL,
    trang_thai        VARCHAR(20)  NOT NULL,
    nguoi_xu_ly_id    BIGINT       NULL,
    ly_do_xu_ly       VARCHAR(500) NULL,
    xu_ly_at          DATETIME(3)  NULL,
    khoa_cho_xu_ly    TINYINT GENERATED ALWAYS AS (CASE WHEN trang_thai = 'CHO_XU_LY' THEN 1 END) STORED,
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version           BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT pk_bao_cao_noi_dung PRIMARY KEY (id),
    CONSTRAINT uk_bao_cao_cho_xu_ly UNIQUE (nguoi_bao_cao_id, loai_doi_tuong, doi_tuong_id, khoa_cho_xu_ly),
    CONSTRAINT fk_bao_cao_nguoi_bao_cao FOREIGN KEY (nguoi_bao_cao_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_bao_cao_nguoi_xu_ly FOREIGN KEY (nguoi_xu_ly_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_bao_cao_loai CHECK (loai_doi_tuong IN ('BO_THE', 'THE_TU_VUNG', 'YEU_CAU_AI')),
    CONSTRAINT ck_bao_cao_ly_do CHECK (ly_do IN ('SAI_NOI_DUNG', 'KHONG_PHU_HOP', 'KHAC')),
    CONSTRAINT ck_bao_cao_mo_ta CHECK (CHAR_LENGTH(mo_ta) BETWEEN 10 AND 500),
    CONSTRAINT ck_bao_cao_trang_thai CHECK (trang_thai IN ('CHO_XU_LY', 'DA_GIU', 'DA_AN')),
    CONSTRAINT ck_bao_cao_xu_ly CHECK (
        (trang_thai = 'CHO_XU_LY' AND nguoi_xu_ly_id IS NULL AND xu_ly_at IS NULL AND ly_do_xu_ly IS NULL)
            OR (trang_thai <> 'CHO_XU_LY' AND nguoi_xu_ly_id IS NOT NULL AND xu_ly_at IS NOT NULL
            AND CHAR_LENGTH(ly_do_xu_ly) BETWEEN 10 AND 500))
);

CREATE INDEX ix_bao_cao_trang_thai ON bao_cao_noi_dung (trang_thai, created_at);
CREATE INDEX ix_bao_cao_doi_tuong ON bao_cao_noi_dung (loai_doi_tuong, doi_tuong_id, trang_thai);

ALTER TABLE the_tu_vung
    ADD COLUMN an_kiem_duyet BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE yeu_cau_ai
    ADD COLUMN an_kiem_duyet BOOLEAN NOT NULL DEFAULT FALSE;

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
                             'GIU_NOI_DUNG', 'AN_NOI_DUNG'
            )),
    ADD CONSTRAINT ck_nkqt_loai_doi_tuong
        CHECK (loai_doi_tuong IN ('NGUOI_DUNG', 'BO_THE', 'THE_TU_VUNG', 'GOI_DICH_VU', 'DANG_KY_GOI',
                                  'YEU_CAU_AI'));
