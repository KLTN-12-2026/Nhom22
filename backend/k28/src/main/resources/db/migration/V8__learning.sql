CREATE TABLE tien_do_the
(
    id               BIGINT         NOT NULL AUTO_INCREMENT,
    nguoi_dung_id    BIGINT         NOT NULL,
    the_id           BIGINT         NOT NULL,
    chieu_hoc        VARCHAR(10)    NOT NULL,
    trang_thai       VARCHAR(20)    NOT NULL DEFAULT 'MOI',
    buoc_hoc         INT            NOT NULL DEFAULT 0,
    ef               DECIMAL(10, 2) NOT NULL DEFAULT 2.50,
    khoang_on_ngay   INT            NOT NULL DEFAULT 0,
    chuoi_thanh_cong INT            NOT NULL DEFAULT 0,
    so_lan_quen      INT            NOT NULL DEFAULT 0,
    han_on_at        DATETIME(3)   NULL,
    created_at       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at       DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version          BIGINT         NOT NULL DEFAULT 0,
    CONSTRAINT pk_tien_do_the PRIMARY KEY (id),
    CONSTRAINT uk_tien_do_the_nguoi_the_chieu
        UNIQUE (nguoi_dung_id, the_id, chieu_hoc),
    CONSTRAINT fk_tien_do_the_nguoi
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_tien_do_the_the
        FOREIGN KEY (the_id) REFERENCES the_tu_vung (id),
    CONSTRAINT ck_tien_do_the_chieu
        CHECK (chieu_hoc IN ('EN_VI', 'VI_EN')),
    CONSTRAINT ck_tien_do_the_trang_thai
        CHECK (trang_thai IN (
                              'MOI', 'DANG_HOC', 'ON_TAP', 'HOC_LAI', 'TAM_NGUNG'
            )),
    CONSTRAINT ck_tien_do_the_buoc
        CHECK (buoc_hoc BETWEEN 0 AND 1),
    CONSTRAINT ck_tien_do_the_ef
        CHECK (ef >= 1.30),
    CONSTRAINT ck_tien_do_the_khoang
        CHECK (khoang_on_ngay BETWEEN 0 AND 365),
    CONSTRAINT ck_tien_do_the_dem
        CHECK (chuoi_thanh_cong >= 0 AND so_lan_quen >= 0),
    CONSTRAINT ck_tien_do_the_version
        CHECK (version >= 0),
    CONSTRAINT ck_tien_do_the_han
        CHECK (
            trang_thai IN ('MOI', 'TAM_NGUNG')
                OR han_on_at IS NOT NULL
            )
);

CREATE INDEX idx_tien_do_the_hang_doi
    ON tien_do_the (nguoi_dung_id, trang_thai, han_on_at);

CREATE TABLE phien_hoc
(
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    nguoi_dung_id BIGINT      NOT NULL,
    chieu_hoc     VARCHAR(10) NOT NULL,
    mui_gio       VARCHAR(50) NOT NULL,
    bat_dau_at    DATETIME(3) NOT NULL,
    ket_thuc_at   DATETIME(3) NULL,
    trang_thai    VARCHAR(20) NOT NULL DEFAULT 'DANG_HOC',
    quy_thoi_gian INT         NOT NULL,
    created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version       BIGINT      NOT NULL DEFAULT 0,
    CONSTRAINT pk_phien_hoc PRIMARY KEY (id),
    CONSTRAINT fk_phien_hoc_nguoi
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_phien_hoc_chieu
        CHECK (chieu_hoc IN ('EN_VI', 'VI_EN')),
    CONSTRAINT ck_phien_hoc_mui_gio
        CHECK (CHAR_LENGTH(TRIM(mui_gio)) > 0),
    CONSTRAINT ck_phien_hoc_quy
        CHECK (quy_thoi_gian IN (5, 10, 20)),
    CONSTRAINT ck_phien_hoc_version
        CHECK (version >= 0),
    CONSTRAINT ck_phien_hoc_trang_thai
        CHECK (
            (trang_thai = 'DANG_HOC' AND ket_thuc_at IS NULL)
                OR (
                trang_thai = 'KET_THUC'
                    AND ket_thuc_at IS NOT NULL
                    AND ket_thuc_at >= bat_dau_at
                )
            )
);

CREATE INDEX idx_phien_hoc_nguoi_bat_dau
    ON phien_hoc (nguoi_dung_id, bat_dau_at);

CREATE TABLE phien_hoc_the
(
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    phien_id   BIGINT      NOT NULL,
    the_id     BIGINT      NOT NULL,
    chieu_hoc  VARCHAR(10) NOT NULL,
    thu_tu     INT         NOT NULL,
    trang_thai VARCHAR(20) NOT NULL DEFAULT 'CHUA_TRA_LOI',
    created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_phien_hoc_the PRIMARY KEY (id),
    CONSTRAINT uk_phien_hoc_the_the
        UNIQUE (phien_id, the_id, chieu_hoc),
    CONSTRAINT uk_phien_hoc_the_thu_tu
        UNIQUE (phien_id, thu_tu),
    CONSTRAINT fk_phien_hoc_the_phien
        FOREIGN KEY (phien_id) REFERENCES phien_hoc (id),
    CONSTRAINT fk_phien_hoc_the_the
        FOREIGN KEY (the_id) REFERENCES the_tu_vung (id),
    CONSTRAINT ck_phien_hoc_the_chieu
        CHECK (chieu_hoc IN ('EN_VI', 'VI_EN')),
    CONSTRAINT ck_phien_hoc_the_thu_tu
        CHECK (thu_tu >= 1),
    CONSTRAINT ck_phien_hoc_the_trang_thai
        CHECK (trang_thai IN ('CHUA_TRA_LOI', 'DA_TRA_LOI'))
);

CREATE TABLE lich_su_on
(
    id                   BIGINT                                             NOT NULL AUTO_INCREMENT,
    nguoi_dung_id        BIGINT                                             NOT NULL,
    client_event_id      VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    phien_id             BIGINT                                             NOT NULL,
    tien_do_id           BIGINT                                             NOT NULL,
    danh_gia             VARCHAR(10)                                        NOT NULL,
    thoi_gian            INT                                                NOT NULL,
    truoc_json           JSON                                               NOT NULL,
    sau_json             JSON                                               NOT NULL,
    phien_ban_thuat_toan VARCHAR(50)                                        NOT NULL,
    created_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at           DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_lich_su_on PRIMARY KEY (id),
    CONSTRAINT uk_lich_su_on_nguoi_event
        UNIQUE (nguoi_dung_id, client_event_id),
    CONSTRAINT fk_lich_su_on_nguoi
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_lich_su_on_phien
        FOREIGN KEY (phien_id) REFERENCES phien_hoc (id),
    CONSTRAINT fk_lich_su_on_tien_do
        FOREIGN KEY (tien_do_id) REFERENCES tien_do_the (id),
    CONSTRAINT ck_lich_su_on_event
        CHECK (CHAR_LENGTH(TRIM(client_event_id)) BETWEEN 1 AND 128),
    CONSTRAINT ck_lich_su_on_danh_gia
        CHECK (danh_gia IN ('QUEN', 'KHO', 'NHO', 'DE')),
    CONSTRAINT ck_lich_su_on_thoi_gian
        CHECK (thoi_gian >= 0),
    CONSTRAINT ck_lich_su_on_snapshot
        CHECK (
            JSON_TYPE(truoc_json) = 'OBJECT'
                AND JSON_TYPE(sau_json) = 'OBJECT'
            ),
    CONSTRAINT ck_lich_su_on_thuat_toan
        CHECK (CHAR_LENGTH(TRIM(phien_ban_thuat_toan)) > 0)
);

CREATE INDEX idx_lich_su_on_nguoi_ngay
    ON lich_su_on (nguoi_dung_id, created_at);

CREATE INDEX idx_lich_su_on_phien_ngay
    ON lich_su_on (phien_id, created_at);

CREATE TABLE su_dung_hoc_ngay
(
    id              BIGINT NOT NULL AUTO_INCREMENT,
    nguoi_dung_id   BIGINT NOT NULL,
    ngay_dia_phuong DATE   NOT NULL,
    so_the_moi      INT    NOT NULL DEFAULT 0,
    so_luot_hop_le  INT    NOT NULL DEFAULT 0,
    diem            INT    NOT NULL DEFAULT 0,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version         BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT pk_su_dung_hoc_ngay PRIMARY KEY (id),
    CONSTRAINT uk_su_dung_hoc_ngay_nguoi_ngay
        UNIQUE (nguoi_dung_id, ngay_dia_phuong),
    CONSTRAINT fk_su_dung_hoc_ngay_nguoi
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_su_dung_hoc_ngay_dem
        CHECK (so_the_moi >= 0 AND so_luot_hop_le >= 0 AND diem >= 0),
    CONSTRAINT ck_su_dung_hoc_ngay_version
        CHECK (version >= 0)
);