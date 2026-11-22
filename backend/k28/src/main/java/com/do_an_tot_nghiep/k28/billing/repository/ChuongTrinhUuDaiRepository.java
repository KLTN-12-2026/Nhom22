package com.do_an_tot_nghiep.k28.billing.repository;

import com.do_an_tot_nghiep.k28.billing.entity.ChuongTrinhUuDai;
import com.do_an_tot_nghiep.k28.billing.entity.enums.MaUuDai;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChuongTrinhUuDaiRepository extends JpaRepository<ChuongTrinhUuDai, Long> {

    Optional<ChuongTrinhUuDai> findByMa(MaUuDai ma);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM ChuongTrinhUuDai c WHERE c.ma = :ma")
    Optional<ChuongTrinhUuDai> findForUpdate(@Param("ma") MaUuDai ma);

    List<ChuongTrinhUuDai> findAllByOrderByIdAsc();
}
