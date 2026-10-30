package com.do_an_tot_nghiep.k28.learning.dto;

import jakarta.validation.constraints.NotNull;

public record SuspendProgressRequest(
        @NotNull(message = "Thiếu trạng thái tạm ngưng")
        Boolean tamNgung
) {
}
