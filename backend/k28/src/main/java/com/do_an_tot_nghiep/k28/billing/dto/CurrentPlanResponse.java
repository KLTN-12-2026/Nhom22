package com.do_an_tot_nghiep.k28.billing.dto;

import java.time.Instant;

public record CurrentPlanResponse(
        String goiMa,
        String tenGoi,
        boolean quanTri,
        Instant batDauAt,
        Instant hetHanAt,
        Long soNgayConLai
) {
}
