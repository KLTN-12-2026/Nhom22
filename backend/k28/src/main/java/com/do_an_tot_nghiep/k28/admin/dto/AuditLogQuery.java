package com.do_an_tot_nghiep.k28.admin.dto;

import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AuditLogQuery(
        HanhDongQuanTri hanhDong,

        LoaiDoiTuong loai,

        @Size(max = 150, message = "Từ khóa tối đa 150 ký tự")
        String q,

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

    public AuditLogQuery {
        q = blankToNull(q);
        tuNgay = blankToNull(tuNgay);
        denNgay = blankToNull(denNgay);
        page = page == null ? 0 : page;
        size = size == null ? 20 : size;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
