CREATE TABLE yeu_cau_cong_khai
(
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    bo_the_id       BIGINT       NOT NULL,
    bo_nguon_id     BIGINT       NOT NULL,
    nguoi_gui_id    BIGINT       NOT NULL,
    nguoi_duyet     VARCHAR(10)  NOT NULL,
    nguoi_xu_ly_id  BIGINT       NULL,
    trang_thai      VARCHAR(20)  NOT NULL,
    loi_nhan        VARCHAR(500) NULL,
    ly_do           VARCHAR(500) NULL,
    het_han_at      DATETIME(3)  NOT NULL,
    xu_ly_at        DATETIME(3)  NULL,
    created_at      DATETIME(3)  NOT NULL,
    updated_at      DATETIME(3)  NOT NULL,
    version         BIGINT       NOT NULL DEFAULT 0,
    cho_duyet_bo_id BIGINT GENERATED ALWAYS AS (IF(trang_thai = 'CHO_DUYET', bo_the_id, NULL)) STORED,
    CONSTRAINT pk_yeu_cau_cong_khai PRIMARY KEY (id),
    CONSTRAINT uk_yccx_cho_duyet UNIQUE (cho_duyet_bo_id),
    CONSTRAINT fk_yccx_bo_the FOREIGN KEY (bo_the_id) REFERENCES bo_the (id),
    CONSTRAINT fk_yccx_bo_nguon FOREIGN KEY (bo_nguon_id) REFERENCES bo_the (id),
    CONSTRAINT fk_yccx_nguoi_gui FOREIGN KEY (nguoi_gui_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_yccx_nguoi_xu_ly FOREIGN KEY (nguoi_xu_ly_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_yccx_nguoi_duyet CHECK (nguoi_duyet IN ('TAC_GIA', 'ADMIN')),
    CONSTRAINT ck_yccx_trang_thai CHECK (trang_thai IN ('CHO_DUYET', 'DA_DUYET', 'TU_CHOI', 'HET_HAN', 'DA_RUT', 'THU_HOI'))
);

CREATE INDEX idx_yccx_bo_the ON yeu_cau_cong_khai (bo_the_id, id);
CREATE INDEX idx_yccx_bo_nguon ON yeu_cau_cong_khai (bo_nguon_id, trang_thai, created_at);
CREATE INDEX idx_yccx_het_han ON yeu_cau_cong_khai (trang_thai, het_han_at);

INSERT INTO yeu_cau_cong_khai
    (bo_the_id, bo_nguon_id, nguoi_gui_id, nguoi_duyet, trang_thai, ly_do, het_han_at, xu_ly_at,
     created_at, updated_at, version)
SELECT b.id, b.bo_nguon_id, b.chu_so_huu_id, IF(s.bo_mau, 'ADMIN', 'TAC_GIA'), 'DA_DUYET',
       'Dữ liệu trước 21/11/2026', UTC_TIMESTAMP(3), UTC_TIMESTAMP(3), UTC_TIMESTAMP(3), UTC_TIMESTAMP(3), 0
FROM bo_the b
         JOIN bo_the s ON s.id = b.bo_nguon_id
WHERE b.quyen_truy_cap = 'CONG_KHAI'
  AND b.xoa_at IS NULL;

ALTER TABLE thong_bao
    MODIFY ngay_dia_phuong DATE NULL,
    DROP CHECK ck_thong_bao_loai;

ALTER TABLE thong_bao
    ADD CONSTRAINT ck_thong_bao_loai
        CHECK (loai IN ('NHAC_HOC', 'GOI_SAP_HET_HAN', 'GOI_DA_HET_HAN', 'YEU_CAU_CONG_KHAI', 'KET_QUA_CONG_KHAI'));

ALTER TABLE nhat_ky_quan_tri
    DROP CHECK ck_nkqt_hanh_dong;

ALTER TABLE nhat_ky_quan_tri
    ADD CONSTRAINT ck_nkqt_hanh_dong
        CHECK (hanh_dong IN (
                             'KHOA_TAI_KHOAN', 'MO_KHOA_TAI_KHOAN', 'CAP_QUYEN_QUAN_TRI', 'THU_QUYEN_QUAN_TRI',
                             'TAO_BO_MAU', 'SUA_BO_MAU', 'XUAT_BAN_BO_MAU', 'CHUYEN_VE_NHAP', 'AN_BO_MAU',
                             'HIEN_BO_MAU', 'XOA_BO_MAU', 'TAO_THE_MAU', 'SUA_THE_MAU', 'XOA_THE_MAU',
                             'SUA_GOI_DICH_VU', 'SUA_HAN_GOI', 'CHAY_KIEM_TRA_HET_HAN', 'XOA_TAI_KHOAN',
                             'GIU_NOI_DUNG', 'AN_NOI_DUNG', 'SUA_HAN_MUC',
                             'TAO_THONG_BAO', 'SUA_THONG_BAO', 'XOA_THONG_BAO',
                             'DUYET_CONG_KHAI', 'TU_CHOI_CONG_KHAI', 'THU_HOI_CONG_KHAI'
            ));
