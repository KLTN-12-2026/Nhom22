package com.do_an_tot_nghiep.k28.billing.dto;

import com.do_an_tot_nghiep.k28.admin.dto.Reasons;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ExpiryCheckRequest(
        @NotNull(message = "Nhập lý do từ 10 đến 500 ký tự")
        @Size(min = 10, max = 500, message = "Nhập lý do từ 10 đến 500 ký tự")
        String lyDo
) {

    public ExpiryCheckRequest {
        lyDo = Reasons.normalize(lyDo);
    }
}
