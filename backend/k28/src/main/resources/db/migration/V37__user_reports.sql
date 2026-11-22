ALTER TABLE nguoi_dung
    ADD COLUMN anh_dai_dien_an_id BIGINT NULL;

ALTER TABLE bao_cao_noi_dung
    DROP CHECK ck_bao_cao_loai,
    DROP CHECK ck_bao_cao_ly_do,
    DROP CHECK ck_bao_cao_trang_thai;

ALTER TABLE bao_cao_noi_dung
    ADD CONSTRAINT ck_bao_cao_loai
        CHECK (loai_doi_tuong IN ('BO_THE', 'THE_TU_VUNG', 'YEU_CAU_AI', 'NGUOI_DUNG')),
    ADD CONSTRAINT ck_bao_cao_ly_do
        CHECK (ly_do IN ('SAI_NOI_DUNG', 'SAI_CHINH_TA', 'KHONG_PHU_HOP', 'SPAM', 'BAN_QUYEN', 'KHAC',
                         'ANH_DAI_DIEN_NHAY_CAM', 'TEN_KHONG_PHU_HOP', 'MAO_DANH', 'QUAY_ROI')),
    ADD CONSTRAINT ck_bao_cao_trang_thai
        CHECK (trang_thai IN ('CHO_XU_LY', 'DA_GIU', 'DA_AN', 'DA_KHOA'));

ALTER TABLE thong_bao
    DROP CHECK ck_thong_bao_loai;

ALTER TABLE thong_bao
    ADD CONSTRAINT ck_thong_bao_loai
        CHECK (loai IN ('NHAC_HOC', 'GOI_SAP_HET_HAN', 'GOI_DA_HET_HAN', 'YEU_CAU_CONG_KHAI', 'KET_QUA_CONG_KHAI',
                        'VINH_DANH_TUAN', 'KET_QUA_BAO_CAO', 'ANH_DAI_DIEN_BI_AN'));

ALTER TABLE nhat_ky_quan_tri
    DROP CHECK ck_nkqt_hanh_dong;

ALTER TABLE nhat_ky_quan_tri
    ADD CONSTRAINT ck_nkqt_hanh_dong
        CHECK (hanh_dong IN (
                             'KHOA_TAI_KHOAN', 'MO_KHOA_TAI_KHOAN', 'CAP_QUYEN_QUAN_TRI', 'THU_QUYEN_QUAN_TRI',
                             'TAO_BO_MAU', 'SUA_BO_MAU', 'XUAT_BAN_BO_MAU', 'CHUYEN_VE_NHAP', 'AN_BO_MAU',
                             'HIEN_BO_MAU', 'XOA_BO_MAU', 'TAO_THE_MAU', 'SUA_THE_MAU', 'XOA_THE_MAU',
                             'SUA_GOI_DICH_VU', 'SUA_HAN_GOI', 'CHAY_KIEM_TRA_HET_HAN', 'XOA_TAI_KHOAN',
                             'GIU_NOI_DUNG', 'AN_NOI_DUNG', 'SUA_HAN_MUC',
                             'TAO_THONG_BAO', 'SUA_THONG_BAO', 'XOA_THONG_BAO',
                             'DUYET_CONG_KHAI', 'TU_CHOI_CONG_KHAI', 'THU_HOI_CONG_KHAI',
                             'TAO_KHUYEN_MAI', 'SUA_KHUYEN_MAI', 'SUA_UU_DAI', 'DUYET_HSSV', 'TU_CHOI_HSSV',
                             'AN_ANH_DAI_DIEN', 'HIEN_ANH_DAI_DIEN'
            ));
