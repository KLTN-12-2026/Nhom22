package com.do_an_tot_nghiep.k28.learning.repository;

import com.do_an_tot_nghiep.k28.learning.entity.PhienHoc;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PhienHocRepository extends JpaRepository<PhienHoc, Long> {

    Optional<PhienHoc> findByIdAndNguoiDungId(Long id, Long nguoiDungId);

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