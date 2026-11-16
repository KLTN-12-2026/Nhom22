package com.do_an_tot_nghiep.k28.privacy.repository;

import com.do_an_tot_nghiep.k28.privacy.entity.YeuCauXoaDuLieu;
import com.do_an_tot_nghiep.k28.privacy.entity.enums.TrangThaiYeuCauXoa;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface YeuCauXoaDuLieuRepository extends JpaRepository<YeuCauXoaDuLieu, Long> {

    Optional<YeuCauXoaDuLieu> findFirstByNguoiDungIdAndTrangThaiIn(Long nguoiDungId,
                                                                   Collection<TrangThaiYeuCauXoa> trangThai);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT y FROM YeuCauXoaDuLieu y WHERE y.id = :id")
    Optional<YeuCauXoaDuLieu> findForUpdate(@Param("id") Long id);
}
