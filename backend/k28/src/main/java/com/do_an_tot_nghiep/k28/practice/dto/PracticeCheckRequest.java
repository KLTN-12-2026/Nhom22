package com.do_an_tot_nghiep.k28.practice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record PracticeCheckRequest(

        @Pattern(regexp = "o[1-9][0-9]?", message = "Phương án không hợp lệ")
        String luaChonId,

        @Size(max = 200, message = "Câu trả lời tối đa 200 ký tự")
        String noiDung,

        @Size(max = 5, message = "Tối đa 5 cặp ghép")
        List<@NotNull(message = "Cặp ghép không hợp lệ") @Valid PracticePairRequest> cap
) {
}
