package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import java.time.Instant;

public record LichTiepTheoResponse(
        String theId,
        String tu,
        TrangThaiTienDo trangThai,
        Instant hanOnAt
) {
}
