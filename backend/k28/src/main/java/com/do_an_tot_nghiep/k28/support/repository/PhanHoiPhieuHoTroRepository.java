package com.do_an_tot_nghiep.k28.support.repository;

import com.do_an_tot_nghiep.k28.support.entity.PhanHoiPhieuHoTro;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PhanHoiPhieuHoTroRepository extends JpaRepository<PhanHoiPhieuHoTro, Long> {

    List<PhanHoiPhieuHoTro> findByPhieuIdInOrderByCreatedAtAscIdAsc(Collection<Long> phieuIds);
}
