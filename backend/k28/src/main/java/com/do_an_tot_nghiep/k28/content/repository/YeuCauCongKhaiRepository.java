package com.do_an_tot_nghiep.k28.content.repository;

import com.do_an_tot_nghiep.k28.content.entity.YeuCauCongKhai;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiYeuCauCongKhai;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface YeuCauCongKhaiRepository extends JpaRepository<YeuCauCongKhai, Long> {

    Optional<YeuCauCongKhai> findFirstByBoTheIdOrderByIdDesc(Long boTheId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select y from YeuCauCongKhai y where y.id = :id")
    Optional<YeuCauCongKhai> findForUpdate(@Param("id") Long id);

    @Query("""
            select y
            from YeuCauCongKhai y
            where y.id in (
                select max(l.id) from YeuCauCongKhai l where l.boTheId in :deckIds group by l.boTheId
            )
            """)
    List<YeuCauCongKhai> findLatest(@Param("deckIds") Collection<Long> deckIds);

    @Query("""
            select y.id
            from YeuCauCongKhai y
            where y.trangThai = com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiYeuCauCongKhai.CHO_DUYET
              and y.hetHanAt <= :now
            order by y.id
            """)
    List<Long> findOverdueIds(@Param("now") Instant now, Pageable pageable);

    @Query(value = """
            select y
            from YeuCauCongKhai y, BoThe s, NguoiDung u
            where s.id = y.boNguonId
              and u.id = s.chuSoHuuId
              and s.chuSoHuuId = :userId
              and s.xoaAt is null
              and s.quyenTruyCap = com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap.CONG_KHAI
              and s.trangThaiKiemDuyet = com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiKiemDuyet.BINH_THUONG
              and u.trangThai = com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung.HOAT_DONG
              and y.nguoiGuiId <> :userId
              and (:trangThai is null or y.trangThai = :trangThai)
            order by y.createdAt desc, y.id desc
            """)
    Page<YeuCauCongKhai> findForAuthor(@Param("userId") Long userId,
                                       @Param("trangThai") TrangThaiYeuCauCongKhai trangThai,
                                       Pageable pageable);

    @Query(value = """
            select y
            from YeuCauCongKhai y, BoThe s, NguoiDung u
            where s.id = y.boNguonId
              and u.id = s.chuSoHuuId
              and (s.xoaAt is not null
                   or s.quyenTruyCap <> com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap.CONG_KHAI
                   or s.trangThaiKiemDuyet <> com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiKiemDuyet.BINH_THUONG
                   or u.trangThai <> com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung.HOAT_DONG)
              and not (y.trangThai = com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiYeuCauCongKhai.DA_DUYET
                       and y.nguoiXuLyId = y.nguoiGuiId)
              and (:trangThai is null or y.trangThai = :trangThai)
            order by y.createdAt desc, y.id desc
            """)
    Page<YeuCauCongKhai> findForAdmin(@Param("trangThai") TrangThaiYeuCauCongKhai trangThai, Pageable pageable);
}
