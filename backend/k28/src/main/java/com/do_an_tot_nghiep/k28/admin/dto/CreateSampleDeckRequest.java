package com.do_an_tot_nghiep.k28.admin.dto;

import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.content.dto.CreateDeckRequest;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateSampleDeckRequest(
        @NotBlank(message = "Nhập tên bộ")
        @Size(max = 150, message = "Tên bộ tối đa 150 ký tự")
        String ten,

        @Size(max = 1000, message = "Mô tả tối đa 1000 ký tự")
        String moTa,

        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID chủ đề không hợp lệ")
        @DecimalMax(value = "9223372036854775807", message = "ID chủ đề không hợp lệ")
        String chuDeId,

        @NotNull(message = "Chọn trình độ")
        TrinhDo trinhDo,

        @NotNull(message = "Chọn mục tiêu")
        MucTieu mucTieu
) {

    public CreateDeckRequest toDeckRequest() {
        return new CreateDeckRequest(ten, moTa, chuDeId, trinhDo, QuyenTruyCap.RIENG_TU, mucTieu);
    }
}
