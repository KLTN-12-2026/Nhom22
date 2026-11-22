package com.do_an_tot_nghiep.k28.learning.repository;

import com.do_an_tot_nghiep.k28.learning.entity.KhoiPhucChuoi;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KhoiPhucChuoiRepository extends JpaRepository<KhoiPhucChuoi, Long> {

    @Query("select k.ngay from KhoiPhucChuoi k where k.nguoiDungId = :userId")
    List<LocalDate> days(@Param("userId") Long userId);

    long countByNguoiDungIdAndThang(Long nguoiDungId, LocalDate thang);
}
