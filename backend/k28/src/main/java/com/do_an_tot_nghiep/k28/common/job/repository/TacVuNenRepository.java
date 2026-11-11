package com.do_an_tot_nghiep.k28.common.job.repository;

import com.do_an_tot_nghiep.k28.common.job.entity.TacVuNen;
import com.do_an_tot_nghiep.k28.common.job.entity.enums.TrangThaiTacVu;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

public interface TacVuNenRepository extends JpaRepository<TacVuNen, Long> {

    @Query(value = """
            SELECT * FROM tac_vu_nen
            WHERE trang_thai = 'CHO' AND next_run_at <= :now
            ORDER BY next_run_at, id
            LIMIT :limit
            FOR UPDATE SKIP LOCKED
            """, nativeQuery = true)
    List<TacVuNen> claim(@Param("now") Instant now, @Param("limit") int limit);

    @Transactional
    @Modifying
    @Query("""
                update TacVuNen t
                set t.trangThai = :to,
                    t.retryCount = :retry,
                    t.nextRunAt = :next,
                    t.maLoi = :maLoi,
                    t.khoaBoi = null,
                    t.khoaDenAt = null,
                    t.updatedAt = :now
                where t.id = :id and t.khoaBoi = :worker and t.trangThai = :running
            """)
    int chuyen(@Param("id") Long id,
               @Param("worker") String worker,
               @Param("running") TrangThaiTacVu running,
               @Param("to") TrangThaiTacVu to,
               @Param("retry") int retry,
               @Param("next") Instant next,
               @Param("maLoi") String maLoi,
               @Param("now") Instant now);

    List<TacVuNen> findTop50ByTrangThaiAndKhoaDenAtBefore(TrangThaiTacVu trangThai, Instant now);
}
