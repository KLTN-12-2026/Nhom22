package com.do_an_tot_nghiep.k28.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
        @NotBlank(message = "Liên kết đặt lại mật khẩu không hợp lệ")
        @Size(max = 100, message = "Liên kết đặt lại mật khẩu không hợp lệ")
        String token,

        @NotBlank(message = "Vui lòng nhập mật khẩu")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$",
                message = "Mật khẩu 8–72 ký tự, có chữ cái và chữ số")
        String password
) {
    @Override
    public String toString() {
        return "ResetPasswordRequest[]";
    }
}
