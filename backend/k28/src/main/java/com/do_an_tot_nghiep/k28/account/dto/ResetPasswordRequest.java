package com.do_an_tot_nghiep.k28.account.dto;

import com.do_an_tot_nghiep.k28.common.validation.MaxUtf8Bytes;
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
        @MaxUtf8Bytes(value = 72, message = "Mật khẩu quá dài: tối đa 72 byte (chữ có dấu chiếm 2–3 byte)")
        String password
) {
    @Override
    public String toString() {
        return "ResetPasswordRequest[]";
    }
}
