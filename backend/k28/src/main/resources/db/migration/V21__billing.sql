CREATE TABLE goi_dich_vu
(
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    ma             VARCHAR(20)  NOT NULL,
    ten            VARCHAR(50)  NOT NULL,
    gia_thang      BIGINT       NOT NULL,
    gia_nam        BIGINT       NOT NULL,
    gioi_han_the   INT          NULL,
    phat_am        BOOLEAN      NOT NULL,
    bo_mau_cao_cap BOOLEAN      NOT NULL,
    hoat_dong      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version        BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT pk_goi_dich_vu PRIMARY KEY (id),
    CONSTRAINT uk_goi_dich_vu_ma UNIQUE (ma),
    CONSTRAINT ck_goi_dich_vu_gia CHECK (gia_thang > 0 AND gia_nam > 0),
    CONSTRAINT ck_goi_dich_vu_gioi_han CHECK (gioi_han_the IS NULL OR gioi_han_the > 0)
);

INSERT INTO goi_dich_vu (ma, ten, gia_thang, gia_nam, gioi_han_the, phat_am, bo_mau_cao_cap)
VALUES ('PRO', 'Pro', 299000, 2990000, 5000, TRUE, FALSE),
       ('PREMIUM', 'Premium', 999000, 9990000, NULL, TRUE, TRUE);

CREATE TABLE dang_ky_goi
(
    id                 BIGINT      NOT NULL AUTO_INCREMENT,
    nguoi_dung_id      BIGINT      NOT NULL,
    goi_ma             VARCHAR(20) NOT NULL,
    bat_dau_at         DATETIME(3) NOT NULL,
    het_han_at         DATETIME(3) NOT NULL,
    trang_thai         VARCHAR(20) NOT NULL,
    nguoi_dung_hieu_luc BIGINT GENERATED ALWAYS AS (CASE WHEN trang_thai = 'HIEU_LUC' THEN nguoi_dung_id END) STORED,
    created_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version            BIGINT      NOT NULL DEFAULT 0,
    CONSTRAINT pk_dang_ky_goi PRIMARY KEY (id),
    CONSTRAINT uk_dang_ky_goi_hieu_luc UNIQUE (nguoi_dung_hieu_luc),
    CONSTRAINT fk_dang_ky_goi_nguoi FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_dang_ky_goi_goi FOREIGN KEY (goi_ma) REFERENCES goi_dich_vu (ma),
    CONSTRAINT ck_dang_ky_goi_trang_thai CHECK (trang_thai IN ('HIEU_LUC', 'HET_HAN')),
    CONSTRAINT ck_dang_ky_goi_thoi_gian CHECK (het_han_at > bat_dau_at)
);

CREATE INDEX ix_dang_ky_goi_trang_thai_het_han ON dang_ky_goi (trang_thai, het_han_at);
CREATE INDEX ix_dang_ky_goi_nguoi_het_han ON dang_ky_goi (nguoi_dung_id, het_han_at);

CREATE TABLE giao_dich_thanh_toan
(
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    ma_don            VARCHAR(30)  NOT NULL,
    nguoi_dung_id     BIGINT       NOT NULL,
    goi_ma            VARCHAR(20)  NOT NULL,
    chu_ky            VARCHAR(10)  NOT NULL,
    so_tien           BIGINT       NOT NULL,
    cong              VARCHAR(20)  NOT NULL,
    trang_thai        VARCHAR(20)  NOT NULL,
    ma_giao_dich_cong VARCHAR(50)  NULL,
    ma_phan_hoi       VARCHAR(10)  NULL,
    du_lieu_cong_json JSON         NULL,
    tao_at            DATETIME(3)  NOT NULL,
    hoan_tat_at       DATETIME(3)  NULL,
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version           BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT pk_giao_dich_thanh_toan PRIMARY KEY (id),
    CONSTRAINT uk_giao_dich_ma_don UNIQUE (ma_don),
    CONSTRAINT fk_giao_dich_nguoi FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_giao_dich_goi FOREIGN KEY (goi_ma) REFERENCES goi_dich_vu (ma),
    CONSTRAINT ck_giao_dich_chu_ky CHECK (chu_ky IN ('THANG', 'NAM')),
    CONSTRAINT ck_giao_dich_cong CHECK (cong IN ('VNPAY', 'MO_PHONG')),
    CONSTRAINT ck_giao_dich_trang_thai CHECK (trang_thai IN ('CHO_THANH_TOAN', 'THANH_CONG', 'THAT_BAI', 'HET_HAN')),
    CONSTRAINT ck_giao_dich_so_tien CHECK (so_tien > 0)
);

CREATE INDEX ix_giao_dich_nguoi_tao ON giao_dich_thanh_toan (nguoi_dung_id, tao_at);
CREATE INDEX ix_giao_dich_trang_thai_tao ON giao_dich_thanh_toan (trang_thai, tao_at);
