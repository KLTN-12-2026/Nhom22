package com.do_an_tot_nghiep.k28.content.repository;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
@Transactional(propagation = Propagation.MANDATORY)
public class CsvImportRequestRepository {
    private final NamedParameterJdbcTemplate jdbc;

    public Optional<Entry> find(Long userId, String key) {
        return read(userId, key, false);
    }

    public Entry reserveAndLock(Long userId, String key, String importId,
                                Long deckId, String hash, Instant now) {
        jdbc.update("""
                INSERT INTO yeu_cau_nhap_csv
                (nguoi_dung_id,idempotency_key,import_id,bo_the_id,request_hash,created_at,updated_at)
                VALUES (:user,:key,:importId,:deck,:hash,:now,:now)
                ON DUPLICATE KEY UPDATE id=id
                """, Map.of("user", userId, "key", key, "importId", importId,
                "deck", deckId, "hash", hash, "now", LocalDateTime.ofInstant(now, ZoneOffset.UTC)));
        return read(userId, key, true).orElseThrow(() -> new ApiException(
                ErrorCode.CONFLICT, "Bản xem trước đã được nhập bằng Idempotency-Key khác"));
    }

    public void complete(Long id, String response, Instant now) {
        int changed = jdbc.update("""
                UPDATE yeu_cau_nhap_csv
                SET response_json=:response,hoan_tat_at=:now,updated_at=:now
                WHERE id=:id AND hoan_tat_at IS NULL AND response_json IS NULL
                """, Map.of("id", id, "response", response,
                "now", LocalDateTime.ofInstant(now, ZoneOffset.UTC)));
        if (changed != 1) {
            throw new IllegalStateException("CSV request cannot be completed");
        }
    }

    private Optional<Entry> read(Long userId, String key, boolean locked) {
        return jdbc.query("""
                SELECT id,import_id,bo_the_id,request_hash,response_json,hoan_tat_at
                FROM yeu_cau_nhap_csv WHERE nguoi_dung_id=:user AND idempotency_key=:key
                """ + (locked ? " FOR UPDATE" : ""), Map.of("user", userId, "key", key),
                (rs, n) -> new Entry(rs.getLong("id"), rs.getString("import_id"),
                        rs.getLong("bo_the_id"), rs.getString("request_hash"),
                        rs.getString("response_json"), rs.getTimestamp("hoan_tat_at") != null))
                .stream().findFirst();
    }

    public record Entry(Long id, String importId, Long deckId, String hash,
                        String responseJson, boolean completed) {}
}
