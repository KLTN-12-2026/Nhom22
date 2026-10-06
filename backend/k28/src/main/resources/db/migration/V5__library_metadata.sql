ALTER TABLE bo_the
    ADD COLUMN muc_tieu VARCHAR(20) NULL,
    ADD COLUMN bo_mau BOOLEAN NOT NULL DEFAULT FALSE,
    ADD CONSTRAINT ck_bo_the_muc_tieu
        CHECK (
            muc_tieu IS NULL
            OR muc_tieu IN ('GIAO_TIEP', 'TOEIC')
        ),
    ADD CONSTRAINT ck_bo_the_bo_mau
        CHECK (bo_mau IN (FALSE, TRUE));