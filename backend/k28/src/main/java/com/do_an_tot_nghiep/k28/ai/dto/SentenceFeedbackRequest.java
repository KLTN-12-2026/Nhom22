package com.do_an_tot_nghiep.k28.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SentenceFeedbackRequest(
        @NotBlank @Size(max = 100) String tu,
        @NotBlank @Size(max = 500) String cau
) {
}
