package com.do_an_tot_nghiep.k28.stats.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Pattern;

public record OverviewQuery(
        @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Ngày phải có dạng YYYY-MM-DD")
        String tuNgay,

        @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Ngày phải có dạng YYYY-MM-DD")
        String denNgay,

        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID bộ thẻ không hợp lệ")
        @DecimalMax(value = "9223372036854775807", message = "ID bộ thẻ không hợp lệ")
        String boTheId
) {

    public OverviewQuery {
        tuNgay = blankToNull(tuNgay);
        denNgay = blankToNull(denNgay);
        boTheId = blankToNull(boTheId);
    }

    public Long deckId() {
        return boTheId == null ? null : Long.valueOf(boTheId);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
