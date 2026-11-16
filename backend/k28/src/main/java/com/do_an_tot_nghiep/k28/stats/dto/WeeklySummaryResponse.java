package com.do_an_tot_nghiep.k28.stats.dto;

import com.do_an_tot_nghiep.k28.practice.dto.RecommendationResponse;
import com.do_an_tot_nghiep.k28.practice.entity.enums.KyNang;
import java.time.LocalDate;
import java.util.List;

public record WeeklySummaryResponse(
        String muiGio,
        LocalDate tuNgay,
        LocalDate denNgay,
        boolean tuanHienTai,
        int soTuDaHoc,
        int soTuMoi,
        int soLuotOn,
        Integer tyLeNho,
        int soCauLuyen,
        int tongPhut,
        int soNgayCoHoc,
        List<KyNangTuan> kyNang,
        List<TuKho> tuKho,
        List<RecommendationResponse> tuDaVuotQua,
        MucTieuTuanSau mucTieuTuanSau,
        String tomTat
) {

    public record KyNangTuan(
            KyNang kyNang,
            int soQuanSat,
            Integer tyLeDung,
            int soQuanSatTuanTruoc,
            Integer tyLeDungTuanTruoc,
            boolean duDuLieu,
            boolean tienBo
    ) {
    }

    public record TuKho(String theId, String tu, String boTheId, String tenBo, int soLanSai, int soLuot) {
    }

    public record MucTieuTuanSau(int soNgayHoc, int phutMoiNgay, List<String> theIds, String vanBan) {
    }
}
