package com.do_an_tot_nghiep.k28.account.dto;

import com.do_an_tot_nghiep.k28.common.validation.MaxUtf8Bytes;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotBlank(message = "Vui lòng nhập mật khẩu hiện tại")
        @Size(max = 72, message = "Mật khẩu tối đa 72 ký tự")
        @MaxUtf8Bytes(value = 72, message = "Mật khẩu quá dài: tối đa 72 byte (chữ có dấu chiếm 2–3 byte)")
        String currentPassword,

        @NotBlank(message = "Vui lòng nhập mật khẩu mới")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$",
                message = "Mật khẩu 8–72 ký tự, có chữ cái và chữ số")
        @MaxUtf8Bytes(value = 72, message = "Mật khẩu quá dài: tối đa 72 byte (chữ có dấu chiếm 2–3 byte)")
        String newPassword
) {
    @Override
    public String toString() {
        return "ChangePasswordRequest[]";
    }
}