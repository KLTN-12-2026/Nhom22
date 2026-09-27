CREATE TABLE nguoi_dung (
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    email              VARCHAR(255) NOT NULL,
    ten_hien_thi       VARCHAR(100) NOT NULL,
    anh_dai_dien_id    BIGINT       NULL,
    trang_thai         VARCHAR(20)  NOT NULL DEFAULT 'CHUA_XAC_THUC',
    password_hash      VARCHAR(100) NULL,
    mui_gio            VARCHAR(50)  NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    email_xac_thuc_at  DATETIME(3)  NULL,
    dang_nhap_cuoi_at  DATETIME(3)  NULL,
    created_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version            BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT pk_nguoi_dung PRIMARY KEY (id),
    CONSTRAINT uk_nguoi_dung_email UNIQUE (email),
    CONSTRAINT ck_nguoi_dung_trang_thai CHECK (trang_thai IN ('CHUA_XAC_THUC', 'HOAT_DONG', 'BI_KHOA', 'DANG_XOA'))
);

CREATE TABLE vai_tro (
    id   BIGINT       NOT NULL AUTO_INCREMENT,
    ma   VARCHAR(30)  NOT NULL,
    ten  VARCHAR(100) NOT NULL,
    CONSTRAINT pk_vai_tro PRIMARY KEY (id),
    CONSTRAINT uk_vai_tro_ma UNIQUE (ma)
);

CREATE TABLE nguoi_dung_vai_tro (
    nguoi_dung_id BIGINT      NOT NULL,
    vai_tro_id    BIGINT      NOT NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_nguoi_dung_vai_tro PRIMARY KEY (nguoi_dung_id, vai_tro_id),
    CONSTRAINT fk_ndvt_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_ndvt_vai_tro FOREIGN KEY (vai_tro_id) REFERENCES vai_tro (id)
);

CREATE TABLE danh_tinh_oauth (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    nguoi_dung_id BIGINT       NOT NULL,
    nha_cung_cap  VARCHAR(20)  NOT NULL,
    subject       VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NULL,
    created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_danh_tinh_oauth PRIMARY KEY (id),
    CONSTRAINT uk_danh_tinh_oauth UNIQUE (nha_cung_cap, subject),
    CONSTRAINT fk_dto_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_dto_nha_cung_cap CHECK (nha_cung_cap IN ('GOOGLE'))
);

CREATE TABLE token_tai_khoan (
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    nguoi_dung_id BIGINT      NOT NULL,
    token_hash    CHAR(64)    NOT NULL,
    loai          VARCHAR(30) NOT NULL,
    het_han_at    DATETIME(3) NOT NULL,
    da_dung_at    DATETIME(3) NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_token_tai_khoan PRIMARY KEY (id),
    CONSTRAINT uk_token_tai_khoan_hash UNIQUE (token_hash),
    CONSTRAINT fk_ttk_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_ttk_loai CHECK (loai IN ('XAC_THUC_EMAIL', 'DAT_LAI_MAT_KHAU')),
    INDEX idx_ttk_nguoi_dung_loai (nguoi_dung_id, loai)
);

CREATE TABLE ho_so_hoc_tap (
    nguoi_dung_id          BIGINT      NOT NULL,
    trinh_do               VARCHAR(20) NULL,
    muc_tieu               VARCHAR(20) NULL,
    phut_moi_ngay          INT         NOT NULL DEFAULT 10,
    tu_moi_moi_ngay        INT         NOT NULL DEFAULT 10,
    da_hoan_tat_khoi_dau   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at             DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version                BIGINT      NOT NULL DEFAULT 0,
    CONSTRAINT pk_ho_so_hoc_tap PRIMARY KEY (nguoi_dung_id),
    CONSTRAINT fk_hsht_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_hsht_trinh_do CHECK (trinh_do IN ('MOI_BAT_DAU', 'CO_BAN', 'TRUNG_CAP', 'NANG_CAO')),
    CONSTRAINT ck_hsht_muc_tieu CHECK (muc_tieu IN ('GIAO_TIEP', 'TOEIC')),
    CONSTRAINT ck_hsht_phut CHECK (phut_moi_ngay BETWEEN 1 AND 240),
    CONSTRAINT ck_hsht_tu_moi CHECK (tu_moi_moi_ngay BETWEEN 0 AND 100)
);

CREATE TABLE cai_dat_thong_bao (
    nguoi_dung_id        BIGINT      NOT NULL,
    nhan_trong_ung_dung  BOOLEAN     NOT NULL DEFAULT TRUE,
    nhan_email           BOOLEAN     NOT NULL DEFAULT TRUE,
    nhac_hoc             BOOLEAN     NOT NULL DEFAULT TRUE,
    gio_nhac             TIME        NULL,
    created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version              BIGINT      NOT NULL DEFAULT 0,
    CONSTRAINT pk_cai_dat_thong_bao PRIMARY KEY (nguoi_dung_id),
    CONSTRAINT fk_cdtb_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id)
);

INSERT INTO vai_tro (ma, ten) VALUES
    ('USER', 'Người học'),
    ('ADMIN', 'Quản trị viên');
