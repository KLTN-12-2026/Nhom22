package com.do_an_tot_nghiep.k28.billing.dto;

import com.do_an_tot_nghiep.k28.admin.dto.Reasons;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record UpdatePlanRequest(
        @NotBlank(message = "Nhập tên gói")
        @Size(max = 50, message = "Tên gói tối đa 50 ký tự")
        String ten,

        @NotNull(message = "Nhập giá tháng")
        @Min(value = 0, message = "Giá tháng không được âm")
        @Max(value = 100000000, message = "Giá tháng tối đa 100.000.000 ₫")
        Long giaThang,

        @NotNull(message = "Nhập giá năm")
        @Min(value = 0, message = "Giá năm không được âm")
        @Max(value = 1000000000, message = "Giá năm tối đa 1.000.000.000 ₫")
        Long giaNam,

        @Positive(message = "Giới hạn thẻ phải lớn hơn 0, để trống nếu không giới hạn")
        Integer gioiHanThe,

        @NotNull(message = "Chọn có đánh giá phát âm hay không")
        Boolean phatAm,

        @NotNull(message = "Chọn trạng thái bán")
        Boolean hoatDong,

        @Size(min = 10, max = 500, message = "Nhập lý do từ 10 đến 500 ký tự")
        String lyDo,

        @NotNull(message = "Thiếu phiên bản, vui lòng tải lại")
        @PositiveOrZero(message = "Phiên bản không hợp lệ")
        Long version
) {

    public UpdatePlanRequest {
        ten = ten == null ? null : ten.strip();
        lyDo = Reasons.normalize(lyDo);
    }
}
