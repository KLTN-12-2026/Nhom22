CREATE TABLE tu_dien
(
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    chieu        VARCHAR(10)  NOT NULL,
    tu           VARCHAR(120) NOT NULL COLLATE utf8mb4_bin,
    tu_chuan_hoa VARCHAR(120) NOT NULL,
    phien_am     VARCHAR(100) NULL,
    tom_tat      VARCHAR(255) NULL,
    noi_dung     JSON         NOT NULL,
    CONSTRAINT pk_tu_dien PRIMARY KEY (id),
    CONSTRAINT uk_tu_dien_tu UNIQUE (chieu, tu),
    CONSTRAINT ck_tu_dien_chieu CHECK (chieu IN ('ANH_VIET', 'VIET_ANH'))
);

CREATE INDEX idx_tu_dien_tra ON tu_dien (chieu, tu_chuan_hoa);
