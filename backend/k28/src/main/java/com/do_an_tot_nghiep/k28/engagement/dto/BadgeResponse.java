package com.do_an_tot_nghiep.k28.engagement.dto;

import com.do_an_tot_nghiep.k28.engagement.entity.enums.LoaiDieuKienHuyHieu;
import java.time.Instant;

public record BadgeResponse(
        String id,
        String ma,
        String ten,
        String moTa,
        LoaiDieuKienHuyHieu loaiDieuKien,
        int nguong,
        boolean daNhan,
        Instant nhanAt
) {
}
