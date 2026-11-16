package com.do_an_tot_nghiep.k28.billing.repository;

import com.do_an_tot_nghiep.k28.billing.entity.GoiDichVu;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GoiDichVuRepository extends JpaRepository<GoiDichVu, Long> {

    Optional<GoiDichVu> findByMa(String ma);

    Optional<GoiDichVu> findByMaAndHoatDongTrue(String ma);

    List<GoiDichVu> findByHoatDongTrueOrderByGiaThangAsc();

    List<GoiDichVu> findAllByOrderByGiaThangAsc();

    long countByHoatDongTrueAndMaNot(String ma);
}
