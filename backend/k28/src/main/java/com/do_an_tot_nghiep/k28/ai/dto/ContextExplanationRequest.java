package com.do_an_tot_nghiep.k28.ai.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContextExplanationRequest(
        @NotBlank @Size(max = 100) String tu,
        @Size(max = 1000) String nguCanh
) {
}
