package com.do_an_tot_nghiep.k28.common.job;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties("app.jobs")
public record JobProperties(
        boolean enabled,
        int batchSize,
        int maxRetry,
        Duration lease,
        Duration backoffBase,
        Duration backoffMax
) {
}
