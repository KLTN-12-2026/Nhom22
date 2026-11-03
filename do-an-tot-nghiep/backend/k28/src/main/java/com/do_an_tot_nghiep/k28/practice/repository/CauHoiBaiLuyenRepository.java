package com.do_an_tot_nghiep.k28.practice.repository;

import com.do_an_tot_nghiep.k28.practice.entity.CauHoiBaiLuyen;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CauHoiBaiLuyenRepository extends JpaRepository<CauHoiBaiLuyen, Long> {

    List<CauHoiBaiLuyen> findByBaiIdOrderByThuTu(Long baiId);
}
