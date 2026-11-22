package com.do_an_tot_nghiep.k28.content.repository;

import com.do_an_tot_nghiep.k28.content.dto.LibraryAuthorResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibrarySearchCardResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibrarySearchTopicResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class LibrarySearchRepository {

    private static final String VISIBLE = """
            b.xoa_at IS NULL
              AND b.quyen_truy_cap = 'CONG_KHAI'
              AND b.trang_thai_kiem_duyet = 'BINH_THUONG'
              AND NOT EXISTS (SELECT 1 FROM nguoi_dung o WHERE o.id = b.chu_so_huu_id AND o.trang_thai = 'BI_KHOA'
                              AND o.email <> 'library-editor@vocab.local')
            """;

    private static final String CARD_MATCH = """
            (c.tu LIKE :pattern ESCAPE '!' OR c.nghia_vi LIKE :pattern ESCAPE '!')
            """;

    private static final String PUBLIC_CARDS = """
            FROM the_tu_vung c
            JOIN bo_the b ON b.id = c.bo_the_id
            WHERE %s
              AND c.xoa_at IS NULL
              AND c.an_kiem_duyet = FALSE
              AND %s
            """.formatted(VISIBLE, CARD_MATCH);

    private static final String OWN_CARDS = """
            FROM the_tu_vung c
            JOIN bo_the b ON b.id = c.bo_the_id
            WHERE b.xoa_at IS NULL
              AND b.chu_so_huu_id = :ownerId
              AND c.xoa_at IS NULL
              AND %s
            """.formatted(CARD_MATCH);

    private static final String CARD_ORDER = """
            ORDER BY CASE
                         WHEN c.tu = :exact THEN 0
                         WHEN c.tu LIKE :prefix ESCAPE '!' THEN 1
                         WHEN c.nghia_vi LIKE :prefix ESCAPE '!' THEN 2
                         ELSE 3
                     END,
                     CHAR_LENGTH(c.tu),
                     c.id DESC
            LIMIT :limit OFFSET :offset
            """;

    private static final String AUTHORS = """
            FROM nguoi_dung u
            JOIN bo_the b ON b.chu_so_huu_id = u.id
            WHERE %s
              AND u.trang_thai = 'HOAT_DONG'
            """.formatted(VISIBLE);

    private static final String DECK_CARD_COUNT = """
            (SELECT COUNT(*) FROM the_tu_vung c
             WHERE c.bo_the_id = b.id AND c.xoa_at IS NULL AND c.an_kiem_duyet = FALSE)
            """;

    private static final RowMapper<LibrarySearchCardResponse> CARD = (rs, i) ->
            new LibrarySearchCardResponse(
                    Long.toString(rs.getLong("id")),
                    Long.toString(rs.getLong("bo_the_id")),
                    rs.getString("ten_bo_the"),
                    rs.getString("tu"),
                    rs.getString("tu_loai"),
                    rs.getString("nghia_vi"),
                    rs.getString("phien_am")
            );

    private static final RowMapper<LibraryAuthorResponse> AUTHOR = (rs, i) ->
            new LibraryAuthorResponse(
                    Long.toString(rs.getLong("id")),
                    rs.getString("ten_hien_thi"),
                    rs.getLong("so_bo_the"),
                    rs.getLong("so_the")
            );

    private final NamedParameterJdbcTemplate jdbc;

    public List<LibrarySearchCardResponse> publicCards(String escaped, int offset, int limit) {
        return cards(PUBLIC_CARDS, params(escaped, offset, limit));
    }

    public long countPublicCards(String escaped) {
        return count(PUBLIC_CARDS, params(escaped, 0, 0));
    }

    public List<LibrarySearchCardResponse> ownCards(Long ownerId, String escaped, int offset, int limit) {
        return cards(OWN_CARDS, params(escaped, offset, limit).addValue("ownerId", ownerId));
    }

    public long countOwnCards(Long ownerId, String escaped) {
        return count(OWN_CARDS, params(escaped, 0, 0).addValue("ownerId", ownerId));
    }

    public List<LibraryAuthorResponse> authors(String escaped, int offset, int limit) {
        return jdbc.query("""
                        SELECT u.id, u.ten_hien_thi,
                               COUNT(b.id) AS so_bo_the,
                               COALESCE(SUM(%s), 0) AS so_the
                        %s
                          AND u.ten_hien_thi LIKE :pattern ESCAPE '!'
                        GROUP BY u.id, u.ten_hien_thi
                        ORDER BY CASE WHEN u.ten_hien_thi LIKE :prefix ESCAPE '!' THEN 0 ELSE 1 END,
                                 so_bo_the DESC, u.id ASC
                        LIMIT :limit OFFSET :offset
                        """.formatted(DECK_CARD_COUNT, AUTHORS),
                params(escaped, offset, limit),
                AUTHOR
        );
    }

    public long countAuthors(String escaped) {
        Long total = jdbc.queryForObject("""
                        SELECT COUNT(DISTINCT u.id)
                        %s
                          AND u.ten_hien_thi LIKE :pattern ESCAPE '!'
                        """.formatted(AUTHORS),
                params(escaped, 0, 0),
                Long.class
        );
        return total == null ? 0 : total;
    }

    public Optional<LibraryAuthorResponse> author(Long id) {
        return jdbc.query("""
                        SELECT u.id, u.ten_hien_thi,
                               COUNT(b.id) AS so_bo_the,
                               COALESCE(SUM(%s), 0) AS so_the
                        %s
                          AND u.id = :id
                        GROUP BY u.id, u.ten_hien_thi
                        """.formatted(DECK_CARD_COUNT, AUTHORS),
                new MapSqlParameterSource("id", id),
                AUTHOR
        ).stream().findFirst();
    }

    public Optional<Instant> joinedAt(Long id) {
        return jdbc.query("SELECT created_at FROM nguoi_dung WHERE id = :id",
                new MapSqlParameterSource("id", id),
                (rs, i) -> rs.getObject("created_at", LocalDateTime.class).toInstant(ZoneOffset.UTC)
        ).stream().findFirst();
    }

    public List<LibrarySearchTopicResponse> topics(String escaped, int limit) {
        return jdbc.query("""
                        SELECT t.id, t.ten,
                               (SELECT COUNT(*) FROM bo_the b WHERE b.chu_de_id = t.id AND %s) AS so_bo_the
                        FROM chu_de t
                        WHERE t.ten LIKE :pattern ESCAPE '!'
                        ORDER BY CASE WHEN t.ten LIKE :prefix ESCAPE '!' THEN 0 ELSE 1 END,
                                 so_bo_the DESC, t.ten ASC
                        LIMIT :limit
                        """.formatted(VISIBLE),
                params(escaped, 0, limit),
                (rs, i) -> new LibrarySearchTopicResponse(
                        Long.toString(rs.getLong("id")),
                        rs.getString("ten"),
                        rs.getLong("so_bo_the")
                )
        );
    }

    private List<LibrarySearchCardResponse> cards(String from, MapSqlParameterSource params) {
        return jdbc.query("""
                        SELECT c.id, c.bo_the_id, b.ten AS ten_bo_the,
                               c.tu, c.tu_loai, c.nghia_vi, c.phien_am
                        %s
                        %s
                        """.formatted(from, CARD_ORDER),
                params,
                CARD
        );
    }

    private long count(String from, MapSqlParameterSource params) {
        Long total = jdbc.queryForObject("SELECT COUNT(*) " + from, params, Long.class);
        return total == null ? 0 : total;
    }

    private static MapSqlParameterSource params(String escaped, int offset, int limit) {
        return new MapSqlParameterSource()
                .addValue("pattern", "%" + escaped + "%")
                .addValue("prefix", escaped + "%")
                .addValue("exact", escaped)
                .addValue("offset", offset)
                .addValue("limit", limit);
    }
}
