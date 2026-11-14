package com.do_an_tot_nghiep.k28.ai.repository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Repository
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class CardDraftCommitRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public Optional<Entry> find(Long userId, String key) {
        return read(userId, key, false);
    }

    public Entry reserveAndLock(Long userId, String key, Long yeuCauId, String hash, Instant now) {
        jdbc.update("""
                INSERT INTO yeu_cau_luu_the_ai
                (nguoi_dung_id,idempotency_key,yeu_cau_ai_id,request_hash,created_at,updated_at)
                VALUES (:user,:key,:yeuCau,:hash,:now,:now)
                ON DUPLICATE KEY UPDATE id=id
                """, Map.of("user", userId, "key", key, "yeuCau", yeuCauId, "hash", hash,
                "now", utc(now)));
        return read(userId, key, true).orElseThrow(() -> new IllegalStateException("Commit request vanished"));
    }

    public void complete(Long id, Long boTheId, String response, Instant now) {
        int changed = jdbc.update("""
                UPDATE yeu_cau_luu_the_ai
                SET bo_the_id=:deck,response_json=:response,hoan_tat_at=:now,updated_at=:now
                WHERE id=:id AND hoan_tat_at IS NULL
                """, Map.of("id", id, "deck", boTheId, "response", response, "now", utc(now)));
        if (changed != 1) {
            throw new IllegalStateException("AI commit request cannot be completed");
        }
    }

    private Optional<Entry> read(Long userId, String key, boolean locked) {
        return jdbc.query("""
                        SELECT id,yeu_cau_ai_id,request_hash,response_json,hoan_tat_at
                        FROM yeu_cau_luu_the_ai WHERE nguoi_dung_id=:user AND idempotency_key=:key
                        """ + (locked ? " FOR UPDATE" : ""), Map.of("user", userId, "key", key),
                (rs, n) -> new Entry(rs.getLong("id"), rs.getLong("yeu_cau_ai_id"),
                        rs.getString("request_hash"), rs.getString("response_json"),
                        rs.getTimestamp("hoan_tat_at") != null))
                .stream().findFirst();
    }

    private LocalDateTime utc(Instant instant) {
        return LocalDateTime.ofInstant(instant, ZoneOffset.UTC);
    }

    public record Entry(Long id, Long yeuCauId, String hash, String responseJson, boolean completed) {
    }
}
