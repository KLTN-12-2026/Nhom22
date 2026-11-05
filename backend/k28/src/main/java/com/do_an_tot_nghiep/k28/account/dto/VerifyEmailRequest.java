package com.do_an_tot_nghiep.k28.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record VerifyEmailRequest(
        @NotBlank(message = "Thiếu mã xác thực")
        @Size(max = 100, message = "Mã xác thực không hợp lệ")
        String token
) {

    @Override
    public String toString() {
        return "VerifyEmailRequest[]";
    }
}
