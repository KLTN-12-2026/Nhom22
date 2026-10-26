package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;

public record ReviewResponse(
        String clientEventId,
        String theId,
        ChieuHoc chieuHoc,
        DanhGia danhGia,
        TienDoResponse truoc,
        TienDoResponse tienDo,
        boolean laiTrongPhien
) {
}
