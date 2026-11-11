package com.do_an_tot_nghiep.k28.engagement.repository;

import com.do_an_tot_nghiep.k28.engagement.entity.TienDoThuThach;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TienDoThuThachRepository extends JpaRepository<TienDoThuThach, Long> {

    Optional<TienDoThuThach> findByNguoiDungIdAndThuThachIdAndTuanBatDau(
            Long nguoiDungId, Long thuThachId, LocalDate tuanBatDau);

    List<TienDoThuThach> findByNguoiDungIdAndTuanBatDau(Long nguoiDungId, LocalDate tuanBatDau);

    @Modifying
    @Query(value = """
            insert into tien_do_thu_thach
                (nguoi_dung_id, thu_thach_id, tuan_bat_dau, created_at, updated_at)
            values (:userId, :thuThachId, :tuan, :now, :now)
            on duplicate key update id = id
            """, nativeQuery = true)
    int ensureRow(
            @Param("userId") Long userId,
            @Param("thuThachId") Long thuThachId,
            @Param("tuan") LocalDate tuan,
            @Param("now") Instant now
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select t from TienDoThuThach t
            where t.nguoiDungId = :userId and t.thuThachId = :thuThachId and t.tuanBatDau = :tuan
            """)
    Optional<TienDoThuThach> lockRow(
            @Param("userId") Long userId,
            @Param("thuThachId") Long thuThachId,
            @Param("tuan") LocalDate tuan
    );
}
