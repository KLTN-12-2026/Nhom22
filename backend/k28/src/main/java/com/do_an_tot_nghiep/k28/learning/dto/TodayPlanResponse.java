package com.do_an_tot_nghiep.k28.learning.dto;

import java.time.LocalDate;
import java.util.List;

public record TodayPlanResponse(
        LocalDate ngay,
        int soQuaHan,
        int soDenHan,
        int soTheMoiDaHoc,
        int tuMoiMoiNgay,
        int soMoiConLai,
        int giayMoiLuot,
        int uocTinhPhut,
        int phutMoiNgay,
        int chuoiNgay,
        boolean homNayDaTinhChuoi,
        int luotToiThieuChuoi,
        DaHocHomNayResponse daHocHomNay,
        int tongSoThe,
        List<DeckPlanResponse> boThe
) {
}
