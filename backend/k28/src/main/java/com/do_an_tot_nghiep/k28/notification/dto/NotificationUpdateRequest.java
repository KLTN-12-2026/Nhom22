package com.do_an_tot_nghiep.k28.notification.dto;

import jakarta.validation.constraints.NotNull;

public record NotificationUpdateRequest(
        @NotNull(message = "Chọn đã đọc hoặc chưa đọc")
        Boolean daDoc
) {
}
