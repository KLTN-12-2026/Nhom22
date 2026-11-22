package com.do_an_tot_nghiep.k28.admin.repository;

import com.do_an_tot_nghiep.k28.admin.dto.AdminUserDetailResponse;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.TreeSet;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class AdminUserDetailRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public record Profile(
            long id,
            String email,
            String tenHienThi,
            String trangThai,
            String muiGio,
            Instant emailXacThucAt,
            Instant dangNhapCuoiAt,
            Instant createdAt,
            Long anhDaiDienId,
            Long anhDaiDienAnId
    ) {
    }

    public record Cards(long daHoc, long denHan, long tamNgung) {
    }

    public record Reviews(long tong, long nho) {
    }

    public record Payments(long tongDaChi, long soThanhCong, long soThatBai) {
    }

    public Optional<Profile> profile(long id, String systemEmail) {
        return jdbc.query("""
                SELECT id, email, ten_hien_thi, trang_thai, mui_gio, email_xac_thuc_at, dang_nhap_cuoi_at, created_at,
                       anh_dai_dien_id, anh_dai_dien_an_id
                  FROM nguoi_dung
                 WHERE id = :id AND email <> :system
                """, params(id).addValue("system", systemEmail),
                (rs, i) -> new Profile(rs.getLong("id"), rs.getString("email"), rs.getString("ten_hien_thi"),
                        rs.getString("trang_thai"), rs.getString("mui_gio"), instant(rs, "email_xac_thuc_at"),
                        instant(rs, "dang_nhap_cuoi_at"), instant(rs, "created_at"),
                        rs.getObject("anh_dai_dien_id", Long.class), rs.getObject("anh_dai_dien_an_id", Long.class))).stream().findFirst();
    }

    public Set<String> roles(long id) {
        return new TreeSet<>(jdbc.queryForList("""
                SELECT v.ma FROM nguoi_dung_vai_tro nv JOIN vai_tro v ON v.id = nv.vai_tro_id
                 WHERE nv.nguoi_dung_id = :id
                """, params(id), String.class));
    }

    public Cards cards(long id, Instant now) {
        return jdbc.queryForObject("""
                SELECT COUNT(DISTINCT CASE WHEN trang_thai <> 'MOI' THEN the_id END) AS da_hoc,
                       COALESCE(SUM(trang_thai IN ('DANG_HOC', 'ON_TAP', 'HOC_LAI') AND han_on_at <= :now), 0) AS den_han,
                       COALESCE(SUM(trang_thai = 'TAM_NGUNG'), 0) AS tam_ngung
                  FROM tien_do_the
                 WHERE nguoi_dung_id = :id
                """, params(id).addValue("now", utc(now)),
                (rs, i) -> new Cards(rs.getLong("da_hoc"), rs.getLong("den_han"), rs.getLong("tam_ngung")));
    }

    public Reviews reviews(long id, Instant tu) {
        return jdbc.queryForObject("""
                SELECT COUNT(*) AS tong, COALESCE(SUM(danh_gia IN ('NHO', 'DE')), 0) AS nho
                  FROM lich_su_on
                 WHERE nguoi_dung_id = :id AND created_at >= :tu
                """, params(id).addValue("tu", utc(tu)),
                (rs, i) -> new Reviews(rs.getLong("tong"), rs.getLong("nho")));
    }

    public Map<LocalDate, AdminUserDetailResponse.Ngay> learningByDay(long id, LocalDate tuNgay, LocalDate denNgay) {
        Map<LocalDate, AdminUserDetailResponse.Ngay> result = new HashMap<>();
        jdbc.query("""
                SELECT ngay_dia_phuong AS ngay, so_luot_hop_le, so_the_moi
                  FROM su_dung_hoc_ngay
                 WHERE nguoi_dung_id = :id AND ngay_dia_phuong BETWEEN :tu AND :den
                """, params(id).addValue("tu", tuNgay).addValue("den", denNgay),
                rs -> {
                    LocalDate ngay = rs.getObject("ngay", LocalDate.class);
                    result.put(ngay, new AdminUserDetailResponse.Ngay(ngay, rs.getLong("so_luot_hop_le"),
                            rs.getLong("so_the_moi")));
                });
        return result;
    }

    public LocalDate lastLearningDay(long id) {
        return jdbc.queryForObject("""
                SELECT MAX(ngay_dia_phuong) FROM su_dung_hoc_ngay WHERE nguoi_dung_id = :id AND so_luot_hop_le > 0
                """, params(id), LocalDate.class);
    }

    public List<AdminUserDetailResponse.DangKy> subscriptions(long id, int limit) {
        return jdbc.query("""
                SELECT d.id, d.goi_ma, g.ten, d.trang_thai, d.bat_dau_at, d.het_han_at, d.huy_at
                  FROM dang_ky_goi d LEFT JOIN goi_dich_vu g ON g.ma = d.goi_ma
                 WHERE d.nguoi_dung_id = :id
                 ORDER BY d.bat_dau_at DESC, d.id DESC
                 LIMIT :limit
                """, params(id).addValue("limit", limit),
                (rs, i) -> new AdminUserDetailResponse.DangKy(String.valueOf(rs.getLong("id")), rs.getString("goi_ma"),
                        rs.getString("ten"), rs.getString("trang_thai"), instant(rs, "bat_dau_at"),
                        instant(rs, "het_han_at"), instant(rs, "huy_at")));
    }

    public Payments payments(long id) {
        return jdbc.queryForObject("""
                SELECT COALESCE(SUM(CASE WHEN trang_thai = 'THANH_CONG' THEN so_tien END), 0) AS tong,
                       COALESCE(SUM(trang_thai = 'THANH_CONG'), 0) AS thanh_cong,
                       COALESCE(SUM(trang_thai = 'THAT_BAI'), 0) AS that_bai
                  FROM giao_dich_thanh_toan
                 WHERE nguoi_dung_id = :id
                """, params(id),
                (rs, i) -> new Payments(rs.getLong("tong"), rs.getLong("thanh_cong"), rs.getLong("that_bai")));
    }

    public List<AdminUserDetailResponse.GiaoDich> recentPayments(long id, int limit) {
        return jdbc.query("""
                SELECT id, ma_don, goi_ma, chu_ky, so_tien, trang_thai, tao_at, hoan_tat_at
                  FROM giao_dich_thanh_toan
                 WHERE nguoi_dung_id = :id
                 ORDER BY tao_at DESC, id DESC
                 LIMIT :limit
                """, params(id).addValue("limit", limit),
                (rs, i) -> new AdminUserDetailResponse.GiaoDich(String.valueOf(rs.getLong("id")), rs.getString("ma_don"),
                        rs.getString("goi_ma"), rs.getString("chu_ky"), rs.getLong("so_tien"),
                        rs.getString("trang_thai"), instant(rs, "tao_at"), instant(rs, "hoan_tat_at")));
    }

    public List<AdminUserDetailResponse.DichVu> serviceUsage(long id, LocalDate tuNgay) {
        return jdbc.query("""
                SELECT loai, COALESCE(SUM(so_dung), 0) AS so_dung, SUM(chi_phi) AS chi_phi
                  FROM su_dung_dich_vu
                 WHERE nguoi_dung_id = :id AND ngay >= :tu
                 GROUP BY loai
                 ORDER BY loai
                """, params(id).addValue("tu", tuNgay),
                (rs, i) -> new AdminUserDetailResponse.DichVu(rs.getString("loai"), rs.getLong("so_dung"),
                        rs.getBigDecimal("chi_phi")));
    }

    public List<AdminUserDetailResponse.BoThe> decks(long id, int limit) {
        return jdbc.query("""
                SELECT b.id, b.ten, b.quyen_truy_cap, b.updated_at,
                       (SELECT COUNT(*) FROM the_tu_vung t WHERE t.bo_the_id = b.id AND t.xoa_at IS NULL) AS so_the
                  FROM bo_the b
                 WHERE b.chu_so_huu_id = :id AND b.xoa_at IS NULL
                 ORDER BY b.updated_at DESC, b.id DESC
                 LIMIT :limit
                """, params(id).addValue("limit", limit),
                (rs, i) -> new AdminUserDetailResponse.BoThe(String.valueOf(rs.getLong("id")), rs.getString("ten"),
                        rs.getString("quyen_truy_cap"), rs.getLong("so_the"), instant(rs, "updated_at")));
    }

    public AdminUserDetailResponse.BaoCao reports(long id) {
        return jdbc.queryForObject("""
                SELECT (SELECT COUNT(*) FROM bao_cao_noi_dung WHERE nguoi_bao_cao_id = :id) AS da_gui,
                       COUNT(*) AS bi_bao_cao,
                       COALESCE(SUM(r.trang_thai = 'CHO_XU_LY'), 0) AS cho_xu_ly
                  FROM bao_cao_noi_dung r
                 WHERE (r.loai_doi_tuong = 'BO_THE'
                        AND r.doi_tuong_id IN (SELECT b.id FROM bo_the b WHERE b.chu_so_huu_id = :id))
                    OR (r.loai_doi_tuong = 'THE_TU_VUNG'
                        AND r.doi_tuong_id IN (SELECT t.id FROM the_tu_vung t JOIN bo_the b ON b.id = t.bo_the_id
                                                WHERE b.chu_so_huu_id = :id))
                """, params(id), (rs, i) -> new AdminUserDetailResponse.BaoCao(rs.getLong("da_gui"),
                rs.getLong("bi_bao_cao"), rs.getLong("cho_xu_ly")));
    }

    private static MapSqlParameterSource params(long id) {
        return new MapSqlParameterSource("id", id);
    }

    private static LocalDateTime utc(Instant value) {
        return LocalDateTime.ofInstant(value, ZoneOffset.UTC);
    }

    private static Instant instant(ResultSet rs, String column) throws SQLException {
        LocalDateTime value = rs.getObject(column, LocalDateTime.class);
        return value == null ? null : value.toInstant(ZoneOffset.UTC);
    }
}
