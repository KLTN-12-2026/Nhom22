package com.do_an_tot_nghiep.k28.content.repository;

import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.Optional;

public interface BoTheRepository extends JpaRepository<BoThe, Long> {

    Page<BoThe> findByChuSoHuuIdAndXoaAtIsNullOrderByCreatedAtDescIdDesc(Long chuSoHuuId, Pageable pageable);

    Optional<BoThe> findByIdAndChuSoHuuIdAndXoaAtIsNull(Long id, Long chuSoHuuId);

    @Lock(LockModeType.PESSIMISTIC_READ)
    Optional<BoThe> findByIdAndXoaAtIsNull(Long id);
}
