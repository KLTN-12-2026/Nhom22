package com.do_an_tot_nghiep.k28.dictionary.dto;

import com.do_an_tot_nghiep.k28.dictionary.entity.enums.ChieuTuDien;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.text.Normalizer;

public record DictionaryQuery(
        @NotBlank(message = "Nhập từ cần tra")
        @Size(max = 120, message = "Từ cần tra tối đa 120 ký tự")
        String q,

        ChieuTuDien chieu,

        @Min(value = 1, message = "limit tối thiểu là 1")
        @Max(value = 20, message = "limit tối đa là 20")
        Integer limit
) {
    public DictionaryQuery {
        q = q == null ? null : Normalizer.normalize(q.strip(), Normalizer.Form.NFC).replaceAll("\\s+", " ");
        chieu = chieu == null ? ChieuTuDien.ANH_VIET : chieu;
        limit = limit == null ? 10 : limit;
    }
}
