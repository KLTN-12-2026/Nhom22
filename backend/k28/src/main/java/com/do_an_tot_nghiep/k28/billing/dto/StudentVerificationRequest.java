package com.do_an_tot_nghiep.k28.billing.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record StudentVerificationRequest(
        @Pattern(regexp = "^[0-9]{1,18}$", message = "Mã tệp không hợp lệ")
        String tepTheId,

        @Size(max = 150, message = "Tên trường tối đa 150 ký tự")
        String tenTruong
) {

    public StudentVerificationRequest {
        tepTheId = tepTheId == null || tepTheId.isBlank() ? null : tepTheId.strip();
        tenTruong = tenTruong == null || tenTruong.isBlank() ? null : tenTruong.strip();
    }
}
