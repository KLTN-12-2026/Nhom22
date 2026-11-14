package com.do_an_tot_nghiep.k28.ai.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.ai")
public record AiProperties(
        String provider,
        OpenAi openai,
        Fake fake,
        CardDraft cardDraft
) {

    public record OpenAi(
            String baseUrl,
            String apiKey,
            String model,
            Duration connectTimeout,
            Duration readTimeout,
            int maxOutputTokens,
            double temperature
    ) {
        @Override
        public String toString() {
            return "OpenAi[baseUrl=" + baseUrl + ", model=" + model + "]";
        }
    }

    public record Fake(String cheDo, Duration doTre) {
    }

    public record CardDraft(
            String phienBanPrompt,
            int maxKyTu,
            int maxThe,
            long maxTepBytes,
            int maxTuMoiThe
    ) {
    }
}
