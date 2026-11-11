CREATE TABLE so_diem_thuong
(
    id              BIGINT      NOT NULL AUTO_INCREMENT,
    nguoi_dung_id   BIGINT      NOT NULL,
    loai_su_kien    VARCHAR(20) NOT NULL,
    su_kien_id      VARCHAR(64) NOT NULL,
    diem_goc        INT         NOT NULL,
    so_diem         INT         NOT NULL,
    ngay_dia_phuong DATE        NOT NULL,
    created_at      DATETIME(3) NOT NULL,
    updated_at      DATETIME(3) NOT NULL,
    CONSTRAINT pk_so_diem_thuong PRIMARY KEY (id),
    CONSTRAINT uk_sdt_su_kien UNIQUE (nguoi_dung_id, loai_su_kien, su_kien_id),
    CONSTRAINT fk_sdt_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_sdt_loai CHECK (loai_su_kien IN ('ON_THE', 'BAI_LUYEN')),
    CONSTRAINT ck_sdt_diem CHECK (diem_goc >= 0 AND so_diem >= 0 AND so_diem <= diem_goc)
);

CREATE INDEX idx_sdt_lich_su ON so_diem_thuong (nguoi_dung_id, created_at, id);

CREATE TABLE huy_hieu
(
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    ma             VARCHAR(30)  NOT NULL,
    ten            VARCHAR(100) NOT NULL,
    mo_ta          VARCHAR(255) NOT NULL,
    loai_dieu_kien VARCHAR(20)  NOT NULL,
    nguong         INT          NOT NULL,
    thu_tu         INT          NOT NULL,
    hoat_dong      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     DATETIME(3)  NOT NULL,
    updated_at     DATETIME(3)  NOT NULL,
    CONSTRAINT pk_huy_hieu PRIMARY KEY (id),
    CONSTRAINT uk_huy_hieu_ma UNIQUE (ma),
    CONSTRAINT ck_huy_hieu_loai
        CHECK (loai_dieu_kien IN ('TONG_LUOT_ON', 'CHUOI_NGAY', 'TONG_BAI_LUYEN', 'TONG_DIEM')),
    CONSTRAINT ck_huy_hieu_nguong CHECK (nguong > 0)
);

CREATE TABLE nguoi_dung_huy_hieu
(
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    nguoi_dung_id BIGINT      NOT NULL,
    huy_hieu_id   BIGINT      NOT NULL,
    nhan_at       DATETIME(3) NOT NULL,
    created_at    DATETIME(3) NOT NULL,
    updated_at    DATETIME(3) NOT NULL,
    CONSTRAINT pk_nguoi_dung_huy_hieu PRIMARY KEY (id),
    CONSTRAINT uk_ndhh_nguoi_huy_hieu UNIQUE (nguoi_dung_id, huy_hieu_id),
    CONSTRAINT fk_ndhh_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_ndhh_huy_hieu FOREIGN KEY (huy_hieu_id) REFERENCES huy_hieu (id)
);

CREATE TABLE thu_thach
(
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    ma             VARCHAR(30)  NOT NULL,
    ten            VARCHAR(100) NOT NULL,
    mo_ta          VARCHAR(255) NOT NULL,
    loai_dieu_kien VARCHAR(20)  NOT NULL,
    chu_ky         VARCHAR(10)  NOT NULL,
    muc_tieu       INT          NOT NULL,
    hoat_dong      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     DATETIME(3)  NOT NULL,
    updated_at     DATETIME(3)  NOT NULL,
    CONSTRAINT pk_thu_thach PRIMARY KEY (id),
    CONSTRAINT uk_thu_thach_ma UNIQUE (ma),
    CONSTRAINT ck_thu_thach_loai CHECK (loai_dieu_kien IN ('LUOT_ON')),
    CONSTRAINT ck_thu_thach_chu_ky CHECK (chu_ky IN ('TUAN')),
    CONSTRAINT ck_thu_thach_muc_tieu CHECK (muc_tieu > 0)
);

CREATE TABLE tien_do_thu_thach
(
    id            BIGINT      NOT NULL AUTO_INCREMENT,
    nguoi_dung_id BIGINT      NOT NULL,
    thu_thach_id  BIGINT      NOT NULL,
    tuan_bat_dau  DATE        NOT NULL,
    gia_tri       INT         NOT NULL DEFAULT 0,
    hoan_thanh_at DATETIME(3) NULL,
    created_at    DATETIME(3) NOT NULL,
    updated_at    DATETIME(3) NOT NULL,
    version       BIGINT      NOT NULL DEFAULT 0,
    CONSTRAINT pk_tien_do_thu_thach PRIMARY KEY (id),
    CONSTRAINT uk_tdtt_nguoi_tuan UNIQUE (nguoi_dung_id, thu_thach_id, tuan_bat_dau),
    CONSTRAINT fk_tdtt_nguoi_dung FOREIGN KEY (nguoi_dung_id) REFERENCES nguoi_dung (id),
    CONSTRAINT fk_tdtt_thu_thach FOREIGN KEY (thu_thach_id) REFERENCES thu_thach (id),
    CONSTRAINT ck_tdtt_gia_tri CHECK (gia_tri >= 0),
    CONSTRAINT ck_tdtt_version CHECK (version >= 0)
);

INSERT INTO huy_hieu (ma, ten, mo_ta, loai_dieu_kien, nguong, thu_tu, created_at, updated_at)
VALUES ('BUOC_DAU', 'Bước đầu', 'Hoàn thành lượt ôn hợp lệ đầu tiên', 'TONG_LUOT_ON', 1, 1,
        CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
       ('CHUOI_3', 'Ba ngày đều đặn', 'Đạt chuỗi 3 ngày, mỗi ngày ít nhất 5 lượt hợp lệ', 'CHUOI_NGAY', 3, 2,
        CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
       ('CHUOI_7', 'Một tuần bền bỉ', 'Đạt chuỗi 7 ngày, mỗi ngày ít nhất 5 lượt hợp lệ', 'CHUOI_NGAY', 7, 3,
        CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
       ('ON_100', 'Trăm lượt ôn', 'Có 100 lượt ôn được tính thưởng', 'TONG_LUOT_ON', 100, 4,
        CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
       ('LUYEN_10', 'Chăm luyện tập', 'Nộp 10 bài luyện tập', 'TONG_BAI_LUYEN', 10, 5,
        CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3)),
       ('DIEM_500', 'Năm trăm điểm', 'Tích lũy 500 điểm thưởng', 'TONG_DIEM', 500, 6,
        CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));

INSERT INTO thu_thach (ma, ten, mo_ta, loai_dieu_kien, chu_ky, muc_tieu, created_at, updated_at)
VALUES ('TUAN_40_LUOT', 'Tuần học nhẹ nhàng', '40 lượt ôn hợp lệ từ thứ Hai đến Chủ nhật', 'LUOT_ON', 'TUAN', 40,
        CURRENT_TIMESTAMP(3), CURRENT_TIMESTAMP(3));
