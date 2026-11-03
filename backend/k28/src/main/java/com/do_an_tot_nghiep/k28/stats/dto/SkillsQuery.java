package com.do_an_tot_nghiep.k28.stats.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Pattern;

public record SkillsQuery(
        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID bộ thẻ không hợp lệ")
        @DecimalMax(value = "9223372036854775807", message = "ID bộ thẻ không hợp lệ")
        String boTheId
) {

    public SkillsQuery {
        boTheId = boTheId == null || boTheId.isBlank() ? null : boTheId.strip();
    }

    public Long deckId() {
        return boTheId == null ? null : Long.valueOf(boTheId);
    }
}
