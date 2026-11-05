package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.service.CsvImportSnapshot;
import com.do_an_tot_nghiep.k28.content.service.CsvImportSnapshotStore;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.RedisConnectionFailureException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import tools.jackson.databind.json.JsonMapper;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.*;

class FR05CsvSnapshotTest {
    private final StringRedisTemplate redis=mock(StringRedisTemplate.class);
    private final JsonMapper json=mock(JsonMapper.class);
    private final Clock clock=Clock.fixed(Instant.parse("2026-10-13T00:00:00Z"),ZoneOffset.UTC);
    private final CsvImportSnapshotStore store=new CsvImportSnapshotStore(redis,json,clock);
    private final String id="00000000-0000-4000-8000-000000000000";

    @Test
    void tc04_redisFailureNeverReturnsSuccessfulPreview() {
        when(json.writeValueAsString(any())).thenReturn("{}");
        when(redis.opsForValue()).thenThrow(new RedisConnectionFailureException("offline"));
        assertThatThrownBy(()->store.create(1L,2L,List.of(),List.of())).isInstanceOfSatisfying(ApiException.class,
                ex->org.assertj.core.api.Assertions.assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.DEPENDENCY_DOWN));
        assertThatThrownBy(()->store.load(1L,id)).isInstanceOfSatisfying(ApiException.class,
                ex->org.assertj.core.api.Assertions.assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.DEPENDENCY_DOWN));
    }

    @Test
    @SuppressWarnings("unchecked")
    void tc04_expiryIsCheckedWithoutExtendingTtl() {
        ValueOperations<String,String> values=mock(ValueOperations.class);
        when(redis.opsForValue()).thenReturn(values);
        when(values.get("csv:preview:v1:1:"+id)).thenReturn("{}");
        when(json.readValue("{}",CsvImportSnapshot.class)).thenReturn(new CsvImportSnapshot(
                1L,2L,id,clock.instant(),List.of(),List.of()));
        assertThatThrownBy(()->store.load(1L,id)).isInstanceOfSatisfying(ApiException.class,
                ex->org.assertj.core.api.Assertions.assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));
        verify(redis,never()).expire(anyString(),any(java.time.Duration.class));
        verify(values,never()).set(anyString(),anyString());
    }
}
