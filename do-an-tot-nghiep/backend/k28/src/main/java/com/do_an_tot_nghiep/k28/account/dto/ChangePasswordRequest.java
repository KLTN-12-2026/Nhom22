package com.do_an_tot_nghiep.k28.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Vui lòng nhập mật khẩu hiện tại")
        @Size(max = 72, message = "Mật khẩu tối đa 72 ký tự")
        String currentPassword,

        @NotBlank(message = "Vui lòng nhập mật khẩu mới")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$",
                message = "Mật khẩu 8–72 ký tự, có chữ cái và chữ số")
        String newPassword
) {
    @Override
    public String toString() {
        return "ChangePasswordRequest[]";
    }
}