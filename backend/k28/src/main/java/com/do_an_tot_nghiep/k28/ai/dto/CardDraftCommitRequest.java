package com.do_an_tot_nghiep.k28.ai.dto;

import com.do_an_tot_nghiep.k28.content.service.CardText;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CardDraftCommitRequest(
        @NotNull(message = "Chọn thẻ nháp cần lưu")
        @Size(min = 1, max = 50, message = "Chọn từ 1 đến 50 thẻ nháp")
        List<@NotNull(message = "ID thẻ nháp không hợp lệ")
        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID thẻ nháp không hợp lệ") String> banNhapIds,

        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID bộ thẻ không hợp lệ")
        @DecimalMax(value = "9223372036854775807", message = "ID bộ thẻ không hợp lệ")
        String boTheId,

        @Size(max = 150, message = "Tên bộ thẻ tối đa 150 ký tự")
        String tenBoMoi,

        @Size(max = 50, message = "Sửa tối đa 50 thẻ nháp")
        List<@NotNull(message = "Nội dung sửa không hợp lệ") @Valid CardDraftEdit> sua
) {
    public CardDraftCommitRequest {
        tenBoMoi = tenBoMoi == null ? null : CardText.text(tenBoMoi);
    }
}
