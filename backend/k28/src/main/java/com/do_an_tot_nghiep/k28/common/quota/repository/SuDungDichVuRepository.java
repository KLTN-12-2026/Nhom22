package com.do_an_tot_nghiep.k28.common.quota.repository;

import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;

import com.do_an_tot_nghiep.k28.common.quota.entity.SuDungDichVu;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SuDungDichVuRepository extends JpaRepository<SuDungDichVu, Long> {

    List<SuDungDichVu> findByNguoiDungIdAndNgay(Long nguoiDungId, LocalDate ngay);

    @Modifying
    @Query(value = """
            INSERT INTO su_dung_dich_vu (nguoi_dung_id, ngay, loai, created_at, updated_at)
            VALUES (:nguoiDungId, :ngay, :loai, :now, :now)
            ON DUPLICATE KEY UPDATE id = id
            """, nativeQuery = true)
    int taoNeuChuaCo(@Param("nguoiDungId") Long nguoiDungId, @Param("ngay") LocalDate ngay,
                     @Param("loai") String loai, @Param("now") Instant now);

    @Modifying
    @Query(value = """
            UPDATE su_dung_dich_vu
            SET so_giu = so_giu + 1, updated_at = :now, version = version + 1
            WHERE nguoi_dung_id = :nguoiDungId AND ngay = :ngay AND loai = :loai
              AND so_giu + so_dung < :gioiHan
            """, nativeQuery = true)
    int giuCho(@Param("nguoiDungId") Long nguoiDungId, @Param("ngay") LocalDate ngay,
               @Param("loai") String loai, @Param("gioiHan") int gioiHan, @Param("now") Instant now);

    @Modifying
    @Query(value = """
            UPDATE su_dung_dich_vu
            SET so_giu = so_giu - 1, so_dung = so_dung + 1, updated_at = :now, version = version + 1
            WHERE nguoi_dung_id = :nguoiDungId AND ngay = :ngay AND loai = :loai AND so_giu > 0
            """, nativeQuery = true)
    int xacNhan(@Param("nguoiDungId") Long nguoiDungId, @Param("ngay") LocalDate ngay,
                @Param("loai") String loai, @Param("now") Instant now);

    @Modifying
    @Query(value = """
            UPDATE su_dung_dich_vu
            SET so_giu = so_giu - 1, updated_at = :now, version = version + 1
            WHERE nguoi_dung_id = :nguoiDungId AND ngay = :ngay AND loai = :loai AND so_giu > 0
            """, nativeQuery = true)
    int hoanTra(@Param("nguoiDungId") Long nguoiDungId, @Param("ngay") LocalDate ngay,
                @Param("loai") String loai, @Param("now") Instant now);

    @Query("""
            select u.loai as loai, sum(u.soDung) as soLuotDung, sum(u.soGiu) as soDangGiu,
                   count(distinct u.nguoiDungId) as soNguoiDung
            from SuDungDichVu u
            where u.ngay >= :tuNgay and u.ngay <= :denNgay
            group by u.loai
            """)
    List<UsageTotalRow> totals(@Param("tuNgay") LocalDate tuNgay, @Param("denNgay") LocalDate denNgay);

    interface UsageTotalRow {

        LoaiDichVu getLoai();

        Long getSoLuotDung();

        Long getSoDangGiu();

        Long getSoNguoiDung();
    }
}
