package com.do_an_tot_nghiep.k28.stats.dto;

import jakarta.validation.constraints.Pattern;

public record WeeklySummaryQuery(
        @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Ngày phải có dạng YYYY-MM-DD")
        String ngay
) {

    public WeeklySummaryQuery {
        ngay = ngay == null || ngay.isBlank() ? null : ngay.strip();
    }
}
