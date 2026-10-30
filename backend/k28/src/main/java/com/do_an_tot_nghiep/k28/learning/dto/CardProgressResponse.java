package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import java.util.Map;

public record CardProgressResponse(
        String theId,
        boolean tamNgung,
        Map<ChieuHoc, TienDoResponse> chieu
) {
}
