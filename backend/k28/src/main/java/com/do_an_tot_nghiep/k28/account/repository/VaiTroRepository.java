package com.do_an_tot_nghiep.k28.account.repository;

import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface VaiTroRepository extends JpaRepository<VaiTro, Long> {

    Optional<VaiTro> findByMa(String ma);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from VaiTro r where r.ma = :ma")
    Optional<VaiTro> lockByMa(@Param("ma") String ma);
}
