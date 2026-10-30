package com.do_an_tot_nghiep.k28.learning.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.text.Normalizer;

public record DeckProgressQuery(
        @Size(max = 150, message = "Từ khóa tối đa 150 ký tự")
        String q,

        @Pattern(
                regexp = "MOI|DANG_HOC|DEN_HAN|QUA_HAN|TAM_NGUNG",
                message = "Nhóm phải là MOI, DANG_HOC, DEN_HAN, QUA_HAN hoặc TAM_NGUNG"
        )
        String nhom,

        @Min(value = 0, message = "page phải không âm")
        Integer page,

        @Min(value = 1, message = "size tối thiểu là 1")
        @Max(value = 100, message = "size tối đa là 100")
        Integer size
) {

    public DeckProgressQuery {
        q = q == null || q.isBlank()
                ? null
                : Normalizer.normalize(q.strip(), Normalizer.Form.NFC);
        nhom = nhom == null || nhom.isBlank() ? null : nhom.strip();
        page = page == null ? 0 : page;
        size = size == null ? 20 : size;
    }

    public String searchPattern() {
        if (q == null) {
            return null;
        }
        String escaped = q
                .replace("!", "!!")
                .replace("%", "!%")
                .replace("_", "!_");
        return "%" + escaped + "%";
    }

    @AssertTrue(message = "Vị trí phân trang vượt giới hạn hỗ trợ")
    public boolean isOffsetValid() {
        return (long) page * size <= Integer.MAX_VALUE;
    }
}
