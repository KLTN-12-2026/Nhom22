package com.do_an_tot_nghiep.k28.ai.repository;

import com.do_an_tot_nghiep.k28.ai.entity.BanNhapTheAi;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BanNhapTheAiRepository extends JpaRepository<BanNhapTheAi, Long> {

    List<BanNhapTheAi> findByYeuCauIdOrderByThuTu(Long yeuCauId);

    List<BanNhapTheAi> findByYeuCauIdAndIdInOrderByThuTu(Long yeuCauId, Collection<Long> ids);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from BanNhapTheAi d where d.yeuCauId = :yeuCauId")
    int deleteByYeuCau(@Param("yeuCauId") Long yeuCauId);
}
