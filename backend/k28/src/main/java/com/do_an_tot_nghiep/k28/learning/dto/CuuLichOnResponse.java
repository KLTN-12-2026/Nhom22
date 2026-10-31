package com.do_an_tot_nghiep.k28.learning.dto;

import java.util.List;

public record CuuLichOnResponse(
        int soTheCanOn,
        int soQuaHan,
        int phutMoiNgay,
        int luotMoiNgay,
        int soNgay,
        List<KeHoachNgayResponse> keHoach,
        boolean tamDungTuMoi
) {
}
