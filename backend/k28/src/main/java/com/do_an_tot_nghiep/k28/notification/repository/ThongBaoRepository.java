package com.do_an_tot_nghiep.k28.notification.repository;

import com.do_an_tot_nghiep.k28.notification.entity.ThongBao;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ThongBaoRepository extends JpaRepository<ThongBao, Long> {

    @Modifying
    @Query(value = """
            insert ignore into thong_bao
                (nguoi_dung_id, loai, ngay_dia_phuong, tieu_de, noi_dung, lien_ket,
                 hien_thi, gui_email, created_at, updated_at)
            values (:userId, :loai, :ngay, :tieuDe, :noiDung, :lienKet, :hienThi, :guiEmail, :now, :now)
            """, nativeQuery = true)
    int insertOnce(
            @Param("userId") Long userId,
            @Param("loai") String loai,
            @Param("ngay") LocalDate ngay,
            @Param("tieuDe") String tieuDe,
            @Param("noiDung") String noiDung,
            @Param("lienKet") String lienKet,
            @Param("hienThi") boolean hienThi,
            @Param("guiEmail") boolean guiEmail,
            @Param("now") Instant now
    );

    @Query("""
            select t from ThongBao t
            where t.nguoiDungId = :userId and t.hienThi = true
              and (:chuaDoc = false or t.daDocAt is null)
            order by t.createdAt desc, t.id desc
            """)
    Page<ThongBao> inbox(@Param("userId") Long userId, @Param("chuaDoc") boolean chuaDoc, Pageable pageable);

    long countByNguoiDungIdAndHienThiTrueAndDaDocAtIsNull(Long nguoiDungId);

    Optional<ThongBao> findByIdAndNguoiDungIdAndHienThiTrue(Long id, Long nguoiDungId);
}
