package com.do_an_tot_nghiep.k28.billing.repository;

import com.do_an_tot_nghiep.k28.billing.entity.KhuyenMai;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KhuyenMaiRepository extends JpaRepository<KhuyenMai, Long> {

    Optional<KhuyenMai> findByMa(String ma);

    boolean existsByMaAndIdNot(String ma, Long id);

    boolean existsByMa(String ma);

    @Query("""
            SELECT k FROM KhuyenMai k
            WHERE k.ma IS NULL AND k.hoatDong = TRUE AND k.batDauAt <= :now AND k.ketThucAt > :now
            """)
    List<KhuyenMai> autoActive(@Param("now") Instant now);

    @Query("""
            SELECT k FROM KhuyenMai k
            WHERE (:hoatDong IS NULL OR k.hoatDong = :hoatDong)
            """)
    Page<KhuyenMai> adminSearch(@Param("hoatDong") Boolean hoatDong, Pageable pageable);
}
