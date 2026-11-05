package com.do_an_tot_nghiep.k28.content.repository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class DeckFavoriteRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public Set<Long> findFavoriteDeckIds(
            Long userId,
            Collection<Long> deckIds
    ) {
        if (deckIds.isEmpty()) {
            return Set.of();
        }
        return new HashSet<>(jdbc.queryForList("""
                        SELECT bo_the_id
                        FROM bo_yeu_thich
                        WHERE nguoi_dung_id = :userId
                          AND bo_the_id IN (:deckIds)
                        """,
                Map.of("userId", userId, "deckIds", deckIds),
                Long.class
        ));
    }

    public boolean exists(Long userId, Long deckId) {
        Long count = jdbc.queryForObject("""
                        SELECT COUNT(*)
                        FROM bo_yeu_thich
                        WHERE nguoi_dung_id = :userId
                          AND bo_the_id = :deckId
                        """,
                Map.of("userId", userId, "deckId", deckId),
                Long.class
        );
        return count != null && count > 0;
    }

    public void add(Long userId, Long deckId, Instant createdAt) {
        jdbc.update("""
                        INSERT INTO bo_yeu_thich (
                            nguoi_dung_id, bo_the_id, created_at
                        )
                        VALUES (:userId, :deckId, :createdAt)
                        ON DUPLICATE KEY UPDATE bo_the_id = :deckId
                        """,
                Map.of(
                        "userId", userId,
                        "deckId", deckId,
                        "createdAt", LocalDateTime.ofInstant(
                                createdAt, ZoneOffset.UTC
                        )
                )
        );
    }

    public void remove(Long userId, Long deckId) {
        jdbc.update("""
                        DELETE FROM bo_yeu_thich
                        WHERE nguoi_dung_id = :userId
                          AND bo_the_id = :deckId
                        """,
                Map.of("userId", userId, "deckId", deckId)
        );
    }
}