package com.do_an_tot_nghiep.k28.learning.repository;

import com.do_an_tot_nghiep.k28.learning.entity.SuDungHocNgay;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SuDungHocNgayRepository extends JpaRepository<SuDungHocNgay, Long> {

    Optional<SuDungHocNgay> findByNguoiDungIdAndNgayDiaPhuong(Long nguoiDungId, LocalDate ngayDiaPhuong);

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
