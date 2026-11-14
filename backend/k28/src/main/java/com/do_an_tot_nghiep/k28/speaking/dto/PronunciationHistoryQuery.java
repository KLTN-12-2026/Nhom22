package com.do_an_tot_nghiep.k28.speaking.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

public record PronunciationHistoryQuery(

        @Pattern(regexp = "[1-9]\\d{0,18}", message = "theId không hợp lệ")
        String theId,

        @Min(value = 0, message = "page phải không âm")
        Integer page,

        @Min(value = 1, message = "size tối thiểu là 1")
        @Max(value = 100, message = "size tối đa là 100")
        Integer size
) {

    public PronunciationHistoryQuery {
        theId = theId == null || theId.isBlank() ? null : theId.strip();
        page = page == null ? 0 : page;
        size = size == null ? 20 : size;
    }

    public Long cardId() {
        return theId == null ? null : Long.valueOf(theId);
    }

    @AssertTrue(message = "Vị trí phân trang vượt giới hạn hỗ trợ")
    public boolean isOffsetValid() {
        return (long) page * size <= Integer.MAX_VALUE;
    }
}
