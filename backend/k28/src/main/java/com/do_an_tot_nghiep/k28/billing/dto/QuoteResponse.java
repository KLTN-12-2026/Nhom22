package com.do_an_tot_nghiep.k28.billing.dto;

import com.do_an_tot_nghiep.k28.billing.entity.enums.ChuKy;

public record QuoteResponse(
        String goiMa,
        String tenGoi,
        ChuKy chuKy,
        long giaGoc,
        long giamGia,
        long khauTru,
        long soTien,
        String maKhuyenMai,
        String tenKhuyenMai,
        boolean uuDaiHssv,
        boolean nangCap
) {
}
