ALTER TABLE han_muc_dich_vu DROP CHECK ck_han_muc_loai;

ALTER TABLE han_muc_dich_vu
    ADD CONSTRAINT ck_han_muc_loai CHECK (loai IN ('AI', 'ANH', 'TTS', 'PHAT_AM'));

ALTER TABLE su_dung_dich_vu DROP CHECK ck_su_dung_dv_loai;

ALTER TABLE su_dung_dich_vu
    ADD CONSTRAINT ck_su_dung_dv_loai CHECK (loai IN ('AI', 'ANH', 'TTS', 'PHAT_AM'));

INSERT INTO han_muc_dich_vu (goi_ma, loai, so_luot_ngay)
VALUES ('PRO', 'PHAT_AM', 30),
       ('PREMIUM', 'PHAT_AM', 100);

CREATE TABLE ket_qua_phat_am
(
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    nguoi_dung_id      BIGINT       NOT NULL,
    the_id             BIGINT       NOT NULL,
    tep_ghi_am_id      BIGINT       NULL,
    van_ban_mau        VARCHAR(100) NOT NULL,
    ngon_ngu           VARCHAR(10)  NOT NULL,
    nha_cung_cap       VARCHAR(30)  NOT NULL,
    mo_phong           BOOLEAN      NOT NULL,
    trang_thai         VARCHAR(20)  NOT NULL,
    chi_so_json        JSON         NOT NULL,
    thoi_luong_ghi_ms  INT          NOT NULL,
    thoi_gian_xu_ly_ms INT          NOT NULL,
    created_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_ket_qua_phat_am PRIMARY KEY (id),
    CONSTRAINT uk_ket_qua_phat_am_tep UNIQUE (tep_ghi_am_id),
    CONSTRAINT fk_ket_qua_phat_am_nguoi FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_ket_qua_phat_am_the FOREIGN KEY (the_id) REFERENCES the_tu_vung (id),
    CONSTRAINT fk_ket_qua_phat_am_tep FOREIGN KEY (tep_ghi_am_id) REFERENCES tep_tin (id),
    CONSTRAINT ck_ket_qua_phat_am_trang_thai CHECK (trang_thai IN ('DAY_DU', 'THIEU_CHI_SO', 'KHONG_NHAN_DIEN')),
    CONSTRAINT ck_ket_qua_phat_am_chi_so CHECK (JSON_TYPE(chi_so_json) = 'OBJECT'),
    CONSTRAINT ck_ket_qua_phat_am_thoi_luong CHECK (thoi_luong_ghi_ms > 0)
);

CREATE INDEX idx_ket_qua_phat_am_nguoi_the ON ket_qua_phat_am (nguoi_dung_id, the_id, id);
CREATE INDEX idx_ket_qua_phat_am_nguoi ON ket_qua_phat_am (nguoi_dung_id, id);
