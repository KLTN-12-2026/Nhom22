package com.do_an_tot_nghiep.k28.practice.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record PracticePairRequest(

        @NotNull(message = "Thiếu từ cần ghép")
        @Pattern(regexp = "t[1-9][0-9]?", message = "Từ cần ghép không hợp lệ")
        String traiId,

        @NotNull(message = "Thiếu nghĩa được ghép")
        @Pattern(regexp = "n[1-9][0-9]?", message = "Nghĩa được ghép không hợp lệ")
        String phaiId
) {
}
