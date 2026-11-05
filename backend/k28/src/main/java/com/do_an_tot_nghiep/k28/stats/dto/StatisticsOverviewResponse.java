package com.do_an_tot_nghiep.k28.stats.dto;

import java.time.LocalDate;
import java.util.List;

public record StatisticsOverviewResponse(
        String muiGio,
        LocalDate tuNgay,
        LocalDate denNgay,
        String boTheId,
        int soTuDaHoc,
        int soLuotOn,
        Integer tyLeNho,
        BaiLuyenStatsResponse baiLuyen,
        int tongPhut,
        int phutMoiNgay,
        int soNgayCoHoc,
        int soNgayDatMucTieu,
        int chuoiNgay,
        List<TheoNgayResponse> theoNgay
) {
}
