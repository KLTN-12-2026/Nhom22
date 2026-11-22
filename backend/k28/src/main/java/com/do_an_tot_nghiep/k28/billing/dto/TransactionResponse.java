package com.do_an_tot_nghiep.k28.billing.dto;

import com.do_an_tot_nghiep.k28.billing.entity.enums.ChuKy;
import com.do_an_tot_nghiep.k28.billing.entity.enums.CongThanhToan;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich;
import java.time.Instant;

public record TransactionResponse(
        String maDon,
        String goiMa,
        String tenGoi,
        ChuKy chuKy,
        long soTien,
        long giaGoc,
        long giamGia,
        long khauTru,
        String maKhuyenMai,
        boolean uuDaiHssv,
        boolean nangCap,
        CongThanhToan cong,
        TrangThaiGiaoDich trangThai,
        String maPhanHoi,
        Instant taoAt,
        Instant hoanTatAt
) {
}
