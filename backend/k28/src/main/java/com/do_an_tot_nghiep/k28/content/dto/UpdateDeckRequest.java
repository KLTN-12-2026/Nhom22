package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import jakarta.validation.constraints.*;

public record UpdateDeckRequest(
        @Size(min = 1, max = 150, message = "Tên bộ thẻ từ 1 đến 150 ký tự")
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

        Boolean boChuDe,

        TrinhDo trinhDo,

        QuyenTruyCap quyenTruyCap,

        @NotNull(message = "Thiếu phiên bản, vui lòng tải lại")
        @PositiveOrZero(message = "Phiên bản không hợp lệ")
        Long version
) {
    public UpdateDeckRequest {
        ten = ten == null ? null : ten.strip();
        moTa = moTa == null ? null : moTa.strip();
        boChuDe = Boolean.TRUE.equals(boChuDe);
    }

    @AssertTrue(message = "Không gửi chuDeId khi yêu cầu bỏ chủ đề")
    public boolean isTopicSelectionValid() {
        return !boChuDe || chuDeId == null;
    }
}
