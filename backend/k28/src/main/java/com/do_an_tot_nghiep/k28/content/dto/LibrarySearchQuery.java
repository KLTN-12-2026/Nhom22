package com.do_an_tot_nghiep.k28.content.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.text.Normalizer;

public record LibrarySearchQuery(
        @NotNull(message = "Từ khóa không được để trống")
        @Size(max = 150, message = "Từ khóa tối đa 150 ký tự")
        String q,

        @Min(value = 0, message = "page phải không âm")
        Integer page,

        @Min(value = 1, message = "size tối thiểu là 1")
        @Max(value = 50, message = "size tối đa là 50")
        Integer size
) {
    public LibrarySearchQuery {
        q = q == null || q.isBlank()
                ? null
                : Normalizer.normalize(q.strip(), Normalizer.Form.NFC);
        page = page == null ? 0 : page;
        size = size == null ? 20 : size;
    }

    @AssertTrue(message = "Vị trí phân trang vượt giới hạn hỗ trợ")
    public boolean isOffsetValid() {
        return (long) page * size <= Integer.MAX_VALUE;
    }
}
