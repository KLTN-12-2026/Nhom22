package com.do_an_tot_nghiep.k28.common.realtime;

import com.do_an_tot_nghiep.k28.common.realtime.SuKienRealtime.PhamVi;
import java.util.EnumMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SystemHealthMonitor {

    public enum ThanhPhan {
        CSDL,
        REDIS
    }

    private final JdbcTemplate jdbc;
    private final RedisConnectionFactory redis;
    private final RealtimeHub hub;
    private final Map<ThanhPhan, Boolean> trangThai = new EnumMap<>(ThanhPhan.class);

    @Scheduled(initialDelayString = "${app.realtime.health-initial-delay-ms:30000}",
            fixedDelayString = "${app.realtime.health-interval-ms:30000}")
    void check() {
        report(ThanhPhan.CSDL, databaseUp());
        report(ThanhPhan.REDIS, redisUp());
    }

    public void report(ThanhPhan thanhPhan, boolean up) {
        Boolean truoc = trangThai.put(thanhPhan, up);
        if (truoc == null ? up : truoc == up) {
            return;
        }
        log.warn("{} is {}", thanhPhan, up ? "UP" : "DOWN");
        hub.dispatch(new SuKienRealtime(null, PhamVi.QUAN_TRI, LoaiSuKien.SU_CO_HE_THONG,
                thanhPhan.name() + ":" + (up ? "UP" : "DOWN")));
    }

    private boolean databaseUp() {
        try {
            jdbc.queryForObject("SELECT 1", Integer.class);
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }

    private boolean redisUp() {
        try (RedisConnection connection = redis.getConnection()) {
            return "PONG".equalsIgnoreCase(connection.ping());
        } catch (RuntimeException e) {
            return false;
        }
    }
}
