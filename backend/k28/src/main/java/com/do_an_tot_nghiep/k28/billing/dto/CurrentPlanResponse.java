package com.do_an_tot_nghiep.k28.billing.dto;

import com.do_an_tot_nghiep.k28.billing.entity.enums.NguonDangKy;
import java.time.Instant;

public record CurrentPlanResponse(
        String goiMa,
        String tenGoi,
        boolean quanTri,
        Instant batDauAt,
        Instant hetHanAt,
        Long soNgayConLai,
        NguonDangKy nguon
) {
}
