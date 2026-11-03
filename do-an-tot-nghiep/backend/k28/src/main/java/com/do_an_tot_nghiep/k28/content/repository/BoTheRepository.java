package com.do_an_tot_nghiep.k28.content.repository;

import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface BoTheRepository extends JpaRepository<BoThe, Long>, JpaSpecificationExecutor<BoThe> {

    Page<BoThe> findByChuSoHuuIdAndXoaAtIsNullOrderByCreatedAtDescIdDesc(Long chuSoHuuId, Pageable pageable);

    Optional<BoThe> findByIdAndChuSoHuuIdAndXoaAtIsNull(Long id, Long chuSoHuuId);

    @Query(value = """
            SELECT d.*
            FROM bo_the d
            JOIN bo_yeu_thich f ON f.bo_the_id = d.id
            WHERE f.nguoi_dung_id = :userId
              AND d.xoa_at IS NULL
              AND (d.chu_so_huu_id = :userId
                   OR (d.quyen_truy_cap = 'CONG_KHAI' AND d.trang_thai_kiem_duyet = 'BINH_THUONG'))
            ORDER BY f.created_at DESC, d.id DESC
            """, countQuery = """
            SELECT COUNT(*)
            FROM bo_the d
            JOIN bo_yeu_thich f ON f.bo_the_id = d.id
            WHERE f.nguoi_dung_id = :userId
              AND d.xoa_at IS NULL
              AND (d.chu_so_huu_id = :userId
                   OR (d.quyen_truy_cap = 'CONG_KHAI' AND d.trang_thai_kiem_duyet = 'BINH_THUONG'))
            """, nativeQuery = true)
    Page<BoThe> findFavorites(@Param("userId") Long userId, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_READ)
    Optional<BoThe> findByIdAndXoaAtIsNull(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select d
            from BoThe d
            where d.id = :id
              and d.chuSoHuuId = :ownerId
              and d.xoaAt is null
            """)
    Optional<BoThe> findOwnedForUpdate(
            @Param("id") Long id,
            @Param("ownerId") Long ownerId
    );
}
