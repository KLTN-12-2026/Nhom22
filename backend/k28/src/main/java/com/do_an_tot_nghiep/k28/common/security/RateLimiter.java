package com.do_an_tot_nghiep.k28.common.security;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class RateLimiter {

    public record Policy(String action, int limit, Duration window) {
        public static final Policy LOGIN = new Policy("login", 5, Duration.ofMinutes(15));
        public static final Policy REGISTER = new Policy("register", 5, Duration.ofHours(1));
        public static final Policy RESEND_EMAIL = new Policy("resend-email", 3, Duration.ofMinutes(15));
        public static final Policy FORGOT_PASSWORD = new Policy("forgot-password", 3, Duration.ofMinutes(15));
    }

    private final StringRedisTemplate redis;

    public void check(Policy policy, String subject) {
        String key = key(policy, subject);
        Long count;
        try {
            count = redis.opsForValue().increment(key);
            if (count != null && count == 1L) {
                redis.expire(key, policy.window());
            }
        } catch (DataAccessException ex) {
            throw new ApiException(ErrorCode.DEPENDENCY_DOWN, "Hệ thống tạm thời gian đoạn, vui lòng thử lại sau");
        }
        if (count != null && count > policy.limit()) {
            throw new ApiException(ErrorCode.RATE_LIMITED, "Bạn thao tác quá nhiều lần, vui lòng thử lại sau");
        }
    }

    public void reset(Policy policy, String subject) {
        try {
            redis.delete(key(policy, subject));
        } catch (DataAccessException ex) {
            throw new ApiException(ErrorCode.DEPENDENCY_DOWN, "Hệ thống tạm thời gián đoạn, vui lòng thử lại sau");
        }
    }

    private static String key(Policy policy, String subject) {
        return "rl:" + policy.action() + ":" + subject;
    }
}
