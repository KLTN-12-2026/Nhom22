CREATE TABLE chu_de
(
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    ten        VARCHAR(100) NOT NULL,
    mo_ta      VARCHAR(500) NULL,
    created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version    BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT pk_chu_de PRIMARY KEY (id),
    CONSTRAINT uk_chu_de_ten UNIQUE (ten),
    CONSTRAINT ck_chu_de_ten CHECK (CHAR_LENGTH(TRIM(ten)) > 0)
);

CREATE TABLE nhan
(
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    ten        VARCHAR(50) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version    BIGINT      NOT NULL DEFAULT 0,
    CONSTRAINT pk_nhan PRIMARY KEY (id),
    CONSTRAINT uk_nhan_ten UNIQUE (ten),
    CONSTRAINT ck_nhan_ten CHECK (CHAR_LENGTH(TRIM(ten)) > 0)
);

CREATE TABLE bo_the
(
    id                    BIGINT       NOT NULL AUTO_INCREMENT,
    chu_so_huu_id         BIGINT       NOT NULL,
    chu_de_id             BIGINT NULL,
    ten                   VARCHAR(150) NOT NULL,
    mo_ta                 VARCHAR(1000) NULL,
    trinh_do              VARCHAR(20)  NOT NULL,
    quyen_truy_cap        VARCHAR(20)  NOT NULL DEFAULT 'RIENG_TU',
    trang_thai_kiem_duyet VARCHAR(20)  NOT NULL DEFAULT 'BINH_THUONG',
    bo_nguon_id           BIGINT NULL,
    xoa_at                DATETIME(3)   NULL,
    created_at            DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at            DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version               BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT pk_bo_the PRIMARY KEY (id),
    CONSTRAINT fk_bo_the_chu_so_huu
        FOREIGN KEY (chu_so_huu_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_bo_the_chu_de
        FOREIGN KEY (chu_de_id) REFERENCES chu_de (id),
    CONSTRAINT fk_bo_the_bo_nguon
        FOREIGN KEY (bo_nguon_id) REFERENCES bo_the (id),
    CONSTRAINT ck_bo_the_ten
        CHECK (CHAR_LENGTH(TRIM(ten)) > 0),
    CONSTRAINT ck_bo_the_trinh_do
        CHECK (trinh_do IN (
                            'MOI_BAT_DAU', 'CO_BAN', 'TRUNG_CAP', 'NANG_CAO'
            )),
    CONSTRAINT ck_bo_the_quyen_truy_cap
        CHECK (quyen_truy_cap IN ('RIENG_TU', 'CONG_KHAI')),
    CONSTRAINT ck_bo_the_kiem_duyet
        CHECK (trang_thai_kiem_duyet IN ('BINH_THUONG', 'DA_AN'))
);

CREATE INDEX idx_bo_the_chu_so_huu
    ON bo_the (chu_so_huu_id, xoa_at, created_at);

CREATE INDEX idx_bo_the_cong_khai
    ON bo_the (
               quyen_truy_cap, trang_thai_kiem_duyet, chu_de_id, created_at
        );

CREATE TABLE the_tu_vung
(
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    bo_the_id  BIGINT       NOT NULL,
    tu         VARCHAR(100) NOT NULL,
    tu_loai    VARCHAR(30) NULL,
    nghia_vi   VARCHAR(500) NOT NULL,
    phien_am   VARCHAR(100) NULL,
    vi_du_en   VARCHAR(300) NULL,
    dich_vi    VARCHAR(300) NULL,
    do_kho     INT          NOT NULL DEFAULT 1,
    nguon      VARCHAR(500) NULL,
    xoa_at     DATETIME(3)  NULL,
    created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version    BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT pk_the_tu_vung PRIMARY KEY (id),
    CONSTRAINT fk_the_tu_vung_bo_the
        FOREIGN KEY (bo_the_id) REFERENCES bo_the (id),
    CONSTRAINT ck_the_tu_vung_tu
        CHECK (CHAR_LENGTH(TRIM(tu)) > 0),
    CONSTRAINT ck_the_tu_vung_nghia
        CHECK (CHAR_LENGTH(TRIM(nghia_vi)) > 0),
    CONSTRAINT ck_the_tu_vung_do_kho
        CHECK (do_kho BETWEEN 1 AND 5)
);

CREATE INDEX idx_the_tu_vung_bo_the
    ON the_tu_vung (bo_the_id, xoa_at, id);

CREATE TABLE the_nhan
(
    the_id     BIGINT NOT NULL,
    nhan_id    BIGINT NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_the_nhan PRIMARY KEY (the_id, nhan_id),
    CONSTRAINT fk_the_nhan_the
        FOREIGN KEY (the_id) REFERENCES the_tu_vung (id),
    CONSTRAINT fk_the_nhan_nhan
        FOREIGN KEY (nhan_id) REFERENCES nhan (id)
);

CREATE TABLE the_tep
(
    the_id     BIGINT      NOT NULL,
    tep_id     BIGINT      NOT NULL,
    vai_tro    VARCHAR(20) NOT NULL,
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_the_tep PRIMARY KEY (the_id, vai_tro),
    CONSTRAINT fk_the_tep_the
        FOREIGN KEY (the_id) REFERENCES the_tu_vung (id),
    CONSTRAINT fk_the_tep_tep
        FOREIGN KEY (tep_id) REFERENCES tep_tin (id),
    CONSTRAINT ck_the_tep_vai_tro
        CHECK (vai_tro IN ('ANH', 'AM_TU', 'AM_CAU'))
);

CREATE TABLE bo_yeu_thich
(
    nguoi_dung_id BIGINT NOT NULL,
    bo_the_id     BIGINT NOT NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_bo_yeu_thich
        PRIMARY KEY (nguoi_dung_id, bo_the_id),
    CONSTRAINT fk_bo_yeu_thich_nguoi_dung
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_bo_yeu_thich_bo_the
        FOREIGN KEY (bo_the_id) REFERENCES bo_the (id)
);

CREATE TABLE chu_de_yeu_thich
(
    nguoi_dung_id BIGINT NOT NULL,
    chu_de_id     BIGINT NOT NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_chu_de_yeu_thich
        PRIMARY KEY (nguoi_dung_id, chu_de_id),
    CONSTRAINT fk_chu_de_yeu_thich_nguoi_dung
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_chu_de_yeu_thich_chu_de
        FOREIGN KEY (chu_de_id) REFERENCES chu_de (id)
);