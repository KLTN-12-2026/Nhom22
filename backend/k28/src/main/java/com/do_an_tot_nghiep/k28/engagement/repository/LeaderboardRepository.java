package com.do_an_tot_nghiep.k28.engagement.repository;

import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class LeaderboardRepository {

    private static final String RANKED = """
            WITH diem AS (
                SELECT s.nguoi_dung_id,
                       u.ten_hien_thi,
                       SUM(CASE WHEN s.so_luot_hop_le >= :toiThieu THEN 1 ELSE 0 END) AS so_ngay,
                       SUM(s.so_luot_hop_le) AS so_luot
                FROM su_dung_hoc_ngay s
                JOIN nguoi_dung u ON u.id = s.nguoi_dung_id
                LEFT JOIN cai_dat_rieng_tu c ON c.nguoi_dung_id = u.id
                WHERE s.ngay_dia_phuong BETWEEN :tuNgay AND :denNgay
                  AND u.trang_thai = 'HOAT_DONG'
                  AND COALESCE(c.tham_gia_xep_hang, TRUE)
                  AND NOT EXISTS (
                      SELECT 1 FROM nguoi_dung_vai_tro nv JOIN vai_tro v ON v.id = nv.vai_tro_id
                      WHERE nv.nguoi_dung_id = u.id AND v.ma = 'ADMIN')
                GROUP BY s.nguoi_dung_id, u.ten_hien_thi
                HAVING SUM(s.so_luot_hop_le) > 0
            ),
            ranked AS (
                SELECT diem.*, ROW_NUMBER() OVER (ORDER BY so_ngay DESC, so_luot DESC, nguoi_dung_id ASC) AS hang
                FROM diem
            ),
            toi AS (SELECT hang FROM ranked WHERE nguoi_dung_id = :toi)
            """;

    private final NamedParameterJdbcTemplate jdbc;

    public record Row(int hang, long nguoiDungId, String tenHienThi, int soNgay, long soLuot) {
    }

    public List<Row> rows(LocalDate tuNgay, LocalDate denNgay, int toiThieu, int gioiHan, Long toi) {
        return jdbc.query(RANKED + """
                SELECT hang, nguoi_dung_id, ten_hien_thi, so_ngay, so_luot FROM ranked
                WHERE hang <= :gioiHan
                   OR hang BETWEEN (SELECT hang FROM toi) - 1 AND (SELECT hang FROM toi)
                ORDER BY hang
                """, params(tuNgay, denNgay, toiThieu, toi).addValue("gioiHan", gioiHan),
                (rs, i) -> new Row(rs.getInt("hang"), rs.getLong("nguoi_dung_id"), rs.getString("ten_hien_thi"),
                        rs.getInt("so_ngay"), rs.getLong("so_luot")));
    }

    public long count(LocalDate tuNgay, LocalDate denNgay, int toiThieu) {
        Long total = jdbc.queryForObject(RANKED + "SELECT COUNT(*) FROM ranked",
                params(tuNgay, denNgay, toiThieu, null), Long.class);
        return total == null ? 0 : total;
    }

    private static MapSqlParameterSource params(LocalDate tuNgay, LocalDate denNgay, int toiThieu, Long toi) {
        return new MapSqlParameterSource()
                .addValue("tuNgay", tuNgay)
                .addValue("denNgay", denNgay)
                .addValue("toiThieu", toiThieu)
                .addValue("toi", toi == null ? -1L : toi);
    }
}
