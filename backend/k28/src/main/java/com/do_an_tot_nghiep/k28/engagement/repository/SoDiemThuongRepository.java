package com.do_an_tot_nghiep.k28.engagement.repository;

import com.do_an_tot_nghiep.k28.engagement.entity.SoDiemThuong;
import com.do_an_tot_nghiep.k28.engagement.entity.enums.LoaiSuKien;
import java.time.LocalDate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SoDiemThuongRepository extends JpaRepository<SoDiemThuong, Long> {

    boolean existsByNguoiDungIdAndLoaiSuKienAndSuKienId(Long nguoiDungId, LoaiSuKien loaiSuKien, String suKienId);

    Page<SoDiemThuong> findByNguoiDungIdOrderByCreatedAtDescIdDesc(Long nguoiDungId, Pageable pageable);

    long countByNguoiDungIdAndLoaiSuKien(Long nguoiDungId, LoaiSuKien loaiSuKien);

    @Query("select coalesce(sum(s.soDiem), 0) from SoDiemThuong s where s.nguoiDungId = :userId")
    long totalPoints(@Param("userId") Long userId);

    @Query("""
            select coalesce(sum(s.soDiem), 0)
            from SoDiemThuong s
            where s.nguoiDungId = :userId and s.ngayDiaPhuong = :ngay
            """)
    long dayPoints(@Param("userId") Long userId, @Param("ngay") LocalDate ngay);
}
