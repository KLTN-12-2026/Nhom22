package com.do_an_tot_nghiep.k28.practice.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import java.time.Instant;
import java.util.List;
import java.util.Map;

public record RecentCardsResponse(
        int soNgay,
        Instant tuNgay,
        List<DanhGia> danhGia,
        Map<DanhGia, Integer> theoDanhGia,
        int tongSo,
        List<RecentCardResponse> the
) {
}
