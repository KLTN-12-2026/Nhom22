package com.do_an_tot_nghiep.k28.practice.service.recommendation;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("app.recommendations")
public record RecommendationProperties(
        @Min(1) int toiDaGoiY,
        @Min(1) int toiDaMoiLyDo,
        @Min(1) int toiDaTheQuaHan,
        @NotNull @Valid TienBo tienBo,
        @NotNull @Valid PhatAmThap phatAmThap
) {

    public record TienBo(
            @Min(2) int soNgayCu,
            @Min(1) int soNgayMoi,
            @Min(1) int soLuotCuToiThieu,
            @Min(1) int soSaiCuToiThieu,
            @DecimalMin("0.0") @DecimalMax("1.0") double tyLeSaiCuToiThieu,
            @Min(1) int soLuotMoiToiThieu,
            @Min(0) int soSaiMoiToiDa
    ) {

        public TienBo {
            if (soNgayCu <= soNgayMoi) {
                throw new IllegalArgumentException(
                        "app.recommendations.tien-bo.so-ngay-cu phải lớn hơn so-ngay-moi");
            }
        }
    }

    public record PhatAmThap(boolean enabled, @Min(0) @Max(100) int diemToiThieu) {
    }
}
