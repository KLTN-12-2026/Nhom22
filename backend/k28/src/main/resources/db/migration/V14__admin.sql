CREATE TABLE nhat_ky_quan_tri
(
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    nguoi_thuc_hien_id BIGINT       NOT NULL,
    hanh_dong          VARCHAR(30)  NOT NULL,
    loai_doi_tuong     VARCHAR(20)  NOT NULL,
    doi_tuong_id       BIGINT       NOT NULL,
    ten_doi_tuong      VARCHAR(255) NOT NULL,
    ly_do              VARCHAR(500) NULL,
    truoc_json         JSON         NULL,
    sau_json           JSON         NULL,
    created_at         DATETIME(3)  NOT NULL,
    CONSTRAINT pk_nhat_ky_quan_tri PRIMARY KEY (id),
    CONSTRAINT fk_nkqt_nguoi_thuc_hien
        FOREIGN KEY (nguoi_thuc_hien_id) REFERENCES nguoi_dung (id),
    CONSTRAINT ck_nkqt_hanh_dong
        CHECK (hanh_dong IN (
                             'KHOA_TAI_KHOAN', 'MO_KHOA_TAI_KHOAN', 'CAP_QUYEN_QUAN_TRI', 'THU_QUYEN_QUAN_TRI',
                             'TAO_BO_MAU', 'SUA_BO_MAU', 'XUAT_BAN_BO_MAU', 'CHUYEN_VE_NHAP', 'AN_BO_MAU',
                             'HIEN_BO_MAU', 'XOA_BO_MAU', 'TAO_THE_MAU', 'SUA_THE_MAU', 'XOA_THE_MAU'
            )),
    CONSTRAINT ck_nkqt_loai_doi_tuong
        CHECK (loai_doi_tuong IN ('NGUOI_DUNG', 'BO_THE', 'THE_TU_VUNG')),
    CONSTRAINT ck_nkqt_ly_do
        CHECK (ly_do IS NULL OR CHAR_LENGTH(ly_do) BETWEEN 10 AND 500)
);

CREATE INDEX idx_nkqt_thoi_gian
    ON nhat_ky_quan_tri (created_at, id);

CREATE INDEX idx_nkqt_hanh_dong
    ON nhat_ky_quan_tri (hanh_dong, created_at);

CREATE INDEX idx_nkqt_doi_tuong
    ON nhat_ky_quan_tri (loai_doi_tuong, doi_tuong_id);

INSERT INTO nguoi_dung (email, ten_hien_thi, trang_thai, password_hash)
SELECT 'library-editor@vocab.local', 'VocabLearning', 'BI_KHOA', NULL
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM nguoi_dung WHERE email = 'library-editor@vocab.local');
