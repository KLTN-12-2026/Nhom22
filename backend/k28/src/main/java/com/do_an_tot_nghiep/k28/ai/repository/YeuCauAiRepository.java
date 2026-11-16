package com.do_an_tot_nghiep.k28.ai.repository;

import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;
import java.util.List;
import java.time.LocalDate;
import com.do_an_tot_nghiep.k28.ai.entity.YeuCauAi;
import jakarta.persistence.LockModeType;
import com.do_an_tot_nghiep.k28.ai.entity.enums.LoaiYeuCauAi;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface YeuCauAiRepository extends JpaRepository<YeuCauAi, Long> {

    Optional<YeuCauAi> findByIdAndNguoiDungId(Long id, Long nguoiDungId);

    Page<YeuCauAi> findByNguoiDungId(Long nguoiDungId, Pageable pageable);

    Page<YeuCauAi> findByNguoiDungIdAndLoai(Long nguoiDungId, LoaiYeuCauAi loai, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select y from YeuCauAi y where y.id = :id")
    Optional<YeuCauAi> findForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select y from YeuCauAi y where y.id = :id and y.nguoiDungId = :userId")
    Optional<YeuCauAi> findOwnedForUpdate(@Param("id") Long id, @Param("userId") Long userId);

    @Query("""
            select y.hanMucLoai as loai,
                   sum(case when y.trangThai = com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiYeuCauAi.LOI
                       then 1 else 0 end) as soLoi,
                   sum(case when y.trangThai = com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiYeuCauAi.KHONG_XAC_DINH
                       then 1 else 0 end) as soKhongXacDinh
            from YeuCauAi y
            where y.hanMucLoai is not null
              and y.hanMucNgay >= :tuNgay
              and y.hanMucNgay <= :denNgay
            group by y.hanMucLoai
            """)
    List<FailureRow> failures(@Param("tuNgay") LocalDate tuNgay, @Param("denNgay") LocalDate denNgay);

    interface FailureRow {

        LoaiDichVu getLoai();

        Long getSoLoi();

        Long getSoKhongXacDinh();
    }
}
