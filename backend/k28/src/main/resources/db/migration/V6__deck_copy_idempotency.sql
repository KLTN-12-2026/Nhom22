CREATE TABLE yeu_cau_sao_chep_bo
(
    id              BIGINT                                             NOT NULL AUTO_INCREMENT,
    nguoi_dung_id   BIGINT                                             NOT NULL,
    idempotency_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    bo_nguon_id     BIGINT                                             NOT NULL,
    bo_ket_qua_id   BIGINT NULL,
    response_json   JSON NULL,
    hoan_tat_at     DATETIME(3)  NULL,
    created_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_yeu_cau_sao_chep_bo
        PRIMARY KEY (id),
    CONSTRAINT uk_yeu_cau_sao_chep_bo_nguoi_key
        UNIQUE (nguoi_dung_id, idempotency_key),
    CONSTRAINT fk_yeu_cau_sao_chep_bo_nguoi_dung
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_yeu_cau_sao_chep_bo_nguon
        FOREIGN KEY (bo_nguon_id) REFERENCES bo_the (id),
    CONSTRAINT fk_yeu_cau_sao_chep_bo_ket_qua
        FOREIGN KEY (bo_ket_qua_id) REFERENCES bo_the (id),
    CONSTRAINT ck_yeu_cau_sao_chep_bo_key
        CHECK (CHAR_LENGTH(idempotency_key) BETWEEN 1 AND 128),
    CONSTRAINT ck_yeu_cau_sao_chep_bo_ket_qua
        CHECK (
            (
                bo_ket_qua_id IS NULL
                    AND response_json IS NULL
                    AND hoan_tat_at IS NULL
                )
                OR
            (
                bo_ket_qua_id IS NOT NULL
                    AND response_json IS NOT NULL
                    AND hoan_tat_at IS NOT NULL
                    AND JSON_TYPE(response_json) = 'OBJECT'
                )
            )
);