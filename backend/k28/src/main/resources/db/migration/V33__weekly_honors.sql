CREATE TABLE vinh_danh_tuan
(
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    tuan_bat_dau   DATE        NOT NULL,
    hang           INT         NOT NULL,
    nguoi_dung_id  BIGINT      NOT NULL,
    so_ngay        INT         NOT NULL,
    so_luot_hop_le BIGINT      NOT NULL,
    created_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at     DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    CONSTRAINT pk_vinh_danh_tuan PRIMARY KEY (id),
    CONSTRAINT uk_vdt_tuan_nguoi UNIQUE (tuan_bat_dau, nguoi_dung_id),
    CONSTRAINT uk_vdt_tuan_hang UNIQUE (tuan_bat_dau, hang),
    CONSTRAINT fk_vdt_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_vdt_hang CHECK (hang BETWEEN 1 AND 10)
);

CREATE INDEX idx_vdt_nguoi ON vinh_danh_tuan (nguoi_dung_id, hang);

ALTER TABLE huy_hieu
    DROP CHECK ck_huy_hieu_loai;

ALTER TABLE huy_hieu
    ADD CONSTRAINT ck_huy_hieu_loai
        CHECK (loai_dieu_kien IN ('TONG_LUOT_ON', 'CHUOI_NGAY', 'TONG_BAI_LUYEN', 'TONG_DIEM', 'XEP_HANG_TUAN'));

INSERT INTO huy_hieu (ma, ten, mo_ta, loai_dieu_kien, nguong, thu_tu, created_at, updated_at)
VALUES ('TOP_10_TUAN', 'Top 10 tuần', 'Lọt top 10 bảng xếp hạng siêng năng của một tuần', 'XEP_HANG_TUAN', 10, 101,
        CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
       ('TOP_3_TUAN', 'Bục vinh quang', 'Đứng top 3 bảng xếp hạng siêng năng của một tuần', 'XEP_HANG_TUAN', 3, 102,
        CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
       ('QUAN_QUAN_TUAN', 'Quán quân tuần', 'Đứng hạng nhất bảng xếp hạng siêng năng của một tuần', 'XEP_HANG_TUAN', 1, 103,
        CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

ALTER TABLE thong_bao
    DROP CHECK ck_thong_bao_loai;

ALTER TABLE thong_bao
    ADD CONSTRAINT ck_thong_bao_loai
        CHECK (loai IN ('NHAC_HOC', 'GOI_SAP_HET_HAN', 'GOI_DA_HET_HAN', 'YEU_CAU_CONG_KHAI', 'KET_QUA_CONG_KHAI',
                        'VINH_DANH_TUAN'));
