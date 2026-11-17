package com.do_an_tot_nghiep.k28.billing.dto;

import java.time.Instant;

public record SubscriptionResponse(
        String goiMa,
        String tenGoi,
        String trangThai,
        Instant batDauAt,
        Instant hetHanAt,
        Long soNgayConLai,
        String id,
        Long version,
        Instant huyAt
) {
}
