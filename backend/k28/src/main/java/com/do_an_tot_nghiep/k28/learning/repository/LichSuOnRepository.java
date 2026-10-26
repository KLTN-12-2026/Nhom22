package com.do_an_tot_nghiep.k28.learning.repository;

import com.do_an_tot_nghiep.k28.learning.entity.LichSuOn;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LichSuOnRepository extends JpaRepository<LichSuOn, Long> {

    @Query(value = """
            select l.phien_id as phienId,
                   t.the_id as theId,
                   t.chieu_hoc as chieuHoc,
                   l.danh_gia as danhGia,
                   l.truoc_json as truocJson,
                   l.sau_json as sauJson
            from lich_su_on l
            join tien_do_the t on t.id = l.tien_do_id
            where l.nguoi_dung_id = :userId
              and l.client_event_id = :clientEventId
            """, nativeQuery = true)
    Optional<ReviewEventRow> findEvent(
            @Param("userId") Long userId,
            @Param("clientEventId") String clientEventId
    );

    @Modifying
    @Query(value = """
            insert into lich_su_on
                (nguoi_dung_id, client_event_id, phien_id, tien_do_id,
                 danh_gia, thoi_gian, truoc_json, sau_json,
                 phien_ban_thuat_toan, created_at, updated_at)
            values
                (:userId, :clientEventId, :phienId, :tienDoId,
                 :danhGia, :thoiGian, cast(:truocJson as json),
                 cast(:sauJson as json), :phienBan, :now, :now)
            """, nativeQuery = true)
    int insertEvent(
            @Param("userId") Long userId,
            @Param("clientEventId") String clientEventId,
            @Param("phienId") Long phienId,
            @Param("tienDoId") Long tienDoId,
            @Param("danhGia") String danhGia,
            @Param("thoiGian") int thoiGian,
            @Param("truocJson") String truocJson,
            @Param("sauJson") String sauJson,
            @Param("phienBan") String phienBan,
            @Param("now") Instant now
    );
}
