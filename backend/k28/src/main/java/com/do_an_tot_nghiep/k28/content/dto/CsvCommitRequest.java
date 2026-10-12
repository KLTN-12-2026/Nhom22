package com.do_an_tot_nghiep.k28.content.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CsvCommitRequest(
        @NotNull(message = "Chọn dòng cần nhập")
        @Size(min = 1, max = 1000, message = "Chọn từ 1 đến 1000 dòng")
        List<@NotNull(message = "Số dòng không được null") @Min(value = 1, message = "Số dòng phải từ 1")
        @Max(value = 1000, message = "Số dòng không vượt quá 1000") Integer> rowNumbers
) {
}