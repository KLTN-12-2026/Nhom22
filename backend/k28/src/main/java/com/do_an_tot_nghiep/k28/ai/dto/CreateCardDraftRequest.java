package com.do_an_tot_nghiep.k28.ai.dto;

import com.do_an_tot_nghiep.k28.content.service.CardText;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.Pattern;

public record CreateCardDraftRequest(
        String doanVan,

        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID tệp không hợp lệ")
        @DecimalMax(value = "9223372036854775807", message = "ID tệp không hợp lệ")
        String tepId,

        @Pattern(regexp = "[1-9][0-9]{0,18}", message = "ID bộ thẻ không hợp lệ")
        @DecimalMax(value = "9223372036854775807", message = "ID bộ thẻ không hợp lệ")
        String boTheId
) {
    public CreateCardDraftRequest {
        doanVan = doanVan == null ? null : CardText.text(doanVan);
    }
}
