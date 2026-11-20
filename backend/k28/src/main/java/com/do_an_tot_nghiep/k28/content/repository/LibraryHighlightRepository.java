package com.do_an_tot_nghiep.k28.content.repository;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class LibraryHighlightRepository {

    private static final String VISIBLE = """
            b.xoa_at IS NULL
              AND b.quyen_truy_cap = 'CONG_KHAI'
              AND b.trang_thai_kiem_duyet = 'BINH_THUONG'
            """;

    private final NamedParameterJdbcTemplate jdbc;

    public record DeckCount(Long boTheId, long soYeuThich) {
    }

    public record Contribution(Long chuSoHuuId, long soYeuThich, long soSaoChep) {
    }

    public List<DeckCount> topFavoritedDecks(Instant since, int limit) {
        String window = since == null ? "" : " AND y.created_at >= :since";
        return jdbc.query("""
                        SELECT y.bo_the_id, COUNT(*) AS so_yeu_thich
                        FROM bo_yeu_thich y
                        JOIN bo_the b ON b.id = y.bo_the_id
                        WHERE %s
                          AND y.nguoi_dung_id <> b.chu_so_huu_id%s
                        GROUP BY y.bo_the_id
                        ORDER BY so_yeu_thich DESC, y.bo_the_id DESC
                        LIMIT :limit
                        """.formatted(VISIBLE, window),
                params(since).addValue("limit", limit),
                (rs, i) -> new DeckCount(rs.getLong(1), rs.getLong(2))
        );
    }

    public List<Contribution> topContributors(Instant since, int limit) {
        return jdbc.query("""
                        SELECT x.chu_so_huu_id, SUM(x.yt) AS so_yeu_thich, SUM(x.sc) AS so_sao_chep
                        FROM (
                            SELECT b.chu_so_huu_id, 1 AS yt, 0 AS sc
                            FROM bo_yeu_thich y
                            JOIN bo_the b ON b.id = y.bo_the_id
                            WHERE %1$s
                              AND b.bo_mau = FALSE
                              AND y.created_at >= :since
                              AND y.nguoi_dung_id <> b.chu_so_huu_id
                            UNION ALL
                            SELECT b.chu_so_huu_id, 0, 1
                            FROM bo_the c
                            JOIN bo_the b ON b.id = c.bo_nguon_id
                            WHERE %1$s
                              AND b.bo_mau = FALSE
                              AND c.created_at >= :since
                              AND c.chu_so_huu_id <> b.chu_so_huu_id
                        ) x
                        JOIN nguoi_dung u ON u.id = x.chu_so_huu_id AND u.trang_thai = 'HOAT_DONG'
                        GROUP BY x.chu_so_huu_id
                        ORDER BY SUM(x.yt) + SUM(x.sc) DESC, SUM(x.yt) DESC, x.chu_so_huu_id ASC
                        LIMIT :limit
                        """.formatted(VISIBLE),
                params(since).addValue("limit", limit),
                (rs, i) -> new Contribution(rs.getLong(1), rs.getLong(2), rs.getLong(3))
        );
    }

    public Map<Long, Long> publicDeckCounts(Collection<Long> ownerIds) {
        if (ownerIds.isEmpty()) {
            return Map.of();
        }
        return jdbc.query("""
                        SELECT b.chu_so_huu_id, COUNT(*)
                        FROM bo_the b
                        WHERE %s
                          AND b.bo_mau = FALSE
                          AND b.chu_so_huu_id IN (:ids)
                        GROUP BY b.chu_so_huu_id
                        """.formatted(VISIBLE),
                Map.of("ids", ownerIds),
                (rs, i) -> Map.entry(rs.getLong(1), rs.getLong(2))
        ).stream().collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }

    private static MapSqlParameterSource params(Instant since) {
        return new MapSqlParameterSource("since",
                since == null ? null : LocalDateTime.ofInstant(since, ZoneOffset.UTC));
    }
}
