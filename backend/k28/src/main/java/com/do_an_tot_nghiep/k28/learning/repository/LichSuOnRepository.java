package com.do_an_tot_nghiep.k28.learning.repository;

import com.do_an_tot_nghiep.k28.learning.entity.LichSuOn;
import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LichSuOnRepository extends JpaRepository<LichSuOn, Long> {

    String HISTORY_SELECT = """
            select new com.do_an_tot_nghiep.k28.learning.repository.HistoryRow(
                l.id, l.phienId, t.theId, c.boTheId, c.tu, c.tuLoai, c.nghiaVi,
                t.chieuHoc, l.danhGia, l.thoiGian, l.truocJson, l.sauJson,
                l.phienBanThuatToan, l.createdAt)
            """;

    String HISTORY_FROM = """
            from LichSuOn l
            join TienDoThe t on t.id = l.tienDoId
            join TheTuVung c on c.id = t.theId
            where l.nguoiDungId = :userId
            """;

    String HISTORY_FILTER = """
              and (:phienId is null or l.phienId = :phienId)
              and (:theId is null or t.theId = :theId)
              and (:boTheId is null or c.boTheId = :boTheId)
              and (:chieuHoc is null or t.chieuHoc = :chieuHoc)
              and (:batDau is null or l.createdAt >= :batDau)
              and (:ketThuc is null or l.createdAt < :ketThuc)
            """;

    @Query(
            value = HISTORY_SELECT + HISTORY_FROM + HISTORY_FILTER
                    + "order by l.createdAt desc, l.id desc",
            countQuery = "select count(l) " + HISTORY_FROM + HISTORY_FILTER
    )
    Page<HistoryRow> history(
            @Param("userId") Long userId,
            @Param("phienId") Long phienId,
            @Param("theId") Long theId,
            @Param("boTheId") Long boTheId,
            @Param("chieuHoc") ChieuHoc chieuHoc,
            @Param("batDau") Instant batDau,
            @Param("ketThuc") Instant ketThuc,
            Pageable pageable
    );

    @Query("""
            select coalesce(sum(l.thoiGian), 0)
            from LichSuOn l
            where l.nguoiDungId = :userId
              and l.createdAt >= :batDau
              and l.createdAt < :ketThuc
            """)
    long studyTime(
            @Param("userId") Long userId,
            @Param("batDau") Instant batDau,
            @Param("ketThuc") Instant ketThuc
    );

    @Query(HISTORY_SELECT + HISTORY_FROM + "  and l.phienId = :phienId order by l.id")
    List<HistoryRow> sessionEvents(
            @Param("userId") Long userId,
            @Param("phienId") Long phienId
    );

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
