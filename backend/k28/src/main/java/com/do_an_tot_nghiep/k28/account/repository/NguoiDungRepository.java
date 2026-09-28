package com.do_an_tot_nghiep.k28.account.repository;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface NguoiDungRepository extends JpaRepository<NguoiDung, Long> {

    Optional<NguoiDung> findByEmail(String email);

    boolean existsByEmail(String email);
}
