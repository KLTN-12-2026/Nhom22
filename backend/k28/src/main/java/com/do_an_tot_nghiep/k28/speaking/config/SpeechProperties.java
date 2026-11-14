package com.do_an_tot_nghiep.k28.speaking.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.speech")
public record SpeechProperties(
        String provider,
        String ngonNgu,
        int maxGiay,
        int maxBytes,
        int maxKyTu,
        Duration connectTimeout,
        Duration readTimeout,
        Azure azure,
        Fake fake
) {

    public record Azure(String region, String apiKey) {
    }

    public record Fake(String cheDo, Duration doTre) {
    }
}
