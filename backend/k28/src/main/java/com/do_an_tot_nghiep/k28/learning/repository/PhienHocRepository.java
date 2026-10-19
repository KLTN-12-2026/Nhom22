package com.do_an_tot_nghiep.k28.learning.repository;

import com.do_an_tot_nghiep.k28.learning.entity.PhienHoc;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhienHocRepository extends JpaRepository<PhienHoc, Long> {

    Optional<PhienHoc> findByIdAndNguoiDungId(Long id, Long nguoiDungId);
}
