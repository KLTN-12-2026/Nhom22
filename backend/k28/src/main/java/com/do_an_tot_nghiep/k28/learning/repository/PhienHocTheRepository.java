package com.do_an_tot_nghiep.k28.learning.repository;

import com.do_an_tot_nghiep.k28.learning.entity.PhienHocThe;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhienHocTheRepository extends JpaRepository<PhienHocThe, Long> {

    List<PhienHocThe> findByPhienIdOrderByThuTu(Long phienId);
}
