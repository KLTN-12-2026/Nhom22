package com.do_an_tot_nghiep.k28.billing.repository;

import com.do_an_tot_nghiep.k28.billing.entity.XacMinhHssv;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiXacMinh;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface XacMinhHssvRepository extends JpaRepository<XacMinhHssv, Long> {

    Optional<XacMinhHssv> findFirstByNguoiDungIdOrderByIdDesc(Long nguoiDungId);

    Optional<XacMinhHssv> findFirstByNguoiDungIdAndTrangThaiOrderByIdDesc(Long nguoiDungId, TrangThaiXacMinh trangThai);

    boolean existsByNguoiDungIdAndTrangThai(Long nguoiDungId, TrangThaiXacMinh trangThai);

    boolean existsByNguoiDungIdAndDaNhanUuDaiAtIsNotNull(Long nguoiDungId);

    long countByDaNhanUuDaiAtIsNotNull();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT x FROM XacMinhHssv x WHERE x.id = :id")
    Optional<XacMinhHssv> findForUpdate(@Param("id") Long id);

    @Query("SELECT x FROM XacMinhHssv x WHERE (:trangThai IS NULL OR x.trangThai = :trangThai)")
    Page<XacMinhHssv> adminSearch(@Param("trangThai") TrangThaiXacMinh trangThai, Pageable pageable);
}
