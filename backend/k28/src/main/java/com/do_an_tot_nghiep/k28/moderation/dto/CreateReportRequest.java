package com.do_an_tot_nghiep.k28.moderation.dto;

import com.do_an_tot_nghiep.k28.moderation.entity.enums.LoaiDoiTuongBaoCao;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.LyDoBaoCao;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record CreateReportRequest(
        @NotNull(message = "Chọn loại nội dung")
        LoaiDoiTuongBaoCao loaiDoiTuong,
        @NotNull(message = "Thiếu ID nội dung")
        @Positive(message = "ID nội dung phải là số nguyên dương")
        Long doiTuongId,
        @NotNull(message = "Chọn lý do báo cáo")
        LyDoBaoCao lyDo,
        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        String moTa
) {
}
