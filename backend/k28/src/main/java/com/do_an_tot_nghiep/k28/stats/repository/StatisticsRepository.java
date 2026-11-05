package com.do_an_tot_nghiep.k28.stats.repository;

import com.do_an_tot_nghiep.k28.learning.entity.LichSuOn;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

public interface StatisticsRepository extends Repository<LichSuOn, Long> {

    @Query("""
            select count(b) > 0
            from BoThe b
            where b.id = :id
              and b.chuSoHuuId = :userId
              and b.xoaAt is null
            """)
    boolean ownsDeck(@Param("userId") Long userId, @Param("id") Long id);

    @Query("""
            select new com.do_an_tot_nghiep.k28.stats.repository.ReviewStatRow(l.createdAt, t.theId, l.danhGia)
            from LichSuOn l
            join TienDoThe t on t.id = l.tienDoId
            join TheTuVung c on c.id = t.theId
            where l.nguoiDungId = :userId
              and l.createdAt >= :batDau
              and l.createdAt < :ketThuc
              and (:boTheId is null or c.boTheId = :boTheId)
            """)
    List<ReviewStatRow> reviews(
            @Param("userId") Long userId,
            @Param("batDau") Instant batDau,
            @Param("ketThuc") Instant ketThuc,
            @Param("boTheId") Long boTheId
    );

    @Query("""
            select new com.do_an_tot_nghiep.k28.stats.repository.AttemptStatRow(a.nopAt, a.soCauDung, a.tongSoCau)
            from LanLamBai a
            join BaiLuyen b on b.id = a.baiId
            where a.nguoiDungId = :userId
              and a.nopAt >= :batDau
              and a.nopAt < :ketThuc
              and (:boTheId is null or b.boTheId = :boTheId)
            """)
    List<AttemptStatRow> attempts(
            @Param("userId") Long userId,
            @Param("batDau") Instant batDau,
            @Param("ketThuc") Instant ketThuc,
            @Param("boTheId") Long boTheId
    );

    @Query("""
            select new com.do_an_tot_nghiep.k28.stats.repository.SkillCountRow(
                q.loaiCau, b.laLuyenLai, count(r), sum(case when r.dung = true then 1 else 0 end))
            from TraLoiBaiLuyen r
            join LanLamBai a on a.id = r.lanLamId
            join CauHoiBaiLuyen q on q.id = r.cauHoiId
            join BaiLuyen b on b.id = a.baiId
            left join TheTuVung c on c.id = q.theId
            where a.nguoiDungId = :userId
              and (:boTheId is null
                   or c.boTheId = :boTheId
                   or (q.theId is null and b.boTheId = :boTheId))
            group by q.loaiCau, b.laLuyenLai
            """)
    List<SkillCountRow> skillCounts(@Param("userId") Long userId, @Param("boTheId") Long boTheId);

    @Query(value = """
            select x.loai_cau as loaiCau, x.dung as dung, x.thu_tu as thuTu
            from (
                select q.loai_cau,
                       r.dung,
                       row_number() over (order by a.nop_at desc, r.id desc) as thu_tu,
                       row_number() over (partition by q.loai_cau order by a.nop_at desc, r.id desc) as rn
                from tra_loi_bai_luyen r
                join lan_lam_bai a on a.id = r.lan_lam_id
                join cau_hoi_bai_luyen q on q.id = r.cau_hoi_id
                join bai_luyen b on b.id = a.bai_id
                left join the_tu_vung c on c.id = q.the_id
                where a.nguoi_dung_id = :userId
                  and (:boTheId is null
                       or c.bo_the_id = :boTheId
                       or (q.the_id is null and b.bo_the_id = :boTheId))
            ) x
            where x.rn <= :window
            order by x.thu_tu
            """, nativeQuery = true)
    List<SkillAnswerRow> recentAnswers(
            @Param("userId") Long userId,
            @Param("boTheId") Long boTheId,
            @Param("window") int window
    );
}
