package com.do_an_tot_nghiep.k28.billing.dto;

import com.do_an_tot_nghiep.k28.admin.dto.Reasons;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public record UpdateExpiryRequest(
        @NotNull(message = "Chọn thời điểm hết hạn")
        Instant hetHanAt,

        @NotNull(message = "Nhập lý do từ 10 đến 500 ký tự")
        @Size(min = 10, max = 500, message = "Nhập lý do từ 10 đến 500 ký tự")
        String lyDo,

        @NotNull(message = "Thiếu phiên bản, vui lòng tải lại")
        @PositiveOrZero(message = "Phiên bản không hợp lệ")
        Long version
) {

    public UpdateExpiryRequest {
        lyDo = Reasons.normalize(lyDo);
    }
}
