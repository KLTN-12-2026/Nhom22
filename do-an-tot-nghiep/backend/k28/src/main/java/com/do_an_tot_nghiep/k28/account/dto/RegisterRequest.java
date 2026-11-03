package com.do_an_tot_nghiep.k28.account.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Vui lòng nhập tên hiển thị")
        @Size(max = 100, message = "Tên hiển thị tối đa 100 ký tự")
        String tenHienThi,

        @NotBlank(message = "Vui lòng nhập email")
        @Email(message = "Email không hợp lệ")
        @Size(max = 255, message = "Email tối đa 255 ký tự")
        String email,

        @NotBlank(message = "Vui lòng nhập mật khẩu")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,72}$",
                message = "Mật khẩu 8–72 ký tự, có chữ cái và chữ số")
        String password,

        @Size(max = 50, message = "Múi giờ không hợp lệ")
        String muiGio,

        @AssertTrue(message = "Bạn cần đồng ý với điều khoản sử dụng")
        boolean acceptTerms
) {

    public RegisterRequest {
        email = email == null ? null : email.strip();
    }

    @Override
    public String toString() {
        return "RegisterRequest[email=" + email + "]";
    }
}
