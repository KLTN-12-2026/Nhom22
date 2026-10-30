package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import java.time.Instant;

public record LichSuOnResponse(
        String id,
        String phienId,
        String theId,
        String boTheId,
        String tu,
        String tuLoai,
        String nghiaVi,
        ChieuHoc chieuHoc,
        DanhGia danhGia,
        int thoiGian,
        TienDoResponse truoc,
        TienDoResponse sau,
        String phienBanThuatToan,
        Instant createdAt
) {
}
