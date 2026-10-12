package com.do_an_tot_nghiep.k28.content.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;

public record CsvMappingRequest(
        @NotNull
        @Size(min = 2, max = 9)
        Map<@NotBlank String, @NotBlank @Size(max = 200) String> columns
) {

    @JsonCreator(mode = JsonCreator.Mode.DELEGATING)
    public CsvMappingRequest {
    }
}
