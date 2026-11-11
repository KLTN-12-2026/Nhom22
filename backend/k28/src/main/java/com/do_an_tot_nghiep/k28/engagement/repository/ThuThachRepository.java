package com.do_an_tot_nghiep.k28.engagement.repository;

import com.do_an_tot_nghiep.k28.engagement.entity.ThuThach;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ThuThachRepository extends JpaRepository<ThuThach, Long> {

    List<ThuThach> findByHoatDongTrueOrderByIdAsc();
}
