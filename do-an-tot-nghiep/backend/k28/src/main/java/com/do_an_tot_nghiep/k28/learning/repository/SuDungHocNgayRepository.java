package com.do_an_tot_nghiep.k28.learning.repository;

import com.do_an_tot_nghiep.k28.learning.entity.SuDungHocNgay;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SuDungHocNgayRepository extends JpaRepository<SuDungHocNgay, Long> {

    Optional<SuDungHocNgay> findByNguoiDungIdAndNgayDiaPhuong(Long nguoiDungId, LocalDate ngayDiaPhuong);

    @Modifying
    @Query(value = """
            insert into su_dung_hoc_ngay
                (nguoi_dung_id, ngay_dia_phuong, created_at, updated_at)
            values (:userId, :ngay, :now, :now)
            on duplicate key update id = id
            """, nativeQuery = true)
    int ensureRow(
            @Param("userId") Long userId,
            @Param("ngay") LocalDate ngay,
            @Param("now") Instant now
    );

    @Query("""
            select s.ngayDiaPhuong
            from SuDungHocNgay s
            where s.nguoiDungId = :userId
              and s.soLuotHopLe >= :toiThieu
              and s.ngayDiaPhuong <= :homNay
            order by s.ngayDiaPhuong desc
            """)
    List<LocalDate> qualifyingDays(
            @Param("userId") Long userId,
            @Param("toiThieu") int toiThieu,
            @Param("homNay") LocalDate homNay,
            Pageable pageable
    );
}
