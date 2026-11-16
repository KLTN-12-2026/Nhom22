package com.do_an_tot_nghiep.k28.moderation.repository;

import com.do_an_tot_nghiep.k28.moderation.entity.BaoCaoNoiDung;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.LoaiDoiTuongBaoCao;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.TrangThaiBaoCao;
import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BaoCaoNoiDungRepository extends JpaRepository<BaoCaoNoiDung, Long> {

    boolean existsByNguoiBaoCaoIdAndLoaiDoiTuongAndDoiTuongIdAndTrangThai(
            Long nguoiBaoCaoId, LoaiDoiTuongBaoCao loaiDoiTuong, Long doiTuongId, TrangThaiBaoCao trangThai);

    @Query("""
            select r from BaoCaoNoiDung r
            where (:trangThai is null or r.trangThai = :trangThai)
              and (:loai is null or r.loaiDoiTuong = :loai)
            """)
    Page<BaoCaoNoiDung> search(@Param("trangThai") TrangThaiBaoCao trangThai,
                               @Param("loai") LoaiDoiTuongBaoCao loai, Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from BaoCaoNoiDung r where r.id = :id")
    Optional<BaoCaoNoiDung> findForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select r from BaoCaoNoiDung r
            where r.loaiDoiTuong = :loai
              and r.doiTuongId = :doiTuongId
              and r.trangThai = com.do_an_tot_nghiep.k28.moderation.entity.enums.TrangThaiBaoCao.CHO_XU_LY
            order by r.id
            """)
    List<BaoCaoNoiDung> findPendingForUpdate(@Param("loai") LoaiDoiTuongBaoCao loai,
                                             @Param("doiTuongId") Long doiTuongId);
}
