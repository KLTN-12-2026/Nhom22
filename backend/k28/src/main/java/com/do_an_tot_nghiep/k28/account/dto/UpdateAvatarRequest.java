package com.do_an_tot_nghiep.k28.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateAvatarRequest(
        @NotBlank
        @Size(max = 18)
        @Pattern(regexp = "[1-9][0-9]*")
        String anhDaiDienId
) {
}