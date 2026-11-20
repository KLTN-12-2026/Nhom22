package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.content.entity.enums.QuyetDinhCongKhai;
import com.do_an_tot_nghiep.k28.content.service.CardText;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record PublishDecisionRequest(
        @NotNull(message = "Chọn quyết định DUYET, TU_CHOI hoặc THU_HOI")
        QuyetDinhCongKhai quyetDinh,

        @Size(min = 10, max = 500, message = "Lý do từ 10 đến 500 ký tự")
        String lyDo,

        @NotNull(message = "Thiếu phiên bản, vui lòng tải lại")
        @PositiveOrZero(message = "Phiên bản không hợp lệ")
        Long version
) {
    public PublishDecisionRequest {
        lyDo = lyDo == null || lyDo.isBlank() ? null : CardText.text(lyDo);
    }

    @AssertTrue(message = "Từ chối hoặc thu hồi phải có lý do")
    public boolean isLyDoPresent() {
        return quyetDinh == null || quyetDinh == QuyetDinhCongKhai.DUYET || lyDo != null;
    }
}
