package com.do_an_tot_nghiep.k28.practice.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record RetryPracticeRequest(

        @NotNull(message = "Thiếu lần làm bài")
        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID lần làm bài không hợp lệ")
        @DecimalMax(value = "9223372036854775807", message = "ID lần làm bài không hợp lệ")
        String lanLamId
) {

    public Long attemptId() {
        return Long.valueOf(lanLamId);
    }
}
