package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.content.service.CardText;
import jakarta.validation.constraints.Size;

public record PublishRequestCreateRequest(
        @Size(max = 500, message = "Lời nhắn tối đa 500 ký tự")
        String loiNhan
) {
    public PublishRequestCreateRequest {
        loiNhan = loiNhan == null || loiNhan.isBlank() ? null : CardText.text(loiNhan);
    }
}
