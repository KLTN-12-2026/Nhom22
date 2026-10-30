package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import java.util.List;

public record TuCanLuyenResponse(
        String theId,
        String tu,
        String tuLoai,
        String nghiaVi,
        List<DanhGia> danhGia
) {
}
