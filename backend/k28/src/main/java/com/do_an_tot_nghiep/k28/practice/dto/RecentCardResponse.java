package com.do_an_tot_nghiep.k28.practice.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import java.time.Instant;

public record RecentCardResponse(
        String theId,
        String boTheId,
        String tu,
        String tuLoai,
        String nghiaVi,
        DanhGia danhGia,
        Instant chamAt
) {
}
