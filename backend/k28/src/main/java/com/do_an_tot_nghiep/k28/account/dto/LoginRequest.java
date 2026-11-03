package com.do_an_tot_nghiep.k28.account.dto;

import com.do_an_tot_nghiep.k28.common.validation.MaxUtf8Bytes;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
        @NotBlank(message = "Vui lòng nhập email")
        @Email(message = "Email không hợp lệ")
        @Size(max = 255, message = "Email tối đa 255 ký tự")
        String email,

        @NotBlank(message = "Vui lòng nhập mật khẩu")
        @Size(max = 72, message = "Mật khẩu tối đa 72 ký tự")
        @MaxUtf8Bytes(value = 72, message = "Mật khẩu quá dài: tối đa 72 byte (chữ có dấu chiếm 2–3 byte)")
        String password
) {
    public LoginRequest {
        email = email == null ? null : email.trim();
    }

    @Override
    public String toString() {
        return "LoginRequest[email=" + email + "]";
    }
}
