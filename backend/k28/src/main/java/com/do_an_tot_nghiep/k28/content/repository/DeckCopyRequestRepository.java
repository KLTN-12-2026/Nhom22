package com.do_an_tot_nghiep.k28.content.repository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Repository
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class DeckCopyRequestRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public Optional<Entry> find(Long userId, String key) {
        return read(userId, key, false);
    }

    public Entry reserveAndLock(
            Long userId,
            String key,
            Long sourceId,
            Instant now
    ) {
        LocalDateTime timestamp = LocalDateTime.ofInstant(
                now, ZoneOffset.UTC
        );

        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("userId", userId)
                .addValue("key", key)
                .addValue("sourceId", sourceId)
                .addValue("now", timestamp);

        jdbc.update("""
                INSERT INTO yeu_cau_sao_chep_bo (
                    nguoi_dung_id,
                    idempotency_key,
                    bo_nguon_id,
                    created_at,
                    updated_at
                )
                VALUES (
                    :userId,
                    :key,
                    :sourceId,
                    :now,
                    :now
                )
                ON DUPLICATE KEY UPDATE id = id
                """, parameters);

        return read(userId, key, true)
                .orElseThrow(() -> new IllegalStateException(
                        "Copy request reservation is missing"
                ));
    }

    public void complete(
            Long requestId,
            Long resultId,
            String responseJson,
            Instant now
    ) {
        LocalDateTime timestamp = LocalDateTime.ofInstant(
                now, ZoneOffset.UTC
        );

        MapSqlParameterSource parameters = new MapSqlParameterSource()
                .addValue("requestId", requestId)
                .addValue("resultId", resultId)
                .addValue("responseJson", responseJson)
                .addValue("now", timestamp);

        int affected = jdbc.update("""
                UPDATE yeu_cau_sao_chep_bo
                SET bo_ket_qua_id = :resultId,
                    response_json = :responseJson,
                    hoan_tat_at = :now,
                    updated_at = :now
                WHERE id = :requestId
                  AND bo_ket_qua_id IS NULL
                  AND response_json IS NULL
                  AND hoan_tat_at IS NULL
                """, parameters);

        if (affected != 1) {
            throw new IllegalStateException(
                    "Copy request cannot be completed"
            );
        }
    }

    private Optional<Entry> read(
            Long userId,
            String key,
            boolean locked
    ) {
        String sql = """
                SELECT id,
                       bo_nguon_id,
                       bo_ket_qua_id,
                       response_json,
                       hoan_tat_at
                FROM yeu_cau_sao_chep_bo
                WHERE nguoi_dung_id = :userId
                  AND idempotency_key = :key
                """ + (locked ? " FOR UPDATE" : "");

        return jdbc.query(
                sql,
                Map.of("userId", userId, "key", key),
                (rs, rowNum) -> new Entry(
                        rs.getLong("id"),
                        rs.getLong("bo_nguon_id"),
                        rs.getObject("bo_ket_qua_id", Long.class),
                        rs.getString("response_json"),
                        rs.getTimestamp("hoan_tat_at") != null
                )
        ).stream().findFirst();
    }

    public record Entry(
            Long id,
            Long sourceId,
            Long resultId,
            String responseJson,
            boolean completed
    ) {
    }
}