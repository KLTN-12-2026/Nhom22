package com.do_an_tot_nghiep.k28.notification.service;

import java.time.Clock;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.reminders.enabled", havingValue = "true", matchIfMissing = true)
public class ReminderWorker {

    private final Clock clock;
    private final ReminderService reminderService;

    @Scheduled(initialDelayString = "${app.reminders.initial-delay-ms:60000}",
            fixedDelayString = "${app.reminders.interval-ms:900000}")
    public void run() {
        reminderService.run(clock.instant());
    }
}
