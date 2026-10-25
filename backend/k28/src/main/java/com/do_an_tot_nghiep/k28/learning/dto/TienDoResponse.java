package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import java.math.BigDecimal;
import java.time.Instant;

public record TienDoResponse(
        TrangThaiTienDo trangThai,
        int buocHoc,
        BigDecimal ef,
        int khoangOnNgay,
        int chuoiThanhCong,
        int soLanQuen,
        Instant hanOnAt,
        Long version
) {
}