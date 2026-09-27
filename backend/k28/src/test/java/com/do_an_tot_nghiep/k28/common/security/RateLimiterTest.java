package com.do_an_tot_nghiep.k28.common.security;

import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.security.RateLimiter.Policy;
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

    @Mock
    StringRedisTemplate redis;

    @Mock
    ValueOperations<String, String> ops;

    RateLimiter limiter;

    @BeforeEach
    void setUp() {
        when(redis.opsForValue()).thenReturn(ops);
        limiter = new RateLimiter(redis);
    }

    @Test
    void tc01_firstHitSetsExpiryAndPasses() {
        when(ops.increment(KEY)).thenReturn(1L);

        assertThatNoException().isThrownBy(() -> limiter.check(Policy.LOGIN, "1.2.3.4"));
        verify(redis).expire(KEY, Policy.LOGIN.window());
    }

    @Test
    void tc02_overLimitThrows429() {
        when(ops.increment(KEY)).thenReturn(6L);

        assertThatThrownBy(() -> limiter.check(Policy.LOGIN, "1.2.3.4"))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.RATE_LIMITED);
        verify(redis, never()).expire(KEY, Policy.LOGIN.window());
    }

    @Test
    void tc03_redisDownThrows503() {
        when(ops.increment(anyString())).thenThrow(new RedisConnectionFailureException("down"));

        assertThatThrownBy(() -> limiter.check(Policy.LOGIN, "1.2.3.4"))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.DEPENDENCY_DOWN);
    }
}