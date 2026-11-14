package com.do_an_tot_nghiep.k28.practice.service;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("app.notebook")
public record NotebookProperties(
        @Min(1) int quenNhieu,
        @Min(1) int quenNhieuNgay,
        @Min(1) int chinhTaLuot,
        @Min(1) int chinhTaSai,
        @Min(1) int capNham
) {
}
