package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.content.service.CardText;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTagRequest(
        @NotBlank(message = "Nhập tên nhãn")
        @Size(max = 50, message = "Tên nhãn tối đa 50 ký tự")
        String ten
) {
    public CreateTagRequest {
        ten = ten == null ? null : CardText.text(ten);
    }
}