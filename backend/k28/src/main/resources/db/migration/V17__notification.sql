CREATE TABLE thong_bao
(
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    nguoi_dung_id   BIGINT        NOT NULL,
    loai            VARCHAR(30)   NOT NULL,
    ngay_dia_phuong DATE          NOT NULL,
    tieu_de         VARCHAR(200)  NOT NULL,
    noi_dung        VARCHAR(1000) NOT NULL,
    lien_ket        VARCHAR(300)  NULL,
    hien_thi        BOOLEAN       NOT NULL,
    gui_email       BOOLEAN       NOT NULL,
    da_doc_at       DATETIME(3)   NULL,
    created_at      DATETIME(3)   NOT NULL,
    updated_at      DATETIME(3)   NOT NULL,
    CONSTRAINT pk_thong_bao PRIMARY KEY (id),
    CONSTRAINT uk_thong_bao_ngay UNIQUE (nguoi_dung_id, loai, ngay_dia_phuong),
    CONSTRAINT fk_thong_bao_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_thong_bao_loai CHECK (loai IN ('NHAC_HOC', 'GOI_SAP_HET_HAN', 'GOI_DA_HET_HAN'))
);

CREATE INDEX idx_thong_bao_hop_thu ON thong_bao (nguoi_dung_id, hien_thi, created_at, id);
