package com.do_an_tot_nghiep.k28.engagement.dto;

import com.do_an_tot_nghiep.k28.engagement.entity.enums.*;
import com.do_an_tot_nghiep.k28.content.service.CardText;
import jakarta.validation.constraints.*;

public record BadgeWriteRequest(
        @NotBlank(message = "Nhập mã")
        @Pattern(regexp = "[A-Z][A-Z0-9_]{0,29}", message = "Mã tối đa 30 ký tự, bắt đầu bằng chữ và chỉ gồm A–Z, 0–9, dấu gạch dưới") String ma,
        @NotBlank(message = "Nhập tên") @Size(max = 100, message = "Tên tối đa 100 ký tự") String ten,
        @NotBlank(message = "Nhập mô tả") @Size(max = 255, message = "Mô tả tối đa 255 ký tự") String moTa,
        @NotNull LoaiDieuKienHuyHieu loaiDieuKien,
        @NotNull @Positive(message = "Ngưỡng phải lớn hơn 0") Integer nguong,
        @NotNull @PositiveOrZero(message = "Thứ tự không được âm") Integer thuTu,
        @NotNull Boolean hoatDong,
        @PositiveOrZero(message = "Phiên bản không hợp lệ") Long version
) {
    public BadgeWriteRequest {
        ma = ma == null ? null : ma.strip();
        ten = ten == null ? null : CardText.text(ten);
        moTa = moTa == null ? null : CardText.text(moTa);
    }
}
