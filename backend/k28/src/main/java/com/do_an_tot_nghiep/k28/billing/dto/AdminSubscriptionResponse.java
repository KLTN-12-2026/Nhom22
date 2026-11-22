package com.do_an_tot_nghiep.k28.billing.dto;

import com.do_an_tot_nghiep.k28.billing.entity.enums.NguonDangKy;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiDangKy;
import java.time.Instant;

public record AdminSubscriptionResponse(
        String id,
        String nguoiDungId,
        String email,
        String tenHienThi,
        String goiMa,
        String tenGoi,
        Instant batDauAt,
        Instant hetHanAt,
        TrangThaiDangKy trangThai,
        Long soNgayConLai,
        Long version,
        NguonDangKy nguon
) {
}
