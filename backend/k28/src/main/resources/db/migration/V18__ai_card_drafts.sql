ALTER TABLE tep_tin DROP CHECK ck_tep_tin_loai;

ALTER TABLE tep_tin
    ADD CONSTRAINT ck_tep_tin_loai CHECK (loai IN ('ANH', 'AM_THANH', 'TAI_LIEU'));

ALTER TABLE tep_tin MODIFY mime_type VARCHAR(100) NOT NULL;

CREATE TABLE yeu_cau_luu_the_ai
(
    id              BIGINT                                             NOT NULL AUTO_INCREMENT,
    nguoi_dung_id   BIGINT                                             NOT NULL,
    idempotency_key VARCHAR(128) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    yeu_cau_ai_id   BIGINT                                             NOT NULL,
    bo_the_id       BIGINT                                             NULL,
    request_hash    VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin  NOT NULL,
    response_json   JSON                                               NULL,
    hoan_tat_at     DATETIME(3)                                        NULL,
    created_at      DATETIME(3)                                        NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at      DATETIME(3)                                        NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_yeu_cau_luu_the_ai PRIMARY KEY (id),
    CONSTRAINT uk_yeu_cau_luu_the_ai_nguoi_key UNIQUE (nguoi_dung_id, idempotency_key),
    CONSTRAINT fk_yeu_cau_luu_the_ai_nguoi
        FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_yeu_cau_luu_the_ai_yeu_cau
        FOREIGN KEY (yeu_cau_ai_id) REFERENCES yeu_cau_ai (id),
    CONSTRAINT fk_yeu_cau_luu_the_ai_bo
        FOREIGN KEY (bo_the_id) REFERENCES bo_the (id),
    CONSTRAINT ck_yeu_cau_luu_the_ai_key
        CHECK (CHAR_LENGTH(idempotency_key) BETWEEN 1 AND 128),
    CONSTRAINT ck_yeu_cau_luu_the_ai_hash
        CHECK (request_hash REGEXP '^[0-9a-f]{64}$'),
    CONSTRAINT ck_yeu_cau_luu_the_ai_ket_qua
        CHECK (
            (bo_the_id IS NULL AND response_json IS NULL AND hoan_tat_at IS NULL)
            OR
            (bo_the_id IS NOT NULL AND response_json IS NOT NULL AND hoan_tat_at IS NOT NULL
                AND JSON_TYPE(response_json) = 'OBJECT')
        )
);

CREATE INDEX idx_yeu_cau_luu_the_ai_yeu_cau
    ON yeu_cau_luu_the_ai (yeu_cau_ai_id);
