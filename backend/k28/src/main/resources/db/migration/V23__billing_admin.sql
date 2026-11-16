ALTER TABLE nhat_ky_quan_tri
    DROP CHECK ck_nkqt_hanh_dong,
    DROP CHECK ck_nkqt_loai_doi_tuong;

ALTER TABLE nhat_ky_quan_tri
    ADD CONSTRAINT ck_nkqt_hanh_dong
        CHECK (hanh_dong IN (
                             'KHOA_TAI_KHOAN', 'MO_KHOA_TAI_KHOAN', 'CAP_QUYEN_QUAN_TRI', 'THU_QUYEN_QUAN_TRI',
                             'TAO_BO_MAU', 'SUA_BO_MAU', 'XUAT_BAN_BO_MAU', 'CHUYEN_VE_NHAP', 'AN_BO_MAU',
                             'HIEN_BO_MAU', 'XOA_BO_MAU', 'TAO_THE_MAU', 'SUA_THE_MAU', 'XOA_THE_MAU',
                             'SUA_GOI_DICH_VU', 'SUA_HAN_GOI', 'CHAY_KIEM_TRA_HET_HAN'
            )),
    ADD CONSTRAINT ck_nkqt_loai_doi_tuong
        CHECK (loai_doi_tuong IN ('NGUOI_DUNG', 'BO_THE', 'THE_TU_VUNG', 'GOI_DICH_VU', 'DANG_KY_GOI'));

CREATE INDEX ix_giao_dich_trang_thai_hoan_tat ON giao_dich_thanh_toan (trang_thai, hoan_tat_at);
CREATE INDEX ix_giao_dich_tao_at ON giao_dich_thanh_toan (tao_at);
