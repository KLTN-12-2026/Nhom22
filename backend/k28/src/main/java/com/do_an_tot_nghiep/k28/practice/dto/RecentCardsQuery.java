package com.do_an_tot_nghiep.k28.practice.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Set;

public record RecentCardsQuery(

        @Size(max = 4, message = "Chọn tối đa 4 mức chấm")
        List<@NotNull(message = "Mức chấm phải là QUEN, KHO, NHO hoặc DE")
             @Pattern(regexp = "QUEN|KHO|NHO|DE", message = "Mức chấm phải là QUEN, KHO, NHO hoặc DE") String> danhGia
) {

    public Set<DanhGia> ratings() {
        return CreatePracticeRequest.ratingsOf(danhGia);
    }
}
