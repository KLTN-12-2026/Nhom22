package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import java.math.BigDecimal;
import java.time.Instant;

public record ChieuTienDoResponse(
        TrangThaiTienDo trangThai,
        int buocHoc,
        BigDecimal ef,
        int khoangOnNgay,
        int chuoiThanhCong,
        int soLanQuen,
        Instant hanOnAt,
        Long version,
        NhomTienDo nhom
) {

    public static ChieuTienDoResponse of(TienDoResponse tienDo, NhomTienDo nhom) {
        return new ChieuTienDoResponse(
                tienDo.trangThai(),
                tienDo.buocHoc(),
                tienDo.ef(),
                tienDo.khoangOnNgay(),
                tienDo.chuoiThanhCong(),
                tienDo.soLanQuen(),
                tienDo.hanOnAt(),
                tienDo.version(),
                nhom
        );
    }
}
