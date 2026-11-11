package com.do_an_tot_nghiep.k28.engagement.repository;

import com.do_an_tot_nghiep.k28.engagement.entity.HuyHieu;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HuyHieuRepository extends JpaRepository<HuyHieu, Long> {

    List<HuyHieu> findByHoatDongTrueOrderByThuTuAscIdAsc();
}
