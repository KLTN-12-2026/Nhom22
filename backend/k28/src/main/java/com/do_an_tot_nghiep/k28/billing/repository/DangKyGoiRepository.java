package com.do_an_tot_nghiep.k28.billing.repository;

import com.do_an_tot_nghiep.k28.billing.entity.DangKyGoi;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiDangKy;
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

public interface DangKyGoiRepository extends JpaRepository<DangKyGoi, Long> {

    Optional<DangKyGoi> findByNguoiDungIdAndTrangThai(Long nguoiDungId, TrangThaiDangKy trangThai);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<DangKyGoi> findForUpdateByNguoiDungIdAndTrangThai(Long nguoiDungId, TrangThaiDangKy trangThai);

    Optional<DangKyGoi> findFirstByNguoiDungIdOrderByHetHanAtDesc(Long nguoiDungId);

    List<DangKyGoi> findByTrangThaiAndHetHanAtBeforeOrderByIdAsc(TrangThaiDangKy trangThai, Instant hetHanAt);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
            UPDATE DangKyGoi d
               SET d.trangThai = com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiDangKy.HET_HAN,
                   d.version = d.version + 1,
                   d.updatedAt = :now
             WHERE d.id = :id
               AND d.trangThai = com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiDangKy.HIEU_LUC
               AND d.hetHanAt <= :now
            """)
    int hetHanNeuDenHan(@Param("id") Long id, @Param("now") Instant now);

    @Query(value = """
            SELECT d FROM DangKyGoi d
            WHERE (:trangThai IS NULL OR d.trangThai = :trangThai)
              AND (:goiMa IS NULL OR d.goiMa = :goiMa)
              AND (:tu IS NULL OR d.hetHanAt > :tu)
              AND (:den IS NULL OR d.hetHanAt <= :den)
              AND (:email IS NULL OR d.nguoiDungId IN (
                    SELECT u.id FROM NguoiDung u WHERE LOWER(u.email) LIKE :email ESCAPE '!'))
            """, countQuery = """
            SELECT COUNT(d) FROM DangKyGoi d
            WHERE (:trangThai IS NULL OR d.trangThai = :trangThai)
              AND (:goiMa IS NULL OR d.goiMa = :goiMa)
              AND (:tu IS NULL OR d.hetHanAt > :tu)
              AND (:den IS NULL OR d.hetHanAt <= :den)
              AND (:email IS NULL OR d.nguoiDungId IN (
                    SELECT u.id FROM NguoiDung u WHERE LOWER(u.email) LIKE :email ESCAPE '!'))
            """)
    Page<DangKyGoi> adminSearch(@Param("trangThai") TrangThaiDangKy trangThai,
                                @Param("goiMa") String goiMa,
                                @Param("tu") Instant tu,
                                @Param("den") Instant den,
                                @Param("email") String email,
                                Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT d FROM DangKyGoi d WHERE d.id = :id")
    Optional<DangKyGoi> findForUpdate(@Param("id") Long id);

    long countByTrangThaiAndHetHanAtAfter(TrangThaiDangKy trangThai, Instant hetHanAt);

    long countByTrangThaiAndHetHanAtAfterAndHetHanAtLessThanEqual(TrangThaiDangKy trangThai, Instant tu, Instant den);

    long countByGoiMaAndTrangThaiAndHetHanAtAfter(String goiMa, TrangThaiDangKy trangThai, Instant hetHanAt);
}
