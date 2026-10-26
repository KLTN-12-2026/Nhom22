package com.do_an_tot_nghiep.k28.learning.repository;

import com.do_an_tot_nghiep.k28.learning.entity.PhienHocThe;
import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PhienHocTheRepository extends JpaRepository<PhienHocThe, Long> {

    List<PhienHocThe> findByPhienIdOrderByThuTu(Long phienId);

    Optional<PhienHocThe> findByPhienIdAndTheIdAndChieuHoc(
            Long phienId, Long theId, ChieuHoc chieuHoc
    );

    @Query("select coalesce(max(p.thuTu), 0) from PhienHocThe p where p.phienId = :phienId")
    int maxThuTu(@Param("phienId") Long phienId);
}
