package com.do_an_tot_nghiep.k28.content.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LibraryCardQuery(
        @Min(value = 0, message = "page phải không âm")
        Integer page,

        @Min(value = 1, message = "size tối thiểu là 1")
        @Max(value = 100, message = "size tối đa là 100")
        Integer size,

        @Pattern(
                regexp = "[1-9][0-9]{0,18}",
                message = "ID thẻ không hợp lệ"
        )
        @DecimalMax(
                value = "9223372036854775807",
                message = "ID thẻ không hợp lệ"
        )
        String theId,

        @Size(max = 100, message = "Từ khóa tối đa 100 ký tự")
        String q,

        CardSort sapXep
) {
    public LibraryCardQuery {
        page = page == null ? 0 : page;
        size = size == null ? 20 : size;
        theId = theId == null || theId.isBlank() ? null : theId.strip();
        q = q == null || q.isBlank() ? null : q.strip();
        sapXep = CardSort.orDefault(sapXep);
    }

    public Long cardId() {
        return theId == null ? null : Long.valueOf(theId);
    }

    @AssertTrue(message = "Vị trí phân trang vượt giới hạn hỗ trợ")
    public boolean isOffsetValid() {
        return (long) page * size <= Integer.MAX_VALUE;
    }
}