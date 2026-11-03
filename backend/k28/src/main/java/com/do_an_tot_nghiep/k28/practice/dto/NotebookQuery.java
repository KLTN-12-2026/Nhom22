package com.do_an_tot_nghiep.k28.practice.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

public record NotebookQuery(

        @Pattern(
                regexp = "NGHIA|CHINH_TA|NGHE|NGU_CANH|CAP_NHAM|QUEN_NHIEU|DANH_DAU",
                message = "Nhóm lỗi không hợp lệ")
        String nhomLoi,

        @Min(value = 0, message = "page phải không âm")
        Integer page,

        @Min(value = 1, message = "size tối thiểu là 1")
        @Max(value = 100, message = "size tối đa là 100")
        Integer size
) {

    public NotebookQuery {
        nhomLoi = nhomLoi == null || nhomLoi.isBlank() ? null : nhomLoi.strip();
        page = page == null ? 0 : page;
        size = size == null ? 20 : size;
    }

    @AssertTrue(message = "Vị trí phân trang vượt giới hạn hỗ trợ")
    public boolean isOffsetValid() {
        return (long) page * size <= Integer.MAX_VALUE;
    }
}
