package com.do_an_tot_nghiep.k28.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChooseThemeRequest(
        @NotBlank @Size(max = 40) String giaoDienMa
) {
}
