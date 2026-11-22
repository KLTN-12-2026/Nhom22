package com.do_an_tot_nghiep.k28.engagement.dto;

import java.time.LocalDate;
import java.util.List;

public record WeeklyHonorResponse(
        LocalDate tuanBatDau,
        LocalDate tuanKetThuc,
        List<WeeklyHonorEntryResponse> vinhDanh
) {
}
