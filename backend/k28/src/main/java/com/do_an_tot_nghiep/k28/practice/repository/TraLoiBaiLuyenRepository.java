package com.do_an_tot_nghiep.k28.practice.repository;

import com.do_an_tot_nghiep.k28.practice.entity.TraLoiBaiLuyen;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TraLoiBaiLuyenRepository extends JpaRepository<TraLoiBaiLuyen, Long> {

    List<TraLoiBaiLuyen> findByLanLamId(Long lanLamId);
}
