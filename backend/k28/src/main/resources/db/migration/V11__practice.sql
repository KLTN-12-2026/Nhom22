CREATE TABLE bai_luyen
(
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    nguoi_dung_id   BIGINT      NOT NULL,
    loai_bai        VARCHAR(30) NOT NULL,
    bo_the_id       BIGINT      NULL,
    nguon           VARCHAR(10) NOT NULL DEFAULT 'BO_THE',
    so_cau_yeu_cau  INT         NOT NULL,
    la_luyen_lai    BOOLEAN     NOT NULL DEFAULT FALSE,
    bai_goc_id      BIGINT      NULL,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_bai_luyen PRIMARY KEY (id),
    CONSTRAINT fk_bai_luyen_nguoi
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_bai_luyen_bo_the
        FOREIGN KEY (bo_the_id) REFERENCES bo_the (id),
    CONSTRAINT fk_bai_luyen_bai_goc
        FOREIGN KEY (bai_goc_id) REFERENCES bai_luyen (id),
    CONSTRAINT ck_bai_luyen_loai
        CHECK (loai_bai IN ('CHON_NGHIA', 'CHON_TU', 'GHEP_TU', 'DIEN_CHO_TRONG',
                            'NHAP_TU_THEO_NGHIA', 'NGHE_VIET', 'PHAN_BIET_CAP', 'TONG_HOP')),
    CONSTRAINT ck_bai_luyen_nguon
        CHECK (nguon IN ('BO_THE', 'SO_TAY')),
    CONSTRAINT ck_bai_luyen_so_cau
        CHECK (so_cau_yeu_cau IN (5, 10, 20))
);

CREATE INDEX idx_bai_luyen_nguoi_ngay
    ON bai_luyen (nguoi_dung_id, created_at);

CREATE TABLE cau_hoi_bai_luyen
(
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    bai_id          BIGINT      NOT NULL,
    thu_tu          INT         NOT NULL,
    loai_cau        VARCHAR(30) NOT NULL,
    the_id          BIGINT      NULL,
    de_bai_json     JSON        NOT NULL,
    phuong_an_json  JSON        NULL,
    dap_an_json     JSON        NOT NULL,
    giai_thich_json JSON        NOT NULL,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_cau_hoi_bai_luyen PRIMARY KEY (id),
    CONSTRAINT uk_cau_hoi_bai_luyen_thu_tu
        UNIQUE (bai_id, thu_tu),
    CONSTRAINT fk_cau_hoi_bai_luyen_bai
        FOREIGN KEY (bai_id) REFERENCES bai_luyen (id),
    CONSTRAINT fk_cau_hoi_bai_luyen_the
        FOREIGN KEY (the_id) REFERENCES the_tu_vung (id),
    CONSTRAINT ck_cau_hoi_bai_luyen_loai
        CHECK (loai_cau IN ('CHON_NGHIA', 'CHON_TU', 'GHEP_TU', 'DIEN_CHO_TRONG',
                            'NHAP_TU_THEO_NGHIA', 'NGHE_VIET', 'PHAN_BIET_CAP')),
    CONSTRAINT ck_cau_hoi_bai_luyen_thu_tu
        CHECK (thu_tu >= 1)
);

CREATE TABLE lan_lam_bai
(
    id            BIGINT                                             NOT NULL AUTO_INCREMENT,
    nguoi_dung_id BIGINT                                             NOT NULL,
    bai_id        BIGINT                                             NOT NULL,
    submit_key    VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    so_cau_dung   INT                                                NOT NULL,
    tong_so_cau   INT                                                NOT NULL,
    diem          INT                                                NOT NULL,
    thoi_gian     INT                                                NOT NULL,
    nop_at        DATETIME(3)                                        NOT NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_lan_lam_bai PRIMARY KEY (id),
    CONSTRAINT uk_lan_lam_bai_nguoi_submit
        UNIQUE (nguoi_dung_id, submit_key),
    CONSTRAINT uk_lan_lam_bai_bai
        UNIQUE (bai_id),
    CONSTRAINT fk_lan_lam_bai_nguoi
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_lan_lam_bai_bai
        FOREIGN KEY (bai_id) REFERENCES bai_luyen (id),
    CONSTRAINT ck_lan_lam_bai_submit_key
        CHECK (CHAR_LENGTH(TRIM(submit_key)) BETWEEN 1 AND 128),
    CONSTRAINT ck_lan_lam_bai_so_cau
        CHECK (so_cau_dung >= 0 AND tong_so_cau >= so_cau_dung),
    CONSTRAINT ck_lan_lam_bai_diem
        CHECK (diem BETWEEN 0 AND 100),
    CONSTRAINT ck_lan_lam_bai_thoi_gian
        CHECK (thoi_gian >= 0)
);

CREATE INDEX idx_lan_lam_bai_nguoi_nop
    ON lan_lam_bai (nguoi_dung_id, nop_at);

CREATE TABLE tra_loi_bai_luyen
(
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    lan_lam_id  BIGINT      NOT NULL,
    cau_hoi_id  BIGINT      NOT NULL,
    tra_loi_json JSON       NULL,
    dung        BOOLEAN     NOT NULL,
    ket_qua_json JSON       NOT NULL,
    created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_tra_loi_bai_luyen PRIMARY KEY (id),
    CONSTRAINT uk_tra_loi_bai_luyen_cau
        UNIQUE (lan_lam_id, cau_hoi_id),
    CONSTRAINT fk_tra_loi_bai_luyen_lan
        FOREIGN KEY (lan_lam_id) REFERENCES lan_lam_bai (id),
    CONSTRAINT fk_tra_loi_bai_luyen_cau
        FOREIGN KEY (cau_hoi_id) REFERENCES cau_hoi_bai_luyen (id)
);

CREATE TABLE loi_hoc_tap
(
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    nguoi_dung_id   BIGINT      NOT NULL,
    the_id          BIGINT      NOT NULL,
    nhom_loi        VARCHAR(20) NOT NULL,
    nguon_su_kien   VARCHAR(30) NOT NULL,
    su_kien_id      BIGINT      NULL,
    bang_chung_json JSON        NOT NULL,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_loi_hoc_tap PRIMARY KEY (id),
    CONSTRAINT fk_loi_hoc_tap_nguoi
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_loi_hoc_tap_the
        FOREIGN KEY (the_id) REFERENCES the_tu_vung (id),
    CONSTRAINT ck_loi_hoc_tap_nhom
        CHECK (nhom_loi IN ('NGHIA', 'CHINH_TA', 'NGHE', 'NGU_CANH', 'CAP_NHAM', 'PHAT_AM'))
);

CREATE INDEX idx_loi_hoc_tap_nguoi_the
    ON loi_hoc_tap (nguoi_dung_id, the_id, created_at);

CREATE INDEX idx_loi_hoc_tap_nguoi_nhom
    ON loi_hoc_tap (nguoi_dung_id, nhom_loi, created_at);

CREATE TABLE so_tay_tu_kho
(
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    nguoi_dung_id     BIGINT       NOT NULL,
    the_id            BIGINT       NOT NULL,
    ghi_chu           VARCHAR(500) NULL,
    danh_dau_thu_cong BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at        DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version           BIGINT       NOT NULL DEFAULT 0,
    CONSTRAINT pk_so_tay_tu_kho PRIMARY KEY (id),
    CONSTRAINT uk_so_tay_tu_kho_nguoi_the
        UNIQUE (nguoi_dung_id, the_id),
    CONSTRAINT fk_so_tay_tu_kho_nguoi
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_so_tay_tu_kho_the
        FOREIGN KEY (the_id) REFERENCES the_tu_vung (id)
);

CREATE TABLE cap_tu_de_nham
(
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    nguoi_dung_id BIGINT      NOT NULL,
    the_1_id      BIGINT      NOT NULL,
    the_2_id      BIGINT      NOT NULL,
    so_lan_nham   INT         NOT NULL DEFAULT 0,
    lan_cuoi_at   DATETIME(3) NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_cap_tu_de_nham PRIMARY KEY (id),
    CONSTRAINT uk_cap_tu_de_nham_nguoi_cap
        UNIQUE (nguoi_dung_id, the_1_id, the_2_id),
    CONSTRAINT fk_cap_tu_de_nham_nguoi
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_cap_tu_de_nham_the_1
        FOREIGN KEY (the_1_id) REFERENCES the_tu_vung (id),
    CONSTRAINT fk_cap_tu_de_nham_the_2
        FOREIGN KEY (the_2_id) REFERENCES the_tu_vung (id),
    CONSTRAINT ck_cap_tu_de_nham_thu_tu
        CHECK (the_1_id < the_2_id),
    CONSTRAINT ck_cap_tu_de_nham_so_lan
        CHECK (so_lan_nham >= 0)
);
