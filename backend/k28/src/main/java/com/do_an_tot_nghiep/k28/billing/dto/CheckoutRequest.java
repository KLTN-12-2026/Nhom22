package com.do_an_tot_nghiep.k28.billing.dto;

import com.do_an_tot_nghiep.k28.billing.entity.enums.ChuKy;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CheckoutRequest(
        @NotBlank @Size(max = 20) String goiMa,
        @NotNull ChuKy chuKy
) {
}
