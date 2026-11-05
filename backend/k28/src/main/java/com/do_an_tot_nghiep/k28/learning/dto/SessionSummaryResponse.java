package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiPhienHoc;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public record SessionSummaryResponse(
        String phienId,
        String boTheId,
        String boTheTen,
        ChieuHoc chieuHoc,
        int quyThoiGian,
        Instant batDauAt,
        Instant hetGioAt,
        Instant ketThucAt,
        TrangThaiPhienHoc trangThai,
        int soLuot,
        int soThe,
        int soTheMoi,
        long soChuaTraLoi,
        long thoiGian,
        Map<DanhGia, Integer> theoDanhGia,
        List<TuCanLuyenResponse> tuCanLuyen,
        List<LichTiepTheoResponse> lichTiepTheo
) {
}
