package com.do_an_tot_nghiep.k28.billing.dto;

import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record AdminPaymentQuery(

        TrangThaiGiaoDich trangThai,

        @Size(max = 20, message = "Mã gói tối đa 20 ký tự")
        String goiMa,

        LocalDate tuNgay,

        LocalDate denNgay,

        @Size(max = 255, message = "Email tối đa 255 ký tự")
        String email,

        @Min(value = 0, message = "page phải không âm")
        Integer page,

        @Min(value = 1, message = "size tối thiểu là 1")
        @Max(value = 100, message = "size tối đa là 100")
        Integer size
) {

    public AdminPaymentQuery {
        goiMa = goiMa == null || goiMa.isBlank() ? null : goiMa.strip();
        email = email == null || email.isBlank() ? null : email.strip();
        page = page == null ? 0 : page;
        size = size == null ? 20 : size;
    }

    @AssertTrue(message = "Từ ngày phải trước hoặc bằng đến ngày")
    public boolean isRangeValid() {
        return tuNgay == null || denNgay == null || !tuNgay.isAfter(denNgay);
    }

    @AssertTrue(message = "Vị trí phân trang vượt giới hạn hỗ trợ")
    public boolean isOffsetValid() {
        return (long) page * size <= Integer.MAX_VALUE;
    }
}
