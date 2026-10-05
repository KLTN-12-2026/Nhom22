package com.do_an_tot_nghiep.k28.content.repository;

import com.do_an_tot_nghiep.k28.content.entity.enums.VaiTroTep;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class CardLinkRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public List<TagLink> findTags(Collection<Long> cardIds) {
        if (cardIds.isEmpty()) {
            return List.of();
        }

        return jdbc.query("""
                        SELECT the_id, nhan_id
                        FROM the_nhan
                        WHERE the_id IN (:cardIds)
                        ORDER BY the_id, nhan_id
                        """,
                Map.of("cardIds", cardIds),
                (rs, rowNum) -> new TagLink(
                        rs.getLong("the_id"),
                        rs.getLong("nhan_id")
                )
        );
    }

    public List<FileLink> findFiles(Collection<Long> cardIds) {
        if (cardIds.isEmpty()) {
            return List.of();
        }

        return jdbc.query("""
                        SELECT the_id, tep_id, vai_tro
                        FROM the_tep
                        WHERE the_id IN (:cardIds)
                        ORDER BY the_id, vai_tro
                        """,
                Map.of("cardIds", cardIds),
                (rs, rowNum) -> new FileLink(
                        rs.getLong("the_id"),
                        rs.getLong("tep_id"),
                        VaiTroTep.valueOf(rs.getString("vai_tro"))
                )
        );
    }

    public void replaceTags(
            Long cardId,
            Collection<Long> tagIds,
            Instant now
    ) {
        jdbc.update("""
                        DELETE FROM the_nhan
                        WHERE the_id = :cardId
                        """,
                Map.of("cardId", cardId)
        );

        if (tagIds.isEmpty()) {
            return;
        }

        LocalDateTime createdAt = LocalDateTime.ofInstant(
                now, ZoneOffset.UTC
        );

        MapSqlParameterSource[] parameters = tagIds.stream()
                .map(tagId -> new MapSqlParameterSource()
                        .addValue("cardId", cardId)
                        .addValue("tagId", tagId)
                        .addValue("createdAt", createdAt))
                .toArray(MapSqlParameterSource[]::new);

        jdbc.batchUpdate("""
                        INSERT INTO the_nhan (the_id, nhan_id, created_at)
                        VALUES (:cardId, :tagId, :createdAt)
                        """,
                parameters
        );
    }

    public void replaceFiles(
            Long cardId,
            Collection<FileSelection> selections,
            Instant now
    ) {
        jdbc.update("""
                        DELETE FROM the_tep
                        WHERE the_id = :cardId
                        """,
                Map.of("cardId", cardId)
        );

        if (selections.isEmpty()) {
            return;
        }

        LocalDateTime createdAt = LocalDateTime.ofInstant(
                now, ZoneOffset.UTC
        );

        MapSqlParameterSource[] parameters = selections.stream()
                .map(selection -> new MapSqlParameterSource()
                        .addValue("cardId", cardId)
                        .addValue("fileId", selection.tepId())
                        .addValue("role", selection.vaiTro().name())
                        .addValue("createdAt", createdAt))
                .toArray(MapSqlParameterSource[]::new);

        jdbc.batchUpdate("""
                        INSERT INTO the_tep (
                            the_id, tep_id, vai_tro, created_at
                        )
                        VALUES (:cardId, :fileId, :role, :createdAt)
                        """,
                parameters
        );
    }

    public record TagLink(Long theId, Long nhanId) {
    }

    public record FileLink(
            Long theId,
            Long tepId,
            VaiTroTep vaiTro
    ) {
    }

    public record FileSelection(Long tepId, VaiTroTep vaiTro) {
    }
}