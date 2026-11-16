package com.do_an_tot_nghiep.k28.common.quota;

import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ServiceQuotaResponse(
        String goiMa,
        LocalDate ngay,
        Instant datLaiAt,
        List<HanMuc> hanMuc
) {

    public record HanMuc(LoaiDichVu loai, int gioiHan, int soDung, int soGiu, int conLai) {
    }
}
