package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;

public record HistoryQuery(
        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID phiên học không hợp lệ")
        @DecimalMax(value = "9223372036854775807", message = "ID phiên học không hợp lệ")
        String phienId,

        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID thẻ không hợp lệ")
        @DecimalMax(value = "9223372036854775807", message = "ID thẻ không hợp lệ")
        String theId,

        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID bộ thẻ không hợp lệ")
        @DecimalMax(value = "9223372036854775807", message = "ID bộ thẻ không hợp lệ")
        String boTheId,

        @Pattern(regexp = "EN_VI|VI_EN", message = "Chiều học phải là EN_VI hoặc VI_EN")
        String chieuHoc,

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

    public HistoryQuery {
        phienId = blankToNull(phienId);
        theId = blankToNull(theId);
        boTheId = blankToNull(boTheId);
        chieuHoc = blankToNull(chieuHoc);
        tuNgay = blankToNull(tuNgay);
        denNgay = blankToNull(denNgay);
        page = page == null ? 0 : page;
        size = size == null ? 20 : size;
    }

    public Long sessionId() {
        return phienId == null ? null : Long.valueOf(phienId);
    }

    public Long cardId() {
        return theId == null ? null : Long.valueOf(theId);
    }

    public Long deckId() {
        return boTheId == null ? null : Long.valueOf(boTheId);
    }

    public ChieuHoc direction() {
        return chieuHoc == null ? null : ChieuHoc.valueOf(chieuHoc);
    }

    @AssertTrue(message = "Vị trí phân trang vượt giới hạn hỗ trợ")
    public boolean isOffsetValid() {
        return (long) page * size <= Integer.MAX_VALUE;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
