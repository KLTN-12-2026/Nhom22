package com.do_an_tot_nghiep.k28.common.security;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.RedisScript;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class RateLimiter {

    public record Policy(String action, int limit, Duration window) {
        public static final Policy LOGIN = new Policy("login", 5, Duration.ofMinutes(15));
        public static final Policy LOGIN_IP = new Policy("login-ip", 30, Duration.ofMinutes(15));
        public static final Policy LOGIN_EMAIL = new Policy("login-email", 20, Duration.ofHours(1));
        public static final Policy REGISTER = new Policy("register", 5, Duration.ofHours(1));
        public static final Policy RESEND_EMAIL = new Policy("resend-email", 3, Duration.ofMinutes(15));
        public static final Policy FORGOT_PASSWORD = new Policy("forgot-password", 3, Duration.ofMinutes(15));
        public static final Policy CHANGE_PASSWORD = new Policy("change-password", 5, Duration.ofMinutes(15));
    }

    static final RedisScript<Long> HIT = RedisScript.of("""
            local count = redis.call('INCR', KEYS[1])
            if count == 1 or redis.call('PTTL', KEYS[1]) < 0 then
              redis.call('PEXPIRE', KEYS[1], ARGV[1])
            end
            return count
            """, Long.class);

    private final StringRedisTemplate redis;

    public void check(Policy policy, String subject) {
        String key = key(policy, subject);
        long count = increment(key, policy);
        if (count > policy.limit()) {
            throw limited(key, policy);
        }
    }

    public void requireBelow(Policy policy, String subject) {
        String key = key(policy, subject);
        String value;
        try {
            value = redis.opsForValue().get(key);
        } catch (DataAccessException ex) {
            throw unavailable();
        }
        if (value != null && Long.parseLong(value) >= policy.limit()) {
            throw limited(key, policy);
        }
    }

    public void hit(Policy policy, String subject) {
        increment(key(policy, subject), policy);
    }

    public void reset(Policy policy, String subject) {
        try {
            redis.delete(key(policy, subject));
        } catch (DataAccessException ex) {
            throw unavailable();
        }
    }

    private long increment(String key, Policy policy) {
        try {
            Long count = redis.execute(HIT, List.of(key), String.valueOf(policy.window().toMillis()));
            return count == null ? 0 : count;
        } catch (DataAccessException ex) {
            throw unavailable();
        }
    }

    private ApiException limited(String key, Policy policy) {
        return new ApiException(ErrorCode.RATE_LIMITED, "Bạn thao tác quá nhiều lần, vui lòng thử lại sau",
                retryAfter(key, policy));
    }

    private static ApiException unavailable() {
        return new ApiException(ErrorCode.DEPENDENCY_DOWN, "Hệ thống tạm thời gián đoạn, vui lòng thử lại sau");
    }

    private long retryAfter(String key, Policy policy) {
        try {
            Long ttl = redis.getExpire(key, TimeUnit.SECONDS);
            if (ttl != null && ttl > 0) {
                return ttl;
            }
        } catch (DataAccessException ex) {
            return policy.window().toSeconds();
        }
        return policy.window().toSeconds();
    }

    private static String key(Policy policy, String subject) {
        return "rl:" + policy.action() + ":" + subject;
    }
}
