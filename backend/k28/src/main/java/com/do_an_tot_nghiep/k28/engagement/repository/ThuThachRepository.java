package com.do_an_tot_nghiep.k28.engagement.repository;

import com.do_an_tot_nghiep.k28.engagement.entity.ThuThach;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ThuThachRepository extends JpaRepository<ThuThach, Long> {

    List<ThuThach> findByHoatDongTrueOrderByIdAsc();

    Page<ThuThach> findAllByOrderByIdAsc(Pageable pageable);

    boolean existsByMa(String ma);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select row from ThuThach row where row.id = :id")
    Optional<ThuThach> findForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_READ)
    @Query("select row from ThuThach row where row.hoatDong = true order by row.id")
    List<ThuThach> findActiveForReward();
}
