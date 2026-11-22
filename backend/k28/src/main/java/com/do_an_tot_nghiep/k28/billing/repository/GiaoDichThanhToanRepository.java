package com.do_an_tot_nghiep.k28.billing.repository;

import com.do_an_tot_nghiep.k28.billing.entity.GiaoDichThanhToan;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GiaoDichThanhToanRepository extends JpaRepository<GiaoDichThanhToan, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<GiaoDichThanhToan> findForUpdateByMaDon(String maDon);

    Optional<GiaoDichThanhToan> findByMaDonAndNguoiDungId(String maDon, Long nguoiDungId);

    boolean existsByNguoiDungIdAndTrangThaiAndGoiMaNotAndTaoAtAfter(Long nguoiDungId, TrangThaiGiaoDich trangThai,
                                                                    String goiMa, Instant taoAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE GiaoDichThanhToan g
               SET g.trangThai = com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich.HET_HAN,
                   g.version = g.version + 1,
                   g.updatedAt = :now
             WHERE g.maDon = :maDon
               AND g.trangThai = com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich.CHO_THANH_TOAN
               AND g.taoAt <= :hanCuoi
            """)
    int hetHanNeuQuaHan(@Param("maDon") String maDon, @Param("hanCuoi") Instant hanCuoi, @Param("now") Instant now);

    Page<GiaoDichThanhToan> findByNguoiDungId(Long nguoiDungId, Pageable pageable);

    Page<GiaoDichThanhToan> findByNguoiDungIdAndTrangThai(Long nguoiDungId, TrangThaiGiaoDich trangThai,
                                                          Pageable pageable);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE GiaoDichThanhToan g
               SET g.trangThai = com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich.HET_HAN,
                   g.version = g.version + 1,
                   g.updatedAt = :now
             WHERE g.nguoiDungId = :nguoiDungId
               AND g.trangThai = com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich.CHO_THANH_TOAN
               AND g.taoAt <= :hanCuoi
            """)
    int hetHanQuaHanCuaNguoiDung(@Param("nguoiDungId") Long nguoiDungId, @Param("hanCuoi") Instant hanCuoi,
                                 @Param("now") Instant now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE GiaoDichThanhToan g
               SET g.trangThai = com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich.HET_HAN,
                   g.version = g.version + 1,
                   g.updatedAt = :now
             WHERE g.trangThai = com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich.CHO_THANH_TOAN
               AND g.taoAt <= :hanCuoi
            """)
    int hetHanTatCaQuaHan(@Param("hanCuoi") Instant hanCuoi, @Param("now") Instant now);

    @Query(value = """
            SELECT g FROM GiaoDichThanhToan g
            WHERE (:trangThai IS NULL OR g.trangThai = :trangThai)
              AND (:goiMa IS NULL OR g.goiMa = :goiMa)
              AND (:tu IS NULL OR g.taoAt >= :tu)
              AND (:den IS NULL OR g.taoAt < :den)
              AND (:email IS NULL OR g.nguoiDungId IN (
                    SELECT u.id FROM NguoiDung u WHERE LOWER(u.email) LIKE :email ESCAPE '!'))
            """, countQuery = """
            SELECT COUNT(g) FROM GiaoDichThanhToan g
            WHERE (:trangThai IS NULL OR g.trangThai = :trangThai)
              AND (:goiMa IS NULL OR g.goiMa = :goiMa)
              AND (:tu IS NULL OR g.taoAt >= :tu)
              AND (:den IS NULL OR g.taoAt < :den)
              AND (:email IS NULL OR g.nguoiDungId IN (
                    SELECT u.id FROM NguoiDung u WHERE LOWER(u.email) LIKE :email ESCAPE '!'))
            """)
    Page<GiaoDichThanhToan> adminSearch(@Param("trangThai") TrangThaiGiaoDich trangThai,
                                        @Param("goiMa") String goiMa,
                                        @Param("tu") Instant tu,
                                        @Param("den") Instant den,
                                        @Param("email") String email,
                                        Pageable pageable);

    Optional<GiaoDichThanhToan> findByMaDon(String maDon);

    boolean existsByNguoiDungIdAndTrangThai(Long nguoiDungId, TrangThaiGiaoDich trangThai);

    Optional<GiaoDichThanhToan> findFirstByNguoiDungIdAndGoiMaAndTrangThaiOrderByHoanTatAtDesc(
            Long nguoiDungId, String goiMa, TrangThaiGiaoDich trangThai);

    long countByKhuyenMaiIdAndTrangThai(Long khuyenMaiId, TrangThaiGiaoDich trangThai);

    long countByKhuyenMaiIdAndNguoiDungIdAndTrangThai(Long khuyenMaiId, Long nguoiDungId, TrangThaiGiaoDich trangThai);

    @Query("""
            SELECT g.hoanTatAt AS hoanTatAt, g.goiMa AS goiMa, g.soTien AS soTien
            FROM GiaoDichThanhToan g
            WHERE g.trangThai = com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich.THANH_CONG
              AND g.hoanTatAt >= :tu AND g.hoanTatAt < :den
            """)
    List<RevenueRow> revenueRows(@Param("tu") Instant tu, @Param("den") Instant den);

    @Query("""
            SELECT g.trangThai AS trangThai, COUNT(g) AS soLuong
            FROM GiaoDichThanhToan g
            WHERE g.taoAt >= :tu AND g.taoAt < :den
            GROUP BY g.trangThai
            """)
    List<StatusCount> statusCounts(@Param("tu") Instant tu, @Param("den") Instant den);

    interface RevenueRow {

        Instant getHoanTatAt();

        String getGoiMa();

        long getSoTien();
    }

    interface StatusCount {

        TrangThaiGiaoDich getTrangThai();

        long getSoLuong();
    }
}
