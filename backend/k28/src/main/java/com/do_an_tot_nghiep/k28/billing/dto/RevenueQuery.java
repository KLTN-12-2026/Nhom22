package com.do_an_tot_nghiep.k28.billing.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record RevenueQuery(
        @NotNull(message = "Chọn kỳ THANG, QUY hoặc NAM")
        KyDoanhThu ky,

        @Min(value = 2000, message = "Năm từ 2000 đến 2100")
        @Max(value = 2100, message = "Năm từ 2000 đến 2100")
        Integer nam,

        @Min(value = 2000, message = "Năm từ 2000 đến 2100")
        @Max(value = 2100, message = "Năm từ 2000 đến 2100")
        Integer tuNam,

        @Min(value = 2000, message = "Năm từ 2000 đến 2100")
        @Max(value = 2100, message = "Năm từ 2000 đến 2100")
        Integer denNam
) {

    @AssertTrue(message = "Khoảng năm không hợp lệ: từ năm phải trước hoặc bằng đến năm, tối đa 20 năm")
    public boolean isYearRangeValid() {
        return tuNam == null || denNam == null || (tuNam <= denNam && denNam - tuNam < 20);
    }
}
