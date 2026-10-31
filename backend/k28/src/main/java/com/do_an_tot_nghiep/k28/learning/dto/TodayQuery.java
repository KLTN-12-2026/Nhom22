package com.do_an_tot_nghiep.k28.learning.dto;

import jakarta.validation.constraints.Pattern;

public record TodayQuery(
        @Pattern(
                regexp = "[1-9]|[1-9][0-9]|1[0-9]{2}|2[0-3][0-9]|240",
                message = "Số phút mỗi ngày từ 1 đến 240"
        )
        String phut,

        @Pattern(regexp = "true|false", message = "giuTuMoi phải là true hoặc false")
        String giuTuMoi
) {

    public TodayQuery {
        phut = blankToNull(phut);
        giuTuMoi = blankToNull(giuTuMoi);
    }

    public Integer minutes() {
        return phut == null ? null : Integer.valueOf(phut);
    }

    public boolean keepNewCards() {
        return Boolean.parseBoolean(giuTuMoi);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
