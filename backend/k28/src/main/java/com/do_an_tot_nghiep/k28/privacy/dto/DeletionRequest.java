package com.do_an_tot_nghiep.k28.privacy.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DeletionRequest(
        @NotBlank(message = "Nhập email của tài khoản để xác nhận")
        @Size(max = 255, message = "Email tối đa 255 ký tự")
        String xacNhan,

        @Size(max = 100, message = "Mật khẩu tối đa 100 ký tự")
        String matKhau
) {
}
