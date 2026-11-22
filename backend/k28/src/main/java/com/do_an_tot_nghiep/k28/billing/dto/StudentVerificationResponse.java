package com.do_an_tot_nghiep.k28.billing.dto;

import com.do_an_tot_nghiep.k28.billing.entity.enums.PhuongThucXacMinh;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiXacMinh;
import java.time.Instant;

public record StudentVerificationResponse(
        String id,
        PhuongThucXacMinh phuongThuc,
        String tenTruong,
        TrangThaiXacMinh trangThai,
        String lyDoTuChoi,
        Instant duyetAt,
        Instant hetHanAt,
        Instant daNhanUuDaiAt,
        Instant createdAt,
        Long version
) {
}
