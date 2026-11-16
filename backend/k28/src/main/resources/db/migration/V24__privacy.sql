CREATE TABLE yeu_cau_xoa_du_lieu
(
    id                  BIGINT      NOT NULL AUTO_INCREMENT,
    nguoi_dung_id       BIGINT      NOT NULL,
    pham_vi             VARCHAR(20) NOT NULL,
    trang_thai          VARCHAR(20) NOT NULL,
    ket_qua_json        JSON        NULL,
    ma_loi              VARCHAR(50) NULL,
    yeu_cau_at          DATETIME(3) NOT NULL,
    hoan_tat_at         DATETIME(3) NULL,
    nguoi_dung_dang_xu_ly BIGINT GENERATED ALWAYS AS (
        CASE WHEN trang_thai IN ('CHO_XU_LY', 'DANG_XU_LY') THEN nguoi_dung_id END) STORED,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version             BIGINT      NOT NULL DEFAULT 0,
    CONSTRAINT pk_yeu_cau_xoa_du_lieu PRIMARY KEY (id),
    CONSTRAINT uk_yeu_cau_xoa_dang_xu_ly UNIQUE (nguoi_dung_dang_xu_ly),
    CONSTRAINT fk_yeu_cau_xoa_nguoi FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_yeu_cau_xoa_pham_vi CHECK (pham_vi IN ('TAI_KHOAN')),
    CONSTRAINT ck_yeu_cau_xoa_trang_thai CHECK (trang_thai IN ('CHO_XU_LY', 'DANG_XU_LY', 'HOAN_TAT', 'LOI'))
);

CREATE INDEX ix_yeu_cau_xoa_nguoi ON yeu_cau_xoa_du_lieu (nguoi_dung_id, yeu_cau_at);

ALTER TABLE nhat_ky_quan_tri
    DROP CHECK ck_nkqt_hanh_dong;

ALTER TABLE nhat_ky_quan_tri
    ADD CONSTRAINT ck_nkqt_hanh_dong
        CHECK (hanh_dong IN (
                             'KHOA_TAI_KHOAN', 'MO_KHOA_TAI_KHOAN', 'CAP_QUYEN_QUAN_TRI', 'THU_QUYEN_QUAN_TRI',
                             'TAO_BO_MAU', 'SUA_BO_MAU', 'XUAT_BAN_BO_MAU', 'CHUYEN_VE_NHAP', 'AN_BO_MAU',
                             'HIEN_BO_MAU', 'XOA_BO_MAU', 'TAO_THE_MAU', 'SUA_THE_MAU', 'XOA_THE_MAU',
                             'SUA_GOI_DICH_VU', 'SUA_HAN_GOI', 'CHAY_KIEM_TRA_HET_HAN', 'XOA_TAI_KHOAN'
            ));
