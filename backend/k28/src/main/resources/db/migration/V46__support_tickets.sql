CREATE TABLE phieu_ho_tro
(
    id            BIGINT        NOT NULL AUTO_INCREMENT,
    nguoi_dung_id BIGINT        NOT NULL,
    tieu_de       VARCHAR(150)  NOT NULL,
    mo_ta         VARCHAR(5000) NOT NULL,
    loai_van_de   VARCHAR(20)   NOT NULL,
    do_uu_tien    VARCHAR(20)   NOT NULL,
    trang_thai    VARCHAR(20)   NOT NULL DEFAULT 'DANG_MO',
    created_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version       BIGINT        NOT NULL DEFAULT 0,
    CONSTRAINT pk_phieu_ho_tro PRIMARY KEY (id),
    CONSTRAINT fk_phieu_ho_tro_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_phieu_ho_tro_loai CHECK (loai_van_de IN ('KY_THUAT', 'HOC_VU', 'THANH_TOAN', 'KHAC')),
    CONSTRAINT ck_phieu_ho_tro_uu_tien CHECK (do_uu_tien IN ('THAP', 'TRUNG_BINH', 'CAO', 'NGHIEM_TRONG')),
    CONSTRAINT ck_phieu_ho_tro_trang_thai CHECK (trang_thai IN ('DANG_MO', 'DA_GIAI_QUYET'))
);

CREATE INDEX ix_phieu_ho_tro_nguoi_dung ON phieu_ho_tro (nguoi_dung_id, created_at);
CREATE INDEX ix_phieu_ho_tro_trang_thai ON phieu_ho_tro (trang_thai, created_at);

CREATE TABLE phan_hoi_phieu_ho_tro
(
    id             BIGINT        NOT NULL AUTO_INCREMENT,
    phieu_id       BIGINT        NOT NULL,
    nguoi_xu_ly_id BIGINT        NOT NULL,
    noi_dung       VARCHAR(2000) NOT NULL,
    hanh_dong      VARCHAR(200)  NOT NULL,
    created_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at     DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_phan_hoi_phieu_ho_tro PRIMARY KEY (id),
    CONSTRAINT fk_phan_hoi_phieu FOREIGN KEY (phieu_id) REFERENCES phieu_ho_tro (id) ON DELETE CASCADE,
    CONSTRAINT fk_phan_hoi_nguoi_xu_ly FOREIGN KEY (nguoi_xu_ly_id) REFERENCES nguoi_dung (id)
);

CREATE INDEX ix_phan_hoi_phieu ON phan_hoi_phieu_ho_tro (phieu_id, created_at);
