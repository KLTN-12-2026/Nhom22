package com.do_an_tot_nghiep.k28.ai.dto;

import com.do_an_tot_nghiep.k28.ai.entity.enums.LoaiYeuCauAi;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record AiHistoryQuery(

        LoaiYeuCauAi loai,

        @Min(value = 0, message = "page phải không âm")
        Integer page,

        @Min(value = 1, message = "size tối thiểu là 1")
        @Max(value = 100, message = "size tối đa là 100")
        Integer size
) {

    public AiHistoryQuery {
        page = page == null ? 0 : page;
        size = size == null ? 20 : size;
    }

    @AssertTrue(message = "Vị trí phân trang vượt giới hạn hỗ trợ")
    public boolean isOffsetValid() {
        return (long) page * size <= Integer.MAX_VALUE;
    }
}
