package com.do_an_tot_nghiep.k28.learning.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

public record ResetProgressRequest(
        @NotNull(message = "Cần xác nhận đặt lại tiến độ")
        @AssertTrue(message = "Cần xác nhận đặt lại tiến độ")
        Boolean xacNhan
) {
}
