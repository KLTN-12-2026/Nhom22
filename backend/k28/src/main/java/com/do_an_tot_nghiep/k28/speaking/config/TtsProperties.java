package com.do_an_tot_nghiep.k28.speaking.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.tts")
public record TtsProperties(
        String provider,
        String model,
        String giong,
        String ngonNgu,
        String phienBan,
        int maxKyTu,
        int maxBytes,
        Duration readTimeout,
        Fake fake
) {

    public record Fake(String cheDo, Duration doTre) {
    }
}
