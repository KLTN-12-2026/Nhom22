package com.do_an_tot_nghiep.k28.account.dto;

import com.do_an_tot_nghiep.k28.account.entity.enums.BuocHuongDan;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record OnboardingTourRequest(
        @NotNull BuocHuongDan buocHuongDan,
        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID bộ thẻ phải là số nguyên dương") String boSaoChepId
) {
}
