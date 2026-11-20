package com.do_an_tot_nghiep.k28.stats.dto;

import java.time.LocalDate;
import java.util.List;

public record ActivityResponse(
        String muiGio,
        LocalDate tuNgay,
        LocalDate denNgay,
        List<ActivityDayResponse> theoNgay
) {
}
