package com.do_an_tot_nghiep.k28.admin.repository;

import com.do_an_tot_nghiep.k28.admin.dto.AdminDashboardResponse;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class AdminDashboardRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public record UserCounts(long tong, long hoatDong, long biKhoa, long chuaXacThuc, long quanTri) {
    }

    public record DayLearning(long nguoiHoc, long luotOn) {
    }

    public record DayRecall(long tong, long nho) {
    }

    public UserCounts userCounts() {
        return jdbc.queryForObject("""
                SELECT COUNT(*) AS tong,
                       COALESCE(SUM(trang_thai = 'HOAT_DONG'), 0) AS hoat_dong,
                       COALESCE(SUM(trang_thai = 'BI_KHOA'), 0) AS bi_khoa,
                       COALESCE(SUM(trang_thai = 'CHUA_XAC_THUC'), 0) AS chua_xac_thuc,
                       (SELECT COUNT(DISTINCT nv.nguoi_dung_id)
                          FROM nguoi_dung_vai_tro nv JOIN vai_tro v ON v.id = nv.vai_tro_id
                          JOIN nguoi_dung a ON a.id = nv.nguoi_dung_id
                         WHERE v.ma = 'ADMIN' AND a.trang_thai = 'HOAT_DONG') AS quan_tri
                  FROM nguoi_dung
                 WHERE trang_thai <> 'DANG_XOA'
                """, Map.of(), (rs, i) -> new UserCounts(rs.getLong("tong"), rs.getLong("hoat_dong"),
                rs.getLong("bi_khoa"), rs.getLong("chua_xac_thuc"), rs.getLong("quan_tri")));
    }

    public long newUsers(Instant tu, Instant den) {
        return count("SELECT COUNT(*) FROM nguoi_dung WHERE created_at >= :tu AND created_at < :den",
                params().addValue("tu", utc(tu)).addValue("den", utc(den)));
    }

    public Map<LocalDate, Long> signupsByDay(Instant tu, String offset) {
        Map<LocalDate, Long> result = new HashMap<>();
        jdbc.query("""
                SELECT DATE(CONVERT_TZ(created_at, '+00:00', :tz)) AS ngay, COUNT(*) AS so
                  FROM nguoi_dung
                 WHERE created_at >= :tu
                 GROUP BY ngay
                """, params().addValue("tu", utc(tu)).addValue("tz", offset),
                rs -> { result.put(rs.getObject("ngay", LocalDate.class), rs.getLong("so")); });
        return result;
    }

    public Map<LocalDate, DayLearning> learningByDay(LocalDate tuNgay, LocalDate denNgay) {
        Map<LocalDate, DayLearning> result = new HashMap<>();
        jdbc.query("""
                SELECT ngay_dia_phuong AS ngay, COUNT(DISTINCT nguoi_dung_id) AS nguoi_hoc,
                       COALESCE(SUM(so_luot_hop_le), 0) AS luot_on
                  FROM su_dung_hoc_ngay
                 WHERE ngay_dia_phuong BETWEEN :tu AND :den AND so_luot_hop_le > 0
                 GROUP BY ngay_dia_phuong
                """, params().addValue("tu", tuNgay).addValue("den", denNgay),
                rs -> { result.put(rs.getObject("ngay", LocalDate.class),
                        new DayLearning(rs.getLong("nguoi_hoc"), rs.getLong("luot_on"))); });
        return result;
    }

    public DayLearning learningTotal(LocalDate tuNgay, LocalDate denNgay) {
        return jdbc.queryForObject("""
                SELECT COUNT(DISTINCT nguoi_dung_id) AS nguoi_hoc, COALESCE(SUM(so_luot_hop_le), 0) AS luot_on
                  FROM su_dung_hoc_ngay
                 WHERE ngay_dia_phuong BETWEEN :tu AND :den AND so_luot_hop_le > 0
                """, params().addValue("tu", tuNgay).addValue("den", denNgay),
                (rs, i) -> new DayLearning(rs.getLong("nguoi_hoc"), rs.getLong("luot_on")));
    }

    public Map<LocalDate, DayRecall> recallByDay(Instant tu, String offset) {
        Map<LocalDate, DayRecall> result = new HashMap<>();
        jdbc.query("""
                SELECT DATE(CONVERT_TZ(created_at, '+00:00', :tz)) AS ngay, COUNT(*) AS tong,
                       COALESCE(SUM(danh_gia IN ('NHO', 'DE')), 0) AS nho
                  FROM lich_su_on
                 WHERE created_at >= :tu
                 GROUP BY ngay
                """, params().addValue("tu", utc(tu)).addValue("tz", offset),
                rs -> { result.put(rs.getObject("ngay", LocalDate.class),
                        new DayRecall(rs.getLong("tong"), rs.getLong("nho"))); });
        return result;
    }

    public Map<String, long[]> revenueByMonth(Instant tu, String offset) {
        Map<String, long[]> result = new HashMap<>();
        jdbc.query("""
                SELECT DATE_FORMAT(CONVERT_TZ(hoan_tat_at, '+00:00', :tz), '%Y-%m') AS thang,
                       COALESCE(SUM(so_tien), 0) AS doanh_thu, COUNT(*) AS so
                  FROM giao_dich_thanh_toan
                 WHERE trang_thai = 'THANH_CONG' AND hoan_tat_at >= :tu
                 GROUP BY thang
                """, params().addValue("tu", utc(tu)).addValue("tz", offset),
                rs -> { result.put(rs.getString("thang"), new long[] {rs.getLong("doanh_thu"), rs.getLong("so")}); });
        return result;
    }

    public List<AdminDashboardResponse.Goi> activePlans(Instant now) {
        return jdbc.query("""
                SELECT g.ma, g.ten, COUNT(DISTINCT d.nguoi_dung_id) AS so
                  FROM goi_dich_vu g
                  LEFT JOIN dang_ky_goi d ON d.goi_ma = g.ma AND d.trang_thai = 'HIEU_LUC' AND d.het_han_at > :now
                 GROUP BY g.id, g.ma, g.ten
                 ORDER BY g.id
                """, params().addValue("now", utc(now)),
                (rs, i) -> new AdminDashboardResponse.Goi(rs.getString("ma"), rs.getString("ten"), rs.getLong("so")));
    }

    public AdminDashboardResponse.CanXuLy queue(Instant now) {
        MapSqlParameterSource p = params()
                .addValue("now", utc(now))
                .addValue("tuan", utc(now.plusSeconds(7L * 86_400)))
                .addValue("treo", utc(now.minusSeconds(15L * 60)))
                .addValue("haiNgay", utc(now.minusSeconds(48L * 3_600)))
                .addValue("motNgay", utc(now.minusSeconds(24L * 3_600)));
        return jdbc.queryForObject("""
                SELECT (SELECT COUNT(*) FROM yeu_cau_cong_khai WHERE trang_thai = 'CHO_DUYET' AND nguoi_duyet = 'ADMIN') AS cong_khai,
                       (SELECT MIN(created_at) FROM yeu_cau_cong_khai WHERE trang_thai = 'CHO_DUYET' AND nguoi_duyet = 'ADMIN') AS cong_khai_cu,
                       (SELECT COUNT(*) FROM bao_cao_noi_dung WHERE trang_thai = 'CHO_XU_LY') AS bao_cao,
                       (SELECT COUNT(*) FROM dang_ky_goi WHERE trang_thai = 'HIEU_LUC' AND het_han_at > :now AND het_han_at <= :tuan) AS sap_het_han,
                       (SELECT COUNT(*) FROM giao_dich_thanh_toan WHERE trang_thai = 'CHO_THANH_TOAN' AND tao_at < :treo) AS treo,
                       (SELECT COUNT(*) FROM nguoi_dung WHERE trang_thai = 'CHUA_XAC_THUC' AND created_at < :haiNgay) AS chua_xac_thuc,
                       (SELECT COUNT(*) FROM tac_vu_nen WHERE trang_thai IN ('LOI', 'KHONG_XAC_DINH') AND updated_at >= :motNgay) AS tac_vu_loi,
                       (SELECT COUNT(*) FROM phieu_ho_tro WHERE trang_thai = 'DANG_MO') AS ho_tro
                """, p, (rs, i) -> new AdminDashboardResponse.CanXuLy(rs.getLong("cong_khai"),
                instant(rs, "cong_khai_cu"), rs.getLong("bao_cao"), rs.getLong("sap_het_han"),
                rs.getLong("treo"), rs.getLong("chua_xac_thuc"), rs.getLong("tac_vu_loi"), rs.getLong("ho_tro")));
    }

    public long pendingJobs() {
        return count("SELECT COUNT(*) FROM tac_vu_nen WHERE trang_thai IN ('CHO', 'DANG_CHAY')", params());
    }

    public List<AdminDashboardResponse.BoMau> topSampleDecks(Instant tu, int limit) {
        return jdbc.query("""
                SELECT g.id, g.ten, COUNT(DISTINCT l.nguoi_dung_id) AS nguoi_hoc, COUNT(*) AS luot_on,
                       COALESCE(SUM(l.danh_gia IN ('NHO', 'DE')), 0) AS nho
                  FROM lich_su_on l
                  JOIN tien_do_the t ON t.id = l.tien_do_id
                  JOIN the_tu_vung tv ON tv.id = t.the_id
                  JOIN bo_the b ON b.id = tv.bo_the_id
                  JOIN bo_the g ON g.id = COALESCE(b.bo_nguon_id, b.id)
                 WHERE g.bo_mau = TRUE AND l.created_at >= :tu
                 GROUP BY g.id, g.ten
                 ORDER BY nguoi_hoc DESC, luot_on DESC, g.id
                 LIMIT :limit
                """, params().addValue("tu", utc(tu)).addValue("limit", limit),
                (rs, i) -> new AdminDashboardResponse.BoMau(String.valueOf(rs.getLong("id")), rs.getString("ten"),
                        rs.getLong("nguoi_hoc"), rs.getLong("luot_on"),
                        ratio(rs.getLong("nho"), rs.getLong("luot_on"))));
    }

    public List<AdminDashboardResponse.NguoiDungMoi> newestUsers(Instant now, int limit) {
        return jdbc.query("""
                SELECT u.id, u.email, u.ten_hien_thi, u.trang_thai, u.created_at,
                       (SELECT d.goi_ma FROM dang_ky_goi d
                         WHERE d.nguoi_dung_id = u.id AND d.trang_thai = 'HIEU_LUC' AND d.het_han_at > :now
                         ORDER BY d.het_han_at DESC LIMIT 1) AS goi_ma
                  FROM nguoi_dung u
                 WHERE u.trang_thai <> 'DANG_XOA'
                 ORDER BY u.created_at DESC, u.id DESC
                 LIMIT :limit
                """, params().addValue("now", utc(now)).addValue("limit", limit),
                (rs, i) -> new AdminDashboardResponse.NguoiDungMoi(String.valueOf(rs.getLong("id")),
                        rs.getString("email"), rs.getString("ten_hien_thi"), rs.getString("trang_thai"),
                        instant(rs, "created_at"), rs.getString("goi_ma")));
    }

    public static Double ratio(long part, long total) {
        return total == 0 ? null : Math.round(part * 1000.0 / total) / 10.0;
    }

    private long count(String sql, MapSqlParameterSource params) {
        Long value = jdbc.queryForObject(sql, params, Long.class);
        return value == null ? 0 : value;
    }

    private static MapSqlParameterSource params() {
        return new MapSqlParameterSource();
    }

    private static LocalDateTime utc(Instant value) {
        return LocalDateTime.ofInstant(value, ZoneOffset.UTC);
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        LocalDateTime value = rs.getObject(column, LocalDateTime.class);
        return value == null ? null : value.toInstant(ZoneOffset.UTC);
    }
}
