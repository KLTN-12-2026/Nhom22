package com.do_an_tot_nghiep.k28.learning.repository;

import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import java.time.Instant;

public record HistoryRow(
        Long id,
        Long phienId,
        Long theId,
        Long boTheId,
        String tu,
        String tuLoai,
        String nghiaVi,
        ChieuHoc chieuHoc,
        DanhGia danhGia,
        int thoiGian,
        String truocJson,
        String sauJson,
        String phienBanThuatToan,
        Instant createdAt
) {
}
