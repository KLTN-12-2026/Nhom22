package com.do_an_tot_nghiep.k28.engagement.repository;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
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

    public record Profile(long id, String tenHienThi, Instant thamGiaAt, long soNgayHoc, long soLuotOn,
                          long soBaiLuyen, long soBoThe, long soBoCongKhai, long soThe, long soLanTop3) {
    }

    private static final String PROFILE = """
            SELECT u.id, u.ten_hien_thi, u.created_at,
                   (SELECT COUNT(*) FROM su_dung_hoc_ngay s WHERE s.nguoi_dung_id = u.id AND s.so_luot_hop_le > 0) AS so_ngay_hoc,
                   (SELECT COALESCE(SUM(s.so_luot_hop_le), 0) FROM su_dung_hoc_ngay s WHERE s.nguoi_dung_id = u.id) AS so_luot_on,
                   (SELECT COUNT(*) FROM bai_luyen p WHERE p.nguoi_dung_id = u.id) AS so_bai_luyen,
                   (SELECT COUNT(*) FROM bo_the b WHERE b.chu_so_huu_id = u.id AND b.xoa_at IS NULL) AS so_bo_the,
                   (SELECT COUNT(*) FROM bo_the b WHERE b.chu_so_huu_id = u.id AND b.xoa_at IS NULL
                        AND b.quyen_truy_cap = 'CONG_KHAI' AND b.trang_thai_kiem_duyet = 'BINH_THUONG') AS so_bo_cong_khai,
                   (SELECT COUNT(*) FROM the_tu_vung c JOIN bo_the b ON b.id = c.bo_the_id
                    WHERE b.chu_so_huu_id = u.id AND b.xoa_at IS NULL AND c.xoa_at IS NULL) AS so_the,
                   (SELECT COUNT(*) FROM vinh_danh_tuan v WHERE v.nguoi_dung_id = u.id) AS so_lan_top3
            FROM nguoi_dung u
            LEFT JOIN cai_dat_rieng_tu c ON c.nguoi_dung_id = u.id
            WHERE u.id = :id
              AND u.trang_thai = 'HOAT_DONG'
              AND COALESCE(c.tham_gia_xep_hang, TRUE)
              AND NOT EXISTS (
                  SELECT 1 FROM nguoi_dung_vai_tro nv JOIN vai_tro v ON v.id = nv.vai_tro_id
                  WHERE nv.nguoi_dung_id = u.id AND v.ma = 'ADMIN')
            """;

    public Optional<Profile> profile(Long id) {
        return jdbc.query(PROFILE, new MapSqlParameterSource("id", id), (rs, i) -> new Profile(
                rs.getLong("id"),
                rs.getString("ten_hien_thi"),
                rs.getObject("created_at", LocalDateTime.class).toInstant(ZoneOffset.UTC),
                rs.getLong("so_ngay_hoc"),
                rs.getLong("so_luot_on"),
                rs.getLong("so_bai_luyen"),
                rs.getLong("so_bo_the"),
                rs.getLong("so_bo_cong_khai"),
                rs.getLong("so_the"),
                rs.getLong("so_lan_top3")
        )).stream().findFirst();
    }

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
