package com.do_an_tot_nghiep.k28.stats.dto;

import java.time.LocalDate;

public record ActivityDayResponse(
        LocalDate ngay,
        int soLuotOn,
        int soCauLuyen,
        int soPhut,
        int soCongKhai
) {
}
