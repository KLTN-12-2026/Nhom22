ALTER TABLE han_muc_dich_vu DROP CHECK ck_han_muc_loai;

ALTER TABLE han_muc_dich_vu
    ADD CONSTRAINT ck_han_muc_loai CHECK (loai IN ('AI', 'ANH', 'TTS', 'PHAT_AM', 'LUYEN_TAP'));

ALTER TABLE su_dung_dich_vu DROP CHECK ck_su_dung_dv_loai;

ALTER TABLE su_dung_dich_vu
    ADD CONSTRAINT ck_su_dung_dv_loai CHECK (loai IN ('AI', 'ANH', 'TTS', 'PHAT_AM', 'LUYEN_TAP'));

INSERT INTO han_muc_dich_vu (goi_ma, loai, so_luot_ngay)
VALUES ('FREE', 'LUYEN_TAP', 5),
       ('PRO', 'LUYEN_TAP', 50),
       ('PREMIUM', 'LUYEN_TAP', 200);

ALTER TABLE yeu_cau_ai DROP CHECK ck_yeu_cau_ai_loai;

ALTER TABLE yeu_cau_ai
    ADD CONSTRAINT ck_yeu_cau_ai_loai
        CHECK (loai IN ('TAO_THE', 'NGU_CANH', 'SUA_CAU', 'ANH_THE', 'GIAI_THICH_LOI'));

ALTER TABLE goi_dich_vu
    ADD COLUMN thong_ke_nang_cao BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE goi_dich_vu SET thong_ke_nang_cao = TRUE WHERE ma IN ('PRO', 'PREMIUM');

ALTER TABLE tra_loi_bai_luyen
    ADD COLUMN yeu_cau_giai_thich_id BIGINT NULL,
    ADD CONSTRAINT uq_tra_loi_giai_thich UNIQUE (yeu_cau_giai_thich_id),
    ADD CONSTRAINT fk_tra_loi_giai_thich FOREIGN KEY (yeu_cau_giai_thich_id) REFERENCES yeu_cau_ai (id) ON DELETE SET NULL;
