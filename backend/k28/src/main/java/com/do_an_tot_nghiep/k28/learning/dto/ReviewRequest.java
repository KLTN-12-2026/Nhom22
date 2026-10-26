package com.do_an_tot_nghiep.k28.learning.dto;

import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record ReviewRequest(

        @NotBlank(message = "Thiếu mã sự kiện")
        @Size(max = 128, message = "Mã sự kiện tối đa 128 ký tự")
        @Pattern(regexp = "[A-Za-z0-9._:-]*", message = "Mã sự kiện chỉ gồm chữ, số và . _ : -")
        String clientEventId,

        @NotNull(message = "Thiếu thẻ")
        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID thẻ không hợp lệ")
        @DecimalMax(value = "9223372036854775807", message = "ID thẻ không hợp lệ")
        String theId,

        @NotNull(message = "Thiếu chiều học")
        ChieuHoc chieuHoc,

        @NotNull(message = "Chọn một trong bốn mức: Quên, Khó, Nhớ, Dễ")
        DanhGia danhGia,

        @NotNull(message = "Thiếu phiên bản tiến độ")
        @PositiveOrZero(message = "Phiên bản tiến độ không hợp lệ")
        Long expectedVersion,

        @NotNull(message = "Thiếu thời gian trả lời")
        @PositiveOrZero(message = "Thời gian trả lời không hợp lệ")
        Long thoiGianTraLoiMs
) {
}
