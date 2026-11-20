package com.do_an_tot_nghiep.k28.ai.config;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.ai.image")
public record ImageProperties(String provider, int maxBytes, Imagen imagen) {

    public record Imagen(
            String baseUrl,
            String apiKey,
            String model,
            int kichThuoc,
            Duration connectTimeout,
            Duration readTimeout
    ) {
        @Override
        public String toString() {
            return "Imagen[baseUrl=" + baseUrl + ", model=" + model + "]";
        }
    }
}
