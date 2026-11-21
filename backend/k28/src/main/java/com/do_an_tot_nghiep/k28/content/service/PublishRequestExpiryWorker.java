package com.do_an_tot_nghiep.k28.content.service;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.publish-requests.expiry-job.enabled", havingValue = "true", matchIfMissing = true)
public class PublishRequestExpiryWorker {

    private final PublishRequestService service;

    @Scheduled(initialDelayString = "${app.reminders.initial-delay-ms:60000}",
            fixedDelayString = "${app.publish-requests.expiry-job.interval-ms:3600000}")
    public void run() {
        service.expireOverdue();
    }
}
