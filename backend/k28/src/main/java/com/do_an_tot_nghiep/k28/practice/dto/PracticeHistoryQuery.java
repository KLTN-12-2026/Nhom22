package com.do_an_tot_nghiep.k28.practice.dto;

import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiBai;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

public record PracticeHistoryQuery(

        @Pattern(
                regexp = "CHON_NGHIA|CHON_TU|GHEP_TU|DIEN_CHO_TRONG|NHAP_TU_THEO_NGHIA|NGHE_VIET|PHAN_BIET_CAP|TONG_HOP",
                message = "Dạng bài không hợp lệ")
        String loaiBai,

        @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Ngày phải có dạng YYYY-MM-DD")
        String tuNgay,

        @Pattern(regexp = "\\d{4}-\\d{2}-\\d{2}", message = "Ngày phải có dạng YYYY-MM-DD")
        String denNgay,

        @Min(value = 0, message = "page phải không âm")
        Integer page,

        @Min(value = 1, message = "size tối thiểu là 1")
        @Max(value = 100, message = "size tối đa là 100")
        Integer size
) {

    public PracticeHistoryQuery {
        loaiBai = blankToNull(loaiBai);
        tuNgay = blankToNull(tuNgay);
        denNgay = blankToNull(denNgay);
        page = page == null ? 0 : page;
        size = size == null ? 20 : size;
    }

    public LoaiBai type() {
        return loaiBai == null ? null : LoaiBai.valueOf(loaiBai);
    }

    @AssertTrue(message = "Vị trí phân trang vượt giới hạn hỗ trợ")
    public boolean isOffsetValid() {
        return (long) page * size <= Integer.MAX_VALUE;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
