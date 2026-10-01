CREATE TABLE tep_tin
(
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    chu_so_huu_id  BIGINT       NOT NULL,
    object_key     VARCHAR(200) NOT NULL,
    mime_type      VARCHAR(50)  NOT NULL,
    kich_thuoc     BIGINT       NOT NULL,
    checksum       VARCHAR(64)  NOT NULL,
    loai           VARCHAR(20)  NOT NULL,
    trang_thai_xoa VARCHAR(20)  NOT NULL DEFAULT 'CON_HIEU_LUC',
    hoan_tat_at    DATETIME(3)  NULL,
    xoa_at         DATETIME(3)  NULL,
    created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_tep_tin PRIMARY KEY (id),
    CONSTRAINT uk_tep_tin_object_key UNIQUE (object_key),
    CONSTRAINT fk_tep_tin_chu_so_huu FOREIGN KEY (chu_so_huu_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_tep_tin_loai CHECK (loai IN ('ANH', 'AM_THANH')),
    CONSTRAINT ck_tep_tin_trang_thai_xoa CHECK (trang_thai_xoa IN ('CON_HIEU_LUC', 'DA_XOA')),
    CONSTRAINT ck_tep_tin_kich_thuoc CHECK (kich_thuoc > 0)
);

CREATE INDEX idx_tep_tin_chu_so_huu ON tep_tin (chu_so_huu_id, trang_thai_xoa);
CREATE INDEX idx_tep_tin_cho_hoan_tat ON tep_tin (hoan_tat_at, created_at);

ALTER TABLE nguoi_dung
    ADD CONSTRAINT fk_nguoi_dung_anh_dai_dien FOREIGN KEY (anh_dai_dien_id) REFERENCES tep_tin (id);