ALTER TABLE tep_tin MODIFY chu_so_huu_id BIGINT NULL;

ALTER TABLE han_muc_dich_vu DROP CHECK ck_han_muc_loai;

ALTER TABLE han_muc_dich_vu
    ADD CONSTRAINT ck_han_muc_loai CHECK (loai IN ('AI', 'ANH', 'TTS'));

ALTER TABLE su_dung_dich_vu DROP CHECK ck_su_dung_dv_loai;

ALTER TABLE su_dung_dich_vu
    ADD CONSTRAINT ck_su_dung_dv_loai CHECK (loai IN ('AI', 'ANH', 'TTS'));

INSERT INTO han_muc_dich_vu (goi_ma, loai, so_luot_ngay)
VALUES ('PRO', 'TTS', 100),
       ('PREMIUM', 'TTS', 300);

CREATE TABLE am_thanh_tts
(
    id             BIGINT                                            NOT NULL AUTO_INCREMENT,
    khoa_cache     CHAR(64) CHARACTER SET ascii COLLATE ascii_bin    NOT NULL,
    tep_tin_id     BIGINT                                            NOT NULL,
    nha_cung_cap   VARCHAR(30)                                       NOT NULL,
    model          VARCHAR(60)                                       NOT NULL,
    giong          VARCHAR(30)                                       NOT NULL,
    ngon_ngu       VARCHAR(10)                                       NOT NULL,
    phien_ban      VARCHAR(30)                                       NOT NULL,
    do_dai_van_ban INT                                               NOT NULL,
    thoi_luong_ms  INT                                               NOT NULL,
    mo_phong       BOOLEAN                                           NOT NULL,
    created_at     DATETIME(3)                                       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at     DATETIME(3)                                       NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_am_thanh_tts PRIMARY KEY (id),
    CONSTRAINT uk_am_thanh_tts_khoa UNIQUE (khoa_cache),
    CONSTRAINT uk_am_thanh_tts_tep UNIQUE (tep_tin_id),
    CONSTRAINT fk_am_thanh_tts_tep FOREIGN KEY (tep_tin_id) REFERENCES tep_tin (id),
    CONSTRAINT ck_am_thanh_tts_do_dai CHECK (do_dai_van_ban > 0)
);
