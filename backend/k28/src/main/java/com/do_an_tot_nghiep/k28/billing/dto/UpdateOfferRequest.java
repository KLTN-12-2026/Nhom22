package com.do_an_tot_nghiep.k28.billing.dto;

import com.do_an_tot_nghiep.k28.admin.dto.Reasons;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;

public record UpdateOfferRequest(
        @NotBlank(message = "Chọn gói áp dụng")
        @Size(max = 20)
        String goiMa,

        @NotNull(message = "Nhập phần trăm giảm")
        @Min(value = 1, message = "Phần trăm giảm từ 1 đến 100")
        @Max(value = 100, message = "Phần trăm giảm từ 1 đến 100")
        Integer phanTramGiam,

        @NotNull(message = "Nhập số ngày")
        @Min(value = 1, message = "Số ngày từ 1 đến 730")
        @Max(value = 730, message = "Số ngày từ 1 đến 730")
        Integer soNgay,

        @Positive(message = "Số suất phải lớn hơn 0, để trống nếu không giới hạn")
        Integer soSuatToiDa,

        @Size(max = 30, message = "Tối đa 30 tên miền")
        List<@NotBlank @Size(max = 60) String> tenMien,

        @NotNull(message = "Chọn trạng thái")
        Boolean hoatDong,

        @NotNull(message = "Nhập lý do từ 10 đến 500 ký tự")
        @Size(min = 10, max = 500, message = "Nhập lý do từ 10 đến 500 ký tự")
        String lyDo,

        @NotNull(message = "Thiếu phiên bản, vui lòng tải lại")
        @PositiveOrZero(message = "Phiên bản không hợp lệ")
        Long version
) {

    public UpdateOfferRequest {
        goiMa = goiMa == null ? null : goiMa.strip();
        lyDo = Reasons.normalize(lyDo);
    }
}
