package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import java.util.Map;

public record DeckProgressItemResponse(
        String theId,
        String tu,
        String tuLoai,
        String phienAm,
        String nghiaVi,
        boolean tamNgung,
        Map<ChieuHoc, ChieuTienDoResponse> chieu
) {
}
