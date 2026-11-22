ALTER TABLE goi_dich_vu DROP CHECK ck_goi_dich_vu_gia;

ALTER TABLE goi_dich_vu
    ADD CONSTRAINT ck_goi_dich_vu_gia
        CHECK ((ma = 'FREE' AND gia_thang = 0 AND gia_nam = 0) OR (ma <> 'FREE' AND gia_thang > 0 AND gia_nam > 0));

INSERT INTO goi_dich_vu (ma, ten, gia_thang, gia_nam, gioi_han_the, phat_am, bo_mau_cao_cap)
VALUES ('FREE', 'Free', 0, 0, 300, TRUE, FALSE);

UPDATE goi_dich_vu SET gia_thang = 79000, gia_nam = 599000, version = version + 1 WHERE ma = 'PRO';
UPDATE goi_dich_vu SET gia_thang = 129000, gia_nam = 999000, version = version + 1 WHERE ma = 'PREMIUM';

INSERT INTO han_muc_dich_vu (goi_ma, loai, so_luot_ngay)
VALUES ('FREE', 'AI', 3),
       ('FREE', 'ANH', 0),
       ('FREE', 'TTS', 20),
       ('FREE', 'PHAT_AM', 3);

UPDATE han_muc_dich_vu
SET so_luot_ngay = CASE CONCAT(goi_ma, ':', loai)
                       WHEN 'PRO:AI' THEN 20
                       WHEN 'PRO:ANH' THEN 3
                       WHEN 'PRO:TTS' THEN 150
                       WHEN 'PRO:PHAT_AM' THEN 30
                       WHEN 'PREMIUM:AI' THEN 60
                       WHEN 'PREMIUM:ANH' THEN 10
                       WHEN 'PREMIUM:TTS' THEN 500
                       WHEN 'PREMIUM:PHAT_AM' THEN 100
                       ELSE so_luot_ngay END,
    version      = version + 1
WHERE goi_ma IN ('PRO', 'PREMIUM');

ALTER TABLE dang_ky_goi
    ADD COLUMN nguon VARCHAR(20) NOT NULL DEFAULT 'MUA',
    ADD CONSTRAINT ck_dang_ky_goi_nguon CHECK (nguon IN ('MUA', 'DUNG_THU', 'HSSV'));

CREATE TABLE khuyen_mai
(
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    ma             VARCHAR(30)  NULL,
    ten            VARCHAR(100) NOT NULL,
    loai_giam      VARCHAR(20)  NOT NULL,
    gia_tri        BIGINT       NOT NULL,
    goi_ma         VARCHAR(20)  NULL,
    chu_ky         VARCHAR(10)  NULL,
    bat_dau_at     DATETIME(3)  NOT NULL,
    ket_thuc_at    DATETIME(3)  NOT NULL,
    tong_luot      INT          NULL,
    luot_moi_nguoi INT          NOT NULL DEFAULT 1,
    chi_lan_dau    BOOLEAN      NOT NULL DEFAULT FALSE,
    hoat_dong      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version        BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT pk_khuyen_mai PRIMARY KEY (id),
    CONSTRAINT uk_khuyen_mai_ma UNIQUE (ma),
    CONSTRAINT fk_khuyen_mai_goi FOREIGN KEY (goi_ma) REFERENCES goi_dich_vu (ma),
    CONSTRAINT ck_khuyen_mai_loai CHECK (loai_giam IN ('PHAN_TRAM', 'SO_TIEN')),
    CONSTRAINT ck_khuyen_mai_gia_tri CHECK (gia_tri > 0 AND (loai_giam <> 'PHAN_TRAM' OR gia_tri <= 100)),
    CONSTRAINT ck_khuyen_mai_chu_ky CHECK (chu_ky IS NULL OR chu_ky IN ('THANG', 'NAM')),
    CONSTRAINT ck_khuyen_mai_thoi_gian CHECK (ket_thuc_at > bat_dau_at),
    CONSTRAINT ck_khuyen_mai_luot CHECK ((tong_luot IS NULL OR tong_luot > 0) AND luot_moi_nguoi > 0)
);

CREATE INDEX ix_khuyen_mai_hieu_luc ON khuyen_mai (hoat_dong, bat_dau_at, ket_thuc_at);

ALTER TABLE giao_dich_thanh_toan
    ADD COLUMN gia_goc        BIGINT      NULL,
    ADD COLUMN giam_gia       BIGINT      NOT NULL DEFAULT 0,
    ADD COLUMN khau_tru       BIGINT      NOT NULL DEFAULT 0,
    ADD COLUMN khuyen_mai_id  BIGINT      NULL,
    ADD COLUMN ma_khuyen_mai  VARCHAR(30) NULL,
    ADD COLUMN uu_dai_hssv    BOOLEAN     NOT NULL DEFAULT FALSE,
    ADD COLUMN nang_cap       BOOLEAN     NOT NULL DEFAULT FALSE;

UPDATE giao_dich_thanh_toan SET gia_goc = so_tien;

ALTER TABLE giao_dich_thanh_toan
    MODIFY gia_goc BIGINT NOT NULL DEFAULT (so_tien),
    ADD CONSTRAINT fk_giao_dich_khuyen_mai FOREIGN KEY (khuyen_mai_id) REFERENCES khuyen_mai (id),
    ADD CONSTRAINT ck_giao_dich_giam CHECK (giam_gia >= 0 AND khau_tru >= 0 AND so_tien <= gia_goc);

CREATE INDEX ix_giao_dich_khuyen_mai ON giao_dich_thanh_toan (khuyen_mai_id, trang_thai, nguoi_dung_id);

CREATE TABLE chuong_trinh_uu_dai
(
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    ma             VARCHAR(20)  NOT NULL,
    goi_ma         VARCHAR(20)  NOT NULL,
    phan_tram_giam INT          NOT NULL,
    so_ngay        INT          NOT NULL,
    so_suat_toi_da INT          NULL,
    ten_mien       VARCHAR(1000) NULL,
    hoat_dong      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version        BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT pk_chuong_trinh_uu_dai PRIMARY KEY (id),
    CONSTRAINT uk_chuong_trinh_uu_dai_ma UNIQUE (ma),
    CONSTRAINT fk_chuong_trinh_uu_dai_goi FOREIGN KEY (goi_ma) REFERENCES goi_dich_vu (ma),
    CONSTRAINT ck_ctud_ma CHECK (ma IN ('DUNG_THU', 'HSSV')),
    CONSTRAINT ck_ctud_phan_tram CHECK (phan_tram_giam BETWEEN 1 AND 100),
    CONSTRAINT ck_ctud_so_ngay CHECK (so_ngay BETWEEN 1 AND 730),
    CONSTRAINT ck_ctud_so_suat CHECK (so_suat_toi_da IS NULL OR so_suat_toi_da > 0)
);

INSERT INTO chuong_trinh_uu_dai (ma, goi_ma, phan_tram_giam, so_ngay, so_suat_toi_da, ten_mien)
VALUES ('DUNG_THU', 'PREMIUM', 100, 7, NULL, NULL),
       ('HSSV', 'PRO', 100, 180, NULL, 'edu.vn');

CREATE TABLE xac_minh_hssv
(
    id                 BIGINT        NOT NULL AUTO_INCREMENT,
    nguoi_dung_id      BIGINT        NOT NULL,
    phuong_thuc        VARCHAR(20)   NOT NULL,
    tep_the_id         BIGINT        NULL,
    ten_truong         VARCHAR(150)  NULL,
    trang_thai         VARCHAR(20)   NOT NULL,
    ly_do_tu_choi      VARCHAR(500)  NULL,
    duyet_boi          BIGINT        NULL,
    duyet_at           DATETIME(3)   NULL,
    het_han_at         DATETIME(3)   NULL,
    da_nhan_uu_dai_at  DATETIME(3)   NULL,
    created_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version            BIGINT        NOT NULL DEFAULT 0,
    CONSTRAINT pk_xac_minh_hssv PRIMARY KEY (id),
    CONSTRAINT fk_xmhssv_nguoi FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_xmhssv_tep FOREIGN KEY (tep_the_id) REFERENCES tep_tin (id),
    CONSTRAINT fk_xmhssv_duyet FOREIGN KEY (duyet_boi) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_xmhssv_phuong_thuc CHECK (phuong_thuc IN ('EMAIL', 'ANH_THE')),
    CONSTRAINT ck_xmhssv_trang_thai CHECK (trang_thai IN ('CHO_DUYET', 'DA_DUYET', 'TU_CHOI')),
    CONSTRAINT ck_xmhssv_anh CHECK (phuong_thuc <> 'ANH_THE' OR tep_the_id IS NOT NULL)
);

CREATE INDEX ix_xmhssv_nguoi ON xac_minh_hssv (nguoi_dung_id, id);
CREATE INDEX ix_xmhssv_trang_thai ON xac_minh_hssv (trang_thai, id);

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
                             'TAO_THONG_BAO', 'SUA_THONG_BAO', 'XOA_THONG_BAO',
                             'DUYET_CONG_KHAI', 'TU_CHOI_CONG_KHAI', 'THU_HOI_CONG_KHAI',
                             'TAO_HUY_HIEU', 'SUA_HUY_HIEU', 'TAO_THU_THACH', 'SUA_THU_THACH',
                             'TAO_KHUYEN_MAI', 'SUA_KHUYEN_MAI', 'SUA_UU_DAI', 'DUYET_HSSV', 'TU_CHOI_HSSV'
            )),
    ADD CONSTRAINT ck_nkqt_loai_doi_tuong
        CHECK (loai_doi_tuong IN ('NGUOI_DUNG', 'BO_THE', 'THE_TU_VUNG', 'GOI_DICH_VU', 'DANG_KY_GOI',
                                  'YEU_CAU_AI', 'HAN_MUC_DICH_VU', 'THONG_BAO_HE_THONG',
                                  'HUY_HIEU', 'THU_THACH', 'KHUYEN_MAI', 'CHUONG_TRINH_UU_DAI', 'XAC_MINH_HSSV'));
