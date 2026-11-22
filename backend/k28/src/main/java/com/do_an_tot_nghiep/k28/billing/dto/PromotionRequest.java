package com.do_an_tot_nghiep.k28.billing.dto;

import com.do_an_tot_nghiep.k28.admin.dto.Reasons;
import com.do_an_tot_nghiep.k28.billing.entity.enums.ChuKy;
import com.do_an_tot_nghiep.k28.billing.entity.enums.LoaiGiam;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.Locale;

public record PromotionRequest(
        @Pattern(regexp = "^[A-Z0-9_-]{3,30}$", message = "Mã gồm 3-30 ký tự chữ in hoa, số, gạch ngang hoặc gạch dưới")
        String ma,

        @NotBlank(message = "Nhập tên khuyến mãi")
        @Size(max = 100, message = "Tên khuyến mãi tối đa 100 ký tự")
        String ten,

        @NotNull(message = "Chọn kiểu giảm")
        LoaiGiam loaiGiam,

        @NotNull(message = "Nhập mức giảm")
        @Positive(message = "Mức giảm phải lớn hơn 0")
        @Max(value = 100000000, message = "Mức giảm tối đa 100.000.000 ₫")
        Long giaTri,

        @Size(max = 20)
        String goiMa,

        ChuKy chuKy,

        @NotNull(message = "Chọn thời điểm bắt đầu")
        Instant batDauAt,

        @NotNull(message = "Chọn thời điểm kết thúc")
        Instant ketThucAt,

        @Positive(message = "Tổng lượt phải lớn hơn 0, để trống nếu không giới hạn")
        Integer tongLuot,

        @NotNull(message = "Nhập số lượt mỗi người")
        @Min(value = 1, message = "Mỗi người được dùng tối thiểu 1 lượt")
        @Max(value = 100, message = "Mỗi người được dùng tối đa 100 lượt")
        Integer luotMoiNguoi,

        @NotNull(message = "Chọn có giới hạn lần mua đầu hay không")
        Boolean chiLanDau,

        @NotNull(message = "Chọn trạng thái")
        Boolean hoatDong,

        @Size(min = 10, max = 500, message = "Nhập lý do từ 10 đến 500 ký tự")
        String lyDo,

        @PositiveOrZero(message = "Phiên bản không hợp lệ")
        Long version
) {

    public PromotionRequest {
        ma = ma == null || ma.isBlank() ? null : ma.strip().toUpperCase(Locale.ROOT);
        ten = ten == null ? null : ten.strip();
        goiMa = goiMa == null || goiMa.isBlank() ? null : goiMa.strip();
        lyDo = Reasons.normalize(lyDo);
    }
}
