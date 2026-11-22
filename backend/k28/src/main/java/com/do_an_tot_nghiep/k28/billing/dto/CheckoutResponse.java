package com.do_an_tot_nghiep.k28.billing.dto;

import java.time.Instant;

public record CheckoutResponse(
        String maDon,
        String paymentUrl,
        long soTien,
        long giaGoc,
        long giamGia,
        long khauTru,
        String maKhuyenMai,
        Instant hanThanhToanAt,
        boolean moPhong
) {
}
