package com.do_an_tot_nghiep.k28.account.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 1, max = 100, message = "Tên hiển thị 1–100 ký tự")
        String tenHienThi,

        @Size(max = 50, message = "Múi giờ không hợp lệ")
        String muiGio
) {

    public UpdateProfileRequest {
        tenHienThi = tenHienThi == null ? null : tenHienThi.strip();
        muiGio = muiGio == null ? null : muiGio.strip();
    }
}
