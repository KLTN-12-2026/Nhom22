package com.do_an_tot_nghiep.k28.practice.repository;

import com.do_an_tot_nghiep.k28.practice.entity.TraLoiBaiLuyen;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TraLoiBaiLuyenRepository extends JpaRepository<TraLoiBaiLuyen, Long> {

    List<TraLoiBaiLuyen> findByLanLamId(Long lanLamId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<TraLoiBaiLuyen> findByLanLamIdAndCauHoiId(Long lanLamId, Long cauHoiId);
}
