package com.do_an_tot_nghiep.k28.engagement.repository;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
@RequiredArgsConstructor
public class WeeklyHonorRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public record Honor(int hang, long nguoiDungId, String tenHienThi, int soNgay, long soLuotHopLe) {
    }

    public boolean exists(LocalDate tuanBatDau) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM vinh_danh_tuan WHERE tuan_bat_dau = :tuan",
                new MapSqlParameterSource("tuan", tuanBatDau), Integer.class);
        return count != null && count > 0;
    }

    public int insert(LocalDate tuanBatDau, int hang, long nguoiDungId, int soNgay, long soLuot, Instant now) {
        return jdbc.update("""
                INSERT IGNORE INTO vinh_danh_tuan
                    (tuan_bat_dau, hang, nguoi_dung_id, so_ngay, so_luot_hop_le, created_at, updated_at)
                VALUES (:tuan, :hang, :nguoi, :soNgay, :soLuot, :now, :now)
                """, new MapSqlParameterSource()
                .addValue("tuan", tuanBatDau)
                .addValue("hang", hang)
                .addValue("nguoi", nguoiDungId)
                .addValue("soNgay", soNgay)
                .addValue("soLuot", soLuot)
                .addValue("now", java.sql.Timestamp.from(now)));
    }

    public Optional<LocalDate> latestWeek() {
        return Optional.ofNullable(jdbc.queryForObject("SELECT MAX(tuan_bat_dau) FROM vinh_danh_tuan",
                new MapSqlParameterSource(), LocalDate.class));
    }

    public List<Honor> week(LocalDate tuanBatDau, int toiDa) {
        return jdbc.query("""
                SELECT v.hang, v.nguoi_dung_id, u.ten_hien_thi, v.so_ngay, v.so_luot_hop_le
                FROM vinh_danh_tuan v JOIN nguoi_dung u ON u.id = v.nguoi_dung_id
                WHERE v.tuan_bat_dau = :tuan AND v.hang <= :toiDa
                ORDER BY v.hang
                """, new MapSqlParameterSource().addValue("tuan", tuanBatDau).addValue("toiDa", toiDa),
                (rs, i) -> new Honor(rs.getInt("hang"), rs.getLong("nguoi_dung_id"), rs.getString("ten_hien_thi"),
                        rs.getInt("so_ngay"), rs.getLong("so_luot_hop_le")));
    }

    public int wins(long nguoiDungId, int toiDa) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM vinh_danh_tuan WHERE nguoi_dung_id = :nguoi AND hang <= :toiDa",
                new MapSqlParameterSource().addValue("nguoi", nguoiDungId).addValue("toiDa", toiDa), Integer.class);
        return count == null ? 0 : count;
    }
}
