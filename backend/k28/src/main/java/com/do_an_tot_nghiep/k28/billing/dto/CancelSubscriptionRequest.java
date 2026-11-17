package com.do_an_tot_nghiep.k28.billing.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record CancelSubscriptionRequest(
        @NotNull(message = "Thiếu đăng ký gói, vui lòng tải lại")
        @Positive(message = "Đăng ký gói không hợp lệ")
        Long id,

        @NotNull(message = "Thiếu phiên bản, vui lòng tải lại")
        @PositiveOrZero(message = "Phiên bản không hợp lệ")
        Long version
) {
}
