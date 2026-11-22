package com.do_an_tot_nghiep.k28.learning.dto;

import java.time.LocalDate;
import java.util.List;

public record ChuoiNgayResponse(
        LocalDate ngay,
        int chuoiNgay,
        boolean homNayDaTinhChuoi,
        int luotToiThieuChuoi,
        int luotHomNay,
        List<NgayChuoiResponse> bayNgay,
        KhoiPhucChuoiResponse khoiPhuc
) {
}
