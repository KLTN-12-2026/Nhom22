package com.do_an_tot_nghiep.k28.content.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTopicRequest(
        @NotBlank(message = "Nhập tên chủ đề")
        @Size(max = 100, message = "Tên chủ đề tối đa 100 ký tự")
        String ten,
        @Size(max = 500, message = "Mô tả tối đa 500 ký tự")
        String moTa
) {
    public CreateTopicRequest {
        ten = ten == null ? null : ten.strip();
        moTa = moTa == null ? null : moTa.strip();
    }
}