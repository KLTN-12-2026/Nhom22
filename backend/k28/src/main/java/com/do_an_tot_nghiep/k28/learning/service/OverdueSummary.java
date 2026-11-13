package com.do_an_tot_nghiep.k28.learning.service;

import java.util.List;

public record OverdueSummary(
        int soQuaHan,
        int soDenHan,
        int phutMoiNgay,
        int luotMoiNgay,
        int soNgayKeHoach,
        List<Long> theIds
) {
}
