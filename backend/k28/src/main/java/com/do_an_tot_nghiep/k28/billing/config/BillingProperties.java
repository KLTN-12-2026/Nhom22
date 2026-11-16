package com.do_an_tot_nghiep.k28.billing.config;

import java.time.Duration;
import java.time.ZoneId;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.billing")
public record BillingProperties(
        String provider,
        boolean enforce,
        ZoneId businessZone,
        Duration orderTtl,
        boolean demoTools,
        Vnpay vnpay,
        Fake fake
) {

    public record Vnpay(String tmnCode, String hashSecret, String payUrl, String returnUrl) {
    }

    public record Fake(String ketQua, String hashSecret) {
    }
}
