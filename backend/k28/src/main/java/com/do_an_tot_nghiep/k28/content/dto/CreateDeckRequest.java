package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import jakarta.validation.constraints.*;

public record CreateDeckRequest(
        @NotBlank(message = "Nhập tên bộ thẻ")
        @Size(max = 150, message = "Tên bộ thẻ tối đa 150 ký tự")
        String ten,

        @Size(max = 1000, message = "Mô tả tối đa 1000 ký tự")
        String moTa,

        @Pattern(
                regexp = "[1-9][0-9]{0,18}",
                message = "ID chủ đề không hợp lệ"
        )
        @DecimalMax(
                value = "9223372036854775807",
                message = "ID chủ đề không hợp lệ"
        )
        String chuDeId,

        @NotNull(message = "Chọn trình độ")
        TrinhDo trinhDo,

        QuyenTruyCap quyenTruyCap
) {
    public CreateDeckRequest {
        ten = ten == null ? null : ten.strip();
        moTa = moTa == null ? null : moTa.strip();
        quyenTruyCap = quyenTruyCap == null
                ? QuyenTruyCap.RIENG_TU
                : quyenTruyCap;
    }
}