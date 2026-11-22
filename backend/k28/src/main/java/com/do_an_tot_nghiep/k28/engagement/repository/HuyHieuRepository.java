package com.do_an_tot_nghiep.k28.engagement.repository;

import com.do_an_tot_nghiep.k28.engagement.entity.HuyHieu;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HuyHieuRepository extends JpaRepository<HuyHieu, Long> {

    List<HuyHieu> findByHoatDongTrueOrderByThuTuAscIdAsc();

    Page<HuyHieu> findAllByOrderByThuTuAscIdAsc(Pageable pageable);

    boolean existsByMa(String ma);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select row from HuyHieu row where row.id = :id")
    Optional<HuyHieu> findForUpdate(@Param("id") Long id);
}
