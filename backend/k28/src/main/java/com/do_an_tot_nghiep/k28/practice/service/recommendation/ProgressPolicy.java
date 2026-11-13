package com.do_an_tot_nghiep.k28.practice.service.recommendation;

import java.time.Duration;
import java.time.Instant;

public record ProgressPolicy(RecommendationProperties.TienBo config) {

    public Instant oldFrom(Instant now) {
        return now.minus(Duration.ofDays(config.soNgayCu()));
    }

    public Instant recentFrom(Instant now) {
        return now.minus(Duration.ofDays(config.soNgayMoi()));
    }

    public boolean matches(long soLuotCu, long soSaiCu, long soLuotMoi, long soSaiMoi) {
        return soLuotCu >= config.soLuotCuToiThieu()
                && soSaiCu >= config.soSaiCuToiThieu()
                && soSaiCu >= config.tyLeSaiCuToiThieu() * soLuotCu
                && soLuotMoi >= config.soLuotMoiToiThieu()
                && soSaiMoi <= config.soSaiMoiToiDa();
    }
}
