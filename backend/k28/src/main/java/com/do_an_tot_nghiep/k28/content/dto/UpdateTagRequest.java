package com.do_an_tot_nghiep.k28.content.dto;

import jakarta.validation.constraints.*;

public record UpdateTagRequest(
        @NotBlank(message = "Nhập tên nhãn")
        @Size(max = 50, message = "Tên nhãn tối đa 50 ký tự")
        String ten,
        @NotNull(message = "Thiếu phiên bản, vui lòng tải lại")
        @PositiveOrZero(message = "Phiên bản không hợp lệ")
        Long version
) {
    public UpdateTagRequest {
        ten = ten == null ? null : ten.strip();
    }
}