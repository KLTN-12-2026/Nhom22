package com.do_an_tot_nghiep.k28.account.repository;

import com.do_an_tot_nghiep.k28.account.entity.LichLeGiaoDien;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LichLeGiaoDienRepository extends JpaRepository<LichLeGiaoDien, Long> {

    @Query("""
            select l from LichLeGiaoDien l
            where l.ngayLe >= :tu and l.ngayLe <= :den
            order by l.ngayLe
            """)
    List<LichLeGiaoDien> findNear(@Param("tu") LocalDate tu, @Param("den") LocalDate den);

    List<LichLeGiaoDien> findAllByOrderByNgayLeDesc();

    boolean existsByGiaoDienMaAndNgayLe(String giaoDienMa, LocalDate ngayLe);
}
