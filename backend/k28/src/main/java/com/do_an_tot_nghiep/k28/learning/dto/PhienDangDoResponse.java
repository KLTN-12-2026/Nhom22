package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import java.time.Instant;

public record PhienDangDoResponse(
        String id,
        String boTheId,
        String boTheTen,
        ChieuHoc chieuHoc,
        int quyThoiGian,
        Instant batDauAt,
        Instant hetGioAt,
        int soDaTraLoi,
        int soChuaTraLoi
) {
}
