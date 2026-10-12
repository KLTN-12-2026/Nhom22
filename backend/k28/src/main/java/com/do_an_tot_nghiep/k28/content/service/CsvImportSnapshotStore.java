package com.do_an_tot_nghiep.k28.content.service;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.dto.CsvPreviewResponse.Row;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;
import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class CsvImportSnapshotStore {
    private final StringRedisTemplate redis;
    private final JsonMapper json;
    private final Clock clock;

    public CsvImportSnapshot create(Long ownerId, Long deckId,
                                    List<String> ignoredColumns, List<Row> rows) {
        var snapshot = new CsvImportSnapshot(ownerId, deckId, UUID.randomUUID().toString(),
                clock.instant().plus(Duration.ofMinutes(30)), ignoredColumns, rows);
        String payload = json.writeValueAsString(snapshot);
        Duration ttl = Duration.between(clock.instant(), snapshot.expiresAt());
        if (ttl.toMillis() <= 0) {
            throw new ApiException(ErrorCode.INTERNAL_ERROR, "Không thể tạo bản xem trước CSV");
        }
        try {
            if (!Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(
                    key(ownerId, snapshot.importId()), payload, ttl))) {
                throw new ApiException(ErrorCode.INTERNAL_ERROR, "Không thể lưu bản xem trước CSV");
            }
        } catch (DataAccessException ex) {
            throw unavailable();
        }
        return snapshot;
    }

    public CsvImportSnapshot load(Long ownerId, String importId) {
        checkedId(importId);
        String payload;
        try {
            payload = redis.opsForValue().get(key(ownerId, importId));
        } catch (DataAccessException ex) {
            throw unavailable();
        }
        if (payload == null) {
            throw missing();
        }
        var snapshot = json.readValue(payload, CsvImportSnapshot.class);
        if (snapshot == null || !ownerId.equals(snapshot.ownerId())
                || !importId.equals(snapshot.importId()) || snapshot.deckId() == null
                || snapshot.expiresAt() == null) {
            throw new IllegalStateException("CSV snapshot is inconsistent");
        }
        if (!clock.instant().isBefore(snapshot.expiresAt())) {
            throw missing();
        }
        return snapshot;
    }

    public static void checkedId(String id) {
        try {
            if (id == null || !UUID.fromString(id).toString().equals(id)) {
                throw missing();
            }
        } catch (IllegalArgumentException ex) {
            throw missing();
        }
    }

    private String key(Long ownerId, String id) {
        return "csv:preview:v1:" + ownerId + ":" + id;
    }

    private static ApiException missing() {
        return new ApiException(ErrorCode.NOT_FOUND, "Bản xem trước CSV không tồn tại hoặc đã hết hạn");
    }

    private ApiException unavailable() {
        return new ApiException(ErrorCode.DEPENDENCY_DOWN, "Hệ thống tạm thời gián đoạn, vui lòng thử lại sau");
    }
}
