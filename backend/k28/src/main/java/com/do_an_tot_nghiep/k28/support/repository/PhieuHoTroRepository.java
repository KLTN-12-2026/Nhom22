package com.do_an_tot_nghiep.k28.support.repository;

import com.do_an_tot_nghiep.k28.support.entity.PhieuHoTro;
import com.do_an_tot_nghiep.k28.support.entity.enums.DoUuTien;
import com.do_an_tot_nghiep.k28.support.entity.enums.LoaiVanDe;
import com.do_an_tot_nghiep.k28.support.entity.enums.TrangThaiPhieu;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PhieuHoTroRepository extends JpaRepository<PhieuHoTro, Long> {

    Page<PhieuHoTro> findByNguoiDungId(Long nguoiDungId, Pageable pageable);

    @Query("""
            select p from PhieuHoTro p
            where (:trangThai is null or p.trangThai = :trangThai)
              and (:loaiVanDe is null or p.loaiVanDe = :loaiVanDe)
              and (:doUuTien is null or p.doUuTien = :doUuTien)
            """)
    Page<PhieuHoTro> search(@Param("trangThai") TrangThaiPhieu trangThai,
                            @Param("loaiVanDe") LoaiVanDe loaiVanDe,
                            @Param("doUuTien") DoUuTien doUuTien, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from PhieuHoTro p where p.id = :id")
    Optional<PhieuHoTro> findForUpdate(@Param("id") Long id);
}
