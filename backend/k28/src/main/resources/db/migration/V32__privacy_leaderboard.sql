CREATE TABLE cai_dat_rieng_tu
(
    nguoi_dung_id       BIGINT      NOT NULL,
    cong_khai_hoat_dong BOOLEAN     NOT NULL DEFAULT TRUE,
    tham_gia_xep_hang   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at          DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    version             BIGINT      NOT NULL DEFAULT 0,
    CONSTRAINT pk_cai_dat_rieng_tu PRIMARY KEY (nguoi_dung_id),
    CONSTRAINT fk_cdrt_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id)
);

CREATE INDEX idx_sdhn_ngay ON su_dung_hoc_ngay (ngay_dia_phuong, nguoi_dung_id, so_luot_hop_le);
