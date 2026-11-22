package com.do_an_tot_nghiep.k28.billing.dto;

import com.do_an_tot_nghiep.k28.billing.entity.enums.PhuongThucXacMinh;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiXacMinh;
import java.time.Instant;

public record AdminStudentVerificationResponse(
        String id,
        String nguoiDungId,
        String email,
        String tenHienThi,
        PhuongThucXacMinh phuongThuc,
        String tenTruong,
        TrangThaiXacMinh trangThai,
        String lyDoTuChoi,
        String anhTheUrl,
        Instant duyetAt,
        Instant hetHanAt,
        Instant daNhanUuDaiAt,
        Instant createdAt,
        Long version
) {
}
