package com.do_an_tot_nghiep.k28.notification.repository;

import com.do_an_tot_nghiep.k28.notification.entity.ThongBaoHeThong;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ThongBaoHeThongRepository extends JpaRepository<ThongBaoHeThong, Long> {

    Page<ThongBaoHeThong> findAllByOrderByBatDauAtDescIdDesc(Pageable pageable);

    @Query("""
            select t
            from ThongBaoHeThong t
            where t.hienThi = true
              and t.batDauAt <= :now
              and (t.ketThucAt is null or t.ketThucAt > :now)
            order by t.batDauAt desc, t.id desc
            """)
    List<ThongBaoHeThong> findActive(@Param("now") Instant now, Pageable pageable);
}
