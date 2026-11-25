ALTER TABLE thong_bao
    DROP CHECK ck_thong_bao_loai;

ALTER TABLE thong_bao
    ADD CONSTRAINT ck_thong_bao_loai
        CHECK (loai IN ('NHAC_HOC', 'GOI_SAP_HET_HAN', 'GOI_DA_HET_HAN', 'YEU_CAU_CONG_KHAI', 'KET_QUA_CONG_KHAI',
                        'VINH_DANH_TUAN', 'KET_QUA_BAO_CAO', 'ANH_DAI_DIEN_BI_AN', 'PHAN_HOI_HO_TRO'));
