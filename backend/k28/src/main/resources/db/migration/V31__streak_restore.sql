CREATE TABLE khoi_phuc_chuoi
(
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    nguoi_dung_id BIGINT      NOT NULL,
    ngay          DATE        NOT NULL,
    thang         DATE        NOT NULL,
    created_at    DATETIME(3) NOT NULL,
    updated_at    DATETIME(3) NOT NULL,
    CONSTRAINT pk_khoi_phuc_chuoi PRIMARY KEY (id),
    CONSTRAINT uk_kpc_ngay UNIQUE (nguoi_dung_id, ngay),
    CONSTRAINT fk_kpc_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id)
);

CREATE INDEX idx_kpc_thang ON khoi_phuc_chuoi (nguoi_dung_id, thang);
