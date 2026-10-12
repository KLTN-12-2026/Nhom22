CREATE TABLE yeu_cau_nhap_csv
(
    id              BIGINT                                             NOT NULL AUTO_INCREMENT,
    nguoi_dung_id   BIGINT                                             NOT NULL,
    idempotency_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    import_id       VARCHAR(36) CHARACTER SET ascii COLLATE ascii_bin  NOT NULL,
    bo_the_id       BIGINT                                             NOT NULL,
    request_hash    VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin  NOT NULL,
    response_json   JSON NULL,
    hoan_tat_at     DATETIME(3) NULL,
    created_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_yeu_cau_nhap_csv
        PRIMARY KEY (id),
    CONSTRAINT uk_yeu_cau_nhap_csv_nguoi_key
        UNIQUE (nguoi_dung_id, idempotency_key),
    CONSTRAINT uk_yeu_cau_nhap_csv_nguoi_import
        UNIQUE (nguoi_dung_id, import_id),
    CONSTRAINT fk_yeu_cau_nhap_csv_nguoi_dung
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_yeu_cau_nhap_csv_bo_the
        FOREIGN KEY (bo_the_id) REFERENCES bo_the (id),
    CONSTRAINT ck_yeu_cau_nhap_csv_key
        CHECK (CHAR_LENGTH(idempotency_key) BETWEEN 1 AND 128),
    CONSTRAINT ck_yeu_cau_nhap_csv_import
        CHECK (CHAR_LENGTH(import_id) = 36),
    CONSTRAINT ck_yeu_cau_nhap_csv_hash
        CHECK (request_hash REGEXP '^[0-9a-f]{64}$'
) ,
    CONSTRAINT ck_yeu_cau_nhap_csv_ket_qua
        CHECK (
            (
                response_json IS NULL
                AND hoan_tat_at IS NULL
            )
            OR
            (
                response_json IS NOT NULL
                AND hoan_tat_at IS NOT NULL
                AND JSON_TYPE(response_json) = 'OBJECT'
            )
        )
);