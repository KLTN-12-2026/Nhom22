package com.do_an_tot_nghiep.k28.admin.dto;

import com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserStatusRequest(
        @NotNull(message = "Chọn khóa hoặc mở khóa")
        TrangThaiNguoiDung trangThai,

        @NotBlank(message = "Nhập lý do từ 10 đến 500 ký tự")
        @Size(min = 10, max = 500, message = "Nhập lý do từ 10 đến 500 ký tự")
        String lyDo
) {

    public UserStatusRequest {
        lyDo = Reasons.normalize(lyDo);
    }
}
