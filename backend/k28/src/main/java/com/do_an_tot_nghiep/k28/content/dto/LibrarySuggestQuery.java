package com.do_an_tot_nghiep.k28.content.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.text.Normalizer;

public record LibrarySuggestQuery(
        @NotNull(message = "Từ khóa không được để trống")
        @Size(max = 150, message = "Từ khóa tối đa 150 ký tự")
        String q,

        @Min(value = 1, message = "limit tối thiểu là 1")
        @Max(value = 10, message = "limit tối đa là 10")
        Integer limit
) {
    public LibrarySuggestQuery {
        q = q == null || q.isBlank()
                ? null
                : Normalizer.normalize(q.strip(), Normalizer.Form.NFC);
        limit = limit == null ? 5 : limit;
    }
}
