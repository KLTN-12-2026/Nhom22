package com.do_an_tot_nghiep.k28.admin.repository;

import com.do_an_tot_nghiep.k28.admin.entity.NhatKyQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NhatKyQuanTriRepository extends JpaRepository<NhatKyQuanTri, Long> {

    @Query("""
            select a
            from NhatKyQuanTri a
            where (:hanhDong is null or a.hanhDong = :hanhDong)
              and (:loai is null or a.loaiDoiTuong = :loai)
              and (:tu is null or a.createdAt >= :tu)
              and (:den is null or a.createdAt < :den)
              and (:pattern is null
                   or lower(a.tenDoiTuong) like lower(:pattern) escape '!'
                   or lower(a.lyDo) like lower(:pattern) escape '!'
                   or a.nguoiThucHienId in (
                        select u.id from NguoiDung u
                        where lower(u.tenHienThi) like lower(:pattern) escape '!'))
            order by a.createdAt desc, a.id desc
            """)
    Page<NhatKyQuanTri> search(
            @Param("hanhDong") HanhDongQuanTri hanhDong,
            @Param("loai") LoaiDoiTuong loai,
            @Param("tu") Instant tu,
            @Param("den") Instant den,
            @Param("pattern") String pattern,
            Pageable pageable
    );
}
