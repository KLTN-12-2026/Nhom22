package com.do_an_tot_nghiep.k28.learning.repository;

import com.do_an_tot_nghiep.k28.learning.entity.PhienHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiPhienHoc;

import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PhienHocRepository extends JpaRepository<PhienHoc, Long> {

    Optional<PhienHoc> findByIdAndNguoiDungId(Long id, Long nguoiDungId);

    Optional<PhienHoc> findFirstByNguoiDungIdAndTrangThaiAndBatDauAtGreaterThanEqualOrderByBatDauAtDescIdDesc(
            Long nguoiDungId, TrangThaiPhienHoc trangThai, Instant batDauAt
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select p
            from PhienHoc p
            where p.id = :id
              and p.nguoiDungId = :userId
            """)
    Optional<PhienHoc> lockOwned(@Param("id") Long id, @Param("userId") Long userId);

    @Query("""
            select b.ten
            from BoThe b
            where b.id = :id
              and b.chuSoHuuId = :userId
              and b.xoaAt is null
            """)
    Optional<String> ownedDeckName(@Param("userId") Long userId, @Param("id") Long id);

    @Query("select b.ten from BoThe b where b.id = :id")
    Optional<String> deckName(@Param("id") Long id);
}