package com.do_an_tot_nghiep.k28.engagement.dto;

import com.do_an_tot_nghiep.k28.engagement.entity.enums.ChuKyThuThach;
import com.do_an_tot_nghiep.k28.engagement.entity.enums.LoaiDieuKienThuThach;
import java.time.Instant;
import java.time.LocalDate;

public record ChallengeResponse(
        String id,
        String ma,
        String ten,
        String moTa,
        LoaiDieuKienThuThach loaiDieuKien,
        ChuKyThuThach chuKy,
        int mucTieu,
        int giaTri,
        LocalDate tuanBatDau,
        LocalDate tuanKetThuc,
        Instant hoanThanhAt
) {
}
