package com.do_an_tot_nghiep.k28.engagement.repository;

import com.do_an_tot_nghiep.k28.engagement.entity.NguoiDungHuyHieu;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NguoiDungHuyHieuRepository extends JpaRepository<NguoiDungHuyHieu, Long> {

    List<NguoiDungHuyHieu> findByNguoiDungId(Long nguoiDungId);

    @Modifying
    @Query(value = """
            insert into nguoi_dung_huy_hieu
                (nguoi_dung_id, huy_hieu_id, nhan_at, created_at, updated_at)
            values (:userId, :huyHieuId, :now, :now, :now)
            on duplicate key update id = id
            """, nativeQuery = true)
    int award(@Param("userId") Long userId, @Param("huyHieuId") Long huyHieuId, @Param("now") Instant now);
}
