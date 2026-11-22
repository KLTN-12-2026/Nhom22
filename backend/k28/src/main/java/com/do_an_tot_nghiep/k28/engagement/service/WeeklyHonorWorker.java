package com.do_an_tot_nghiep.k28.engagement.service;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.leaderboard.honor-job.enabled", havingValue = "true", matchIfMissing = true)
public class WeeklyHonorWorker {

    private final WeeklyHonorService honors;

    @Scheduled(initialDelayString = "${app.leaderboard.honor-job.initial-delay-ms:90000}",
            fixedDelayString = "${app.leaderboard.honor-job.interval-ms:3600000}")
    public void run() {
        honors.finalizeLastWeek();
    }
}
