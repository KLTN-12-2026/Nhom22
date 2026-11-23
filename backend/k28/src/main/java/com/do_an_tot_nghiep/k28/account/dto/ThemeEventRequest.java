package com.do_an_tot_nghiep.k28.account.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record ThemeEventRequest(
        @NotBlank @Size(max = 40) String giaoDienMa,
        @NotNull LocalDate ngayLe,
        @Min(0) @Max(60) int soNgayTruoc,
        @Min(0) @Max(30) int soNgaySau
) {
}
