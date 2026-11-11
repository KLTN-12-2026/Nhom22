package com.do_an_tot_nghiep.k28.common.quota.repository;

import com.do_an_tot_nghiep.k28.common.quota.entity.HanMucDichVu;
import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface HanMucDichVuRepository extends JpaRepository<HanMucDichVu, Long> {

    Optional<HanMucDichVu> findByGoiMaAndLoai(String goiMa, LoaiDichVu loai);
}
