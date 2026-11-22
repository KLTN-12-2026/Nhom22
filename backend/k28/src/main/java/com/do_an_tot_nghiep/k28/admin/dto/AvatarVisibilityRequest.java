package com.do_an_tot_nghiep.k28.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AvatarVisibilityRequest(
        @NotNull(message = "Chọn ẩn hoặc hiện ảnh đại diện")
        Boolean an,

        @NotBlank(message = "Nhập lý do từ 10 đến 500 ký tự")
        @Size(min = 10, max = 500, message = "Nhập lý do từ 10 đến 500 ký tự")
        String lyDo
) {

    public AvatarVisibilityRequest {
        lyDo = Reasons.normalize(lyDo);
    }
}
