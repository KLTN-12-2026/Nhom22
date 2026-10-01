package com.do_an_tot_nghiep.k28.content.dto;

import com.do_an_tot_nghiep.k28.content.entity.enums.LoaiTep;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record UploadRequest(
        @NotNull
        LoaiTep loai,
        @NotBlank
        @Size(max = 50)
        String mimeType,
        @Positive
        long kichThuoc,
        @NotBlank
        @Pattern(regexp = "[a-fA-F0-9]{64}")
        String checksum
) {
}
