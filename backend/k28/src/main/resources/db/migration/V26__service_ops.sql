ALTER TABLE nhat_ky_quan_tri
    DROP CHECK ck_nkqt_hanh_dong,
    DROP CHECK ck_nkqt_loai_doi_tuong;

ALTER TABLE nhat_ky_quan_tri
    ADD CONSTRAINT ck_nkqt_hanh_dong
        CHECK (hanh_dong IN (
                             'KHOA_TAI_KHOAN', 'MO_KHOA_TAI_KHOAN', 'CAP_QUYEN_QUAN_TRI', 'THU_QUYEN_QUAN_TRI',
                             'TAO_BO_MAU', 'SUA_BO_MAU', 'XUAT_BAN_BO_MAU', 'CHUYEN_VE_NHAP', 'AN_BO_MAU',
                             'HIEN_BO_MAU', 'XOA_BO_MAU', 'TAO_THE_MAU', 'SUA_THE_MAU', 'XOA_THE_MAU',
                             'SUA_GOI_DICH_VU', 'SUA_HAN_GOI', 'CHAY_KIEM_TRA_HET_HAN', 'XOA_TAI_KHOAN',
                             'GIU_NOI_DUNG', 'AN_NOI_DUNG', 'SUA_HAN_MUC'
            )),
    ADD CONSTRAINT ck_nkqt_loai_doi_tuong
        CHECK (loai_doi_tuong IN ('NGUOI_DUNG', 'BO_THE', 'THE_TU_VUNG', 'GOI_DICH_VU', 'DANG_KY_GOI',
                                  'YEU_CAU_AI', 'HAN_MUC_DICH_VU'));

CREATE INDEX idx_yeu_cau_ai_han_muc ON yeu_cau_ai (han_muc_ngay, han_muc_loai, trang_thai);
