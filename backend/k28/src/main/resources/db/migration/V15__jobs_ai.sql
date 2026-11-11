CREATE TABLE tac_vu_nen
(
    id          BIGINT      NOT NULL AUTO_INCREMENT,
    loai        VARCHAR(30) NOT NULL,
    payload_json JSON       NOT NULL,
    trang_thai  VARCHAR(20) NOT NULL DEFAULT 'CHO',
    retry_count INT         NOT NULL DEFAULT 0,
    max_retry   INT         NOT NULL DEFAULT 3,
    next_run_at DATETIME(3) NOT NULL,
    khoa_boi    VARCHAR(64) NULL,
    khoa_den_at DATETIME(3) NULL,
    ma_loi      VARCHAR(50) NULL,
    created_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_tac_vu_nen PRIMARY KEY (id),
    CONSTRAINT ck_tac_vu_nen_trang_thai
        CHECK (trang_thai IN ('CHO', 'DANG_CHAY', 'XONG', 'LOI', 'KHONG_XAC_DINH')),
    CONSTRAINT ck_tac_vu_nen_retry
        CHECK (retry_count >= 0 AND max_retry >= 0)
);

CREATE INDEX idx_tac_vu_nen_hang_doi
    ON tac_vu_nen (trang_thai, next_run_at, id);

CREATE INDEX idx_tac_vu_nen_khoa
    ON tac_vu_nen (trang_thai, khoa_den_at);

CREATE TABLE han_muc_dich_vu
(
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    goi_ma       VARCHAR(20) NOT NULL,
    loai         VARCHAR(20) NOT NULL,
    so_luot_ngay INT         NOT NULL,
    created_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at   DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version      BIGINT      NOT NULL DEFAULT 0,
    CONSTRAINT pk_han_muc_dich_vu PRIMARY KEY (id),
    CONSTRAINT uk_han_muc_goi_loai UNIQUE (goi_ma, loai),
    CONSTRAINT ck_han_muc_loai CHECK (loai IN ('AI', 'ANH')),
    CONSTRAINT ck_han_muc_so_luot CHECK (so_luot_ngay >= 0)
);

INSERT INTO han_muc_dich_vu (goi_ma, loai, so_luot_ngay)
VALUES ('PRO', 'AI', 20),
       ('PRO', 'ANH', 10),
       ('PREMIUM', 'AI', 100),
       ('PREMIUM', 'ANH', 30);

CREATE TABLE su_dung_dich_vu
(
    id             BIGINT         NOT NULL AUTO_INCREMENT,
    nguoi_dung_id  BIGINT         NOT NULL,
    ngay           DATE           NOT NULL,
    loai           VARCHAR(20)    NOT NULL,
    so_giu         INT            NOT NULL DEFAULT 0,
    so_dung        INT            NOT NULL DEFAULT 0,
    token_vao      BIGINT         NULL,
    token_ra       BIGINT         NULL,
    chi_phi        DECIMAL(12, 4) NULL,
    nguon_dinh_gia VARCHAR(100)   NULL,
    created_at     DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at     DATETIME(3)    NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version        BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT pk_su_dung_dich_vu PRIMARY KEY (id),
    CONSTRAINT fk_su_dung_dv_nguoi
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT uk_su_dung_dv_nguoi_ngay_loai UNIQUE (nguoi_dung_id, ngay, loai),
    CONSTRAINT ck_su_dung_dv_loai CHECK (loai IN ('AI', 'ANH')),
    CONSTRAINT ck_su_dung_dv_so CHECK (so_giu >= 0 AND so_dung >= 0)
);

CREATE INDEX idx_su_dung_dv_ngay
    ON su_dung_dich_vu (ngay, loai);

CREATE TABLE yeu_cau_ai
(
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    nguoi_dung_id      BIGINT       NOT NULL,
    loai               VARCHAR(20)  NOT NULL,
    trang_thai         VARCHAR(20)  NOT NULL DEFAULT 'CHO',
    input_ref          VARCHAR(100) NULL,
    ket_qua_json       JSON         NULL,
    phien_ban_prompt   VARCHAR(20)  NULL,
    provider_request_id VARCHAR(100) NULL,
    nha_cung_cap       VARCHAR(30)  NULL,
    model              VARCHAR(60)  NULL,
    thoi_luong_ms      INT          NULL,
    token_vao          INT          NULL,
    token_ra           INT          NULL,
    ma_loi             VARCHAR(50)  NULL,
    han_muc_loai       VARCHAR(20)  NULL,
    han_muc_ngay       DATE         NULL,
    han_muc_trang_thai VARCHAR(10)  NOT NULL DEFAULT 'GIU_CHO',
    created_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_yeu_cau_ai PRIMARY KEY (id),
    CONSTRAINT fk_yeu_cau_ai_nguoi
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_yeu_cau_ai_loai
        CHECK (loai IN ('TAO_THE', 'NGU_CANH', 'SUA_CAU', 'ANH_THE')),
    CONSTRAINT ck_yeu_cau_ai_trang_thai
        CHECK (trang_thai IN ('CHO', 'DANG_XU_LY', 'HOAN_TAT', 'LOI', 'KHONG_XAC_DINH')),
    CONSTRAINT ck_yeu_cau_ai_han_muc_loai
        CHECK (han_muc_loai IS NULL OR han_muc_loai IN ('AI', 'ANH')),
    CONSTRAINT ck_yeu_cau_ai_han_muc_tt
        CHECK (han_muc_trang_thai IN ('GIU_CHO', 'DA_DUNG', 'DA_HOAN'))
);

CREATE INDEX idx_yeu_cau_ai_nguoi_ngay
    ON yeu_cau_ai (nguoi_dung_id, created_at, id);

CREATE TABLE ban_nhap_the_ai
(
    id               BIGINT      NOT NULL AUTO_INCREMENT,
    yeu_cau_id       BIGINT      NOT NULL,
    thu_tu           INT         NOT NULL,
    noi_dung_json    JSON        NOT NULL,
    trang_thai_duyet VARCHAR(20) NOT NULL DEFAULT 'CHO_DUYET',
    the_da_luu_id    BIGINT      NULL,
    anh_id           BIGINT      NULL,
    created_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at       DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_ban_nhap_the_ai PRIMARY KEY (id),
    CONSTRAINT fk_ban_nhap_yeu_cau
        FOREIGN KEY (yeu_cau_id) REFERENCES yeu_cau_ai (id),
    CONSTRAINT fk_ban_nhap_the
        FOREIGN KEY (the_da_luu_id) REFERENCES the_tu_vung (id),
    CONSTRAINT fk_ban_nhap_anh
        FOREIGN KEY (anh_id) REFERENCES tep_tin (id),
    CONSTRAINT uk_ban_nhap_yeu_cau_thu_tu UNIQUE (yeu_cau_id, thu_tu),
    CONSTRAINT ck_ban_nhap_duyet
        CHECK (trang_thai_duyet IN ('CHO_DUYET', 'DA_LUU', 'BO_QUA'))
);