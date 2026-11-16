package com.do_an_tot_nghiep.k28.billing.gateway;

public record KetQuaCong(
        boolean chuKyHopLe,
        String maDon,
        long soTien,
        String maPhanHoi,
        String maGiaoDichCong,
        boolean thanhCong
) {

    public static KetQuaCong khongHopLe() {
        return new KetQuaCong(false, null, -1, null, null, false);
    }
}
