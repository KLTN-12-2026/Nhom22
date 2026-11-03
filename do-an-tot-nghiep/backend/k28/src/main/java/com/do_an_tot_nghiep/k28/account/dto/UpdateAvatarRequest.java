package com.do_an_tot_nghiep.k28.account.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateAvatarRequest(
        @NotBlank(message = "Chọn ảnh đại diện")
        @Size(max = 18, message = "Mã tệp không hợp lệ")
        @Pattern(regexp = "[1-9][0-9]*", message = "Mã tệp không hợp lệ")
        String anhDaiDienId
) {
}