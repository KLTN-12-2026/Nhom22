package com.do_an_tot_nghiep.k28.common.security;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.security.RateLimiter.Policy;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

@ExtendWith(MockitoExtension.class)
class RateLimiterTest {

    private static final String KEY = "rl:login:1.2.3.4";
    private static final String WINDOW_MS = String.valueOf(Policy.LOGIN.window().toMillis());

    @Mock
    StringRedisTemplate redis;

    @Mock
    ValueOperations<String, String> ops;

    RateLimiter limiter;

    @BeforeEach
    void setUp() {
        limiter = new RateLimiter(redis);
    }

    @Test
    void tc01_hitWithinLimitPassesAndSendsWindowToScript() {
        when(redis.execute(eq(RateLimiter.HIT), eq(List.of(KEY)), eq(WINDOW_MS))).thenReturn(1L);

        assertThatNoException().isThrownBy(() -> limiter.check(Policy.LOGIN, "1.2.3.4"));
        verify(redis).execute(RateLimiter.HIT, List.of(KEY), WINDOW_MS);
    }

    @Test
    void tc02_overLimitThrows429() {
        when(redis.execute(eq(RateLimiter.HIT), eq(List.of(KEY)), eq(WINDOW_MS))).thenReturn(6L);

        assertThatThrownBy(() -> limiter.check(Policy.LOGIN, "1.2.3.4"))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.RATE_LIMITED);
    }

    @Test
    void tc03_redisDownThrows503() {
        when(redis.execute(eq(RateLimiter.HIT), anyList(), any())).thenThrow(new RedisConnectionFailureException("down"));

        assertThatThrownBy(() -> limiter.check(Policy.LOGIN, "1.2.3.4"))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.DEPENDENCY_DOWN);
    }

    @Test
    void tc04_requireBelowBlocksAtLimitWithoutIncrementing() {
        when(redis.opsForValue()).thenReturn(ops);
        when(ops.get(KEY)).thenReturn("4", "5");

        assertThatNoException().isThrownBy(() -> limiter.requireBelow(Policy.LOGIN, "1.2.3.4"));
        assertThatThrownBy(() -> limiter.requireBelow(Policy.LOGIN, "1.2.3.4"))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.RATE_LIMITED);
    }
}
