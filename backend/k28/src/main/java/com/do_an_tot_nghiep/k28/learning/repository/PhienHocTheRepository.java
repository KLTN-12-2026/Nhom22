package com.do_an_tot_nghiep.k28.learning.repository;

import com.do_an_tot_nghiep.k28.learning.entity.PhienHocThe;
import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiPhienHocThe;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
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

    long countByPhienIdAndTrangThai(Long phienId, TrangThaiPhienHocThe trangThai);

    @Query("""
            select count(q)
            from PhienHocThe q
            join PhienHoc p on p.id = q.phienId
            join TheTuVung c on c.id = q.theId
            join BoThe b on b.id = c.boTheId
            where q.phienId = :phienId
              and q.trangThai = :chuaTraLoi
              and c.xoaAt is null
              and b.xoaAt is null
              and b.chuSoHuuId = p.nguoiDungId
              and not exists (
                  select 1 from TienDoThe t
                  where t.nguoiDungId = p.nguoiDungId
                    and t.theId = q.theId
                    and t.chieuHoc = q.chieuHoc
                    and t.trangThai = :tamNgung)
            """)
    long countAnswerable(
            @Param("phienId") Long phienId,
            @Param("chuaTraLoi") TrangThaiPhienHocThe chuaTraLoi,
            @Param("tamNgung") TrangThaiTienDo tamNgung
    );
}
