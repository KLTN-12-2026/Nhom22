package com.do_an_tot_nghiep.k28.stats.dto;

import java.time.LocalDate;

public record TheoNgayResponse(
        LocalDate ngay,
        int soLuotOn,
        int soCauLuyen,
        long thoiGian,
        int soPhut
) {
}
