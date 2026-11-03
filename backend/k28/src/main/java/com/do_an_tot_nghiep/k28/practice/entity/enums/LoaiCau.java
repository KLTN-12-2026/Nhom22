package com.do_an_tot_nghiep.k28.practice.entity.enums;

public enum LoaiCau {
    CHON_NGHIA,
    CHON_TU,
    GHEP_TU,
    DIEN_CHO_TRONG,
    NHAP_TU_THEO_NGHIA,
    NGHE_VIET,
    PHAN_BIET_CAP;

    public KyNang kyNang() {
        return switch (this) {
            case CHON_NGHIA, CHON_TU, GHEP_TU -> KyNang.NHAN_NGHIA;
            case NHAP_TU_THEO_NGHIA -> KyNang.VIET;
            case NGHE_VIET -> KyNang.NGHE;
            case DIEN_CHO_TRONG -> KyNang.NGU_CANH;
            case PHAN_BIET_CAP -> KyNang.CAP_NHAM;
        };
    }
}
