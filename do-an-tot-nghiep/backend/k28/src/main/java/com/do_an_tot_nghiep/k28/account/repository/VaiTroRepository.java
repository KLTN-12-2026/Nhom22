package com.do_an_tot_nghiep.k28.account.repository;

import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface VaiTroRepository extends JpaRepository<VaiTro, Long> {

    Optional<VaiTro> findByMa(String ma);
}
