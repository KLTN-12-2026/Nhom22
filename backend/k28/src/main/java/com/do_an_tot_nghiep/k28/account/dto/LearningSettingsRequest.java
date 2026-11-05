package com.do_an_tot_nghiep.k28.account.dto;

import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import jakarta.validation.constraints.*;

import java.util.List;

public record LearningSettingsRequest(
        @NotNull(message = "Chọn trình độ tự đánh giá")
        TrinhDo trinhDo,

        @NotNull(message = "Chọn mục tiêu học")
        MucTieu mucTieu,

        @NotNull(message = "Nhập số phút học mỗi ngày")
        @Min(value = 1, message = "Thời gian học từ 1 đến 240 phút mỗi ngày")
        @Max(value = 240, message = "Thời gian học từ 1 đến 240 phút mỗi ngày")
        Integer phutMoiNgay,

        @NotNull(message = "Nhập số từ mới mỗi ngày")
        @Min(value = 0, message = "Số từ mới từ 0 đến 100 mỗi ngày")
        @Max(value = 100, message = "Số từ mới từ 0 đến 100 mỗi ngày")
        Integer tuMoiMoiNgay,

        @NotNull(message = "Gửi danh sách chủ đề, dùng [] nếu không chọn")
        @Size(max = 5, message = "Chọn tối đa 5 chủ đề")
        List<
                @NotNull(message = "ID chủ đề không được null")
                @Pattern(
                        regexp = "[1-9][0-9]{0,18}",
                        message = "ID chủ đề phải là số nguyên dương"
                )
                        String
                > chuDeIds,

        @NotNull(message = "Thiếu phiên bản, vui lòng tải lại")
        Long version
) {
}
