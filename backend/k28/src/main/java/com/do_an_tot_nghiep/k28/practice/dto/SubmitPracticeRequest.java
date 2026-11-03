package com.do_an_tot_nghiep.k28.practice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;

public record SubmitPracticeRequest(

        @NotBlank(message = "Thiếu khóa nộp bài")
        @Size(max = 128, message = "Khóa nộp bài tối đa 128 ký tự")
        @Pattern(regexp = "[A-Za-z0-9._:-]*", message = "Khóa nộp bài chỉ gồm chữ, số và . _ : -")
        String submitKey,

        @NotNull(message = "Thiếu thời gian làm bài")
        @PositiveOrZero(message = "Thời gian làm bài không được âm")
        Long thoiGian,

        @NotNull(message = "Thiếu danh sách trả lời")
        @Size(max = 20, message = "Tối đa 20 câu trả lời")
        List<@NotNull(message = "Câu trả lời không hợp lệ") @Valid PracticeAnswerRequest> traLoi
) {
}
