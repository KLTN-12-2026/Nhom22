package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CreateSessionRequest(

        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID bộ thẻ không hợp lệ")
        @DecimalMax(value = "9223372036854775807", message = "ID bộ thẻ không hợp lệ")
        String boTheId,

        @NotNull(message = "Chọn chiều học Anh → Việt hoặc Việt → Anh")
        ChieuHoc chieuHoc,

        @NotNull(message = "Chọn 5, 10 hoặc 20 phút")
        Integer quyThoiGian
) {
}
