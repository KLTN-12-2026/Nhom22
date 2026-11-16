package com.do_an_tot_nghiep.k28.billing.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record RevenueResponse(
        KyDoanhThu ky,
        Integer nam,
        Integer tuNam,
        Integer denNam,
        long tongDoanhThu,
        long soGiaoDich,
        Double soVoiKyTruocPhanTram,
        List<Ky> cacKy,
        TongQuan tongQuan
) {

    public record Ky(
            String nhan,
            LocalDate tuNgay,
            LocalDate denNgay,
            long doanhThu,
            long soGiaoDich,
            Map<String, Long> theoGoi
    ) {
    }

    public record TongQuan(
            long soGoiHieuLuc,
            long soSapHetHan7Ngay,
            Double tyLeThanhCong
    ) {
    }
}
