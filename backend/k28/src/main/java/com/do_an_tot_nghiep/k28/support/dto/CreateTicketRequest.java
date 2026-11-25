package com.do_an_tot_nghiep.k28.support.dto;

import com.do_an_tot_nghiep.k28.support.entity.enums.DoUuTien;
import com.do_an_tot_nghiep.k28.support.entity.enums.LoaiVanDe;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateTicketRequest(
        @NotBlank(message = "Vui lòng nhập tiêu đề")
        @Size(max = 150, message = "Tiêu đề không được vượt quá 150 ký tự")
        String tieuDe,
        @NotBlank(message = "Vui lòng nhập mô tả")
        @Size(max = 5000, message = "Mô tả tối đa 5000 ký tự")
        String moTa,
        @NotNull(message = "Chọn loại vấn đề")
        LoaiVanDe loaiVanDe,
        @NotNull(message = "Chọn độ ưu tiên")
        DoUuTien doUuTien
) {
}
