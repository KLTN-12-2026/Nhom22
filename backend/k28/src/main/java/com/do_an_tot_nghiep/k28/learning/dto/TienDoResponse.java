package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.learning.entity.TienDoThe;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import com.do_an_tot_nghiep.k28.learning.service.SrsState;
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

    public static TienDoResponse of(TienDoThe row) {
        if (row == null) {
            return new TienDoResponse(
                    TrangThaiTienDo.MOI, 0, SrsState.INITIAL_EF, 0, 0, 0, null, 0L
            );
        }
        return new TienDoResponse(
                row.getTrangThai(),
                row.getBuocHoc(),
                row.getEf(),
                row.getKhoangOnNgay(),
                row.getChuoiThanhCong(),
                row.getSoLanQuen(),
                row.getHanOnAt(),
                row.getVersion()
        );
    }
}
