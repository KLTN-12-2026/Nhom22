package com.do_an_tot_nghiep.k28.common.realtime;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class RealtimeRelay {

    static final String KENH = "vl:realtime";

    private final StringRedisTemplate redis;
    private final JsonMapper json;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void on(SuKienRealtime event) {
        try {
            redis.convertAndSend(KENH, json.writeValueAsString(event));
        } catch (RuntimeException e) {
            log.warn("Publish realtime event {} failed ({})", event.loai(), e.getClass().getSimpleName());
        }
    }
}
