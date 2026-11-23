package com.do_an_tot_nghiep.k28.account.repository;

import com.do_an_tot_nghiep.k28.account.entity.GiaoDien;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GiaoDienRepository extends JpaRepository<GiaoDien, String> {

    List<GiaoDien> findAllByOrderByThuTuAsc();
}
