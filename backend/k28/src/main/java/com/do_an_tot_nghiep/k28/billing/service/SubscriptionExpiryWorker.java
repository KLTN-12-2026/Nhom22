package com.do_an_tot_nghiep.k28.billing.service;

import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.billing.expiry-job.enabled", havingValue = "true", matchIfMissing = true)
public class SubscriptionExpiryWorker {

    private final Clock clock;
    private final SubscriptionExpiryService expiry;

    @Scheduled(initialDelayString = "${app.reminders.initial-delay-ms:60000}",
            fixedDelayString = "${app.reminders.interval-ms:900000}")
    public void run() {
        expiry.run(clock.instant());
    }
}
