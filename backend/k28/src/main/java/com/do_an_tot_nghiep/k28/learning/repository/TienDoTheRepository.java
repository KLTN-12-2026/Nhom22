package com.do_an_tot_nghiep.k28.learning.repository;

import com.do_an_tot_nghiep.k28.learning.entity.TienDoThe;
import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TienDoTheRepository extends JpaRepository<TienDoThe, Long> {

    @Query("""
            select new com.do_an_tot_nghiep.k28.learning.repository.DeckDueRow(
                b.id,
                count(case when t.hanOnAt < :batDau then 1 end),
                count(case when t.hanOnAt >= :batDau then 1 end))
            from TienDoThe t
            join TheTuVung c on c.id = t.theId
            join BoThe b on b.id = c.boTheId
            where t.nguoiDungId = :userId
              and t.trangThai in :trangThais
              and t.hanOnAt < :ketThuc
              and c.xoaAt is null
              and b.xoaAt is null
              and b.chuSoHuuId = :userId
            group by b.id
            """)
    List<DeckDueRow> dueByDeck(
            @Param("userId") Long userId,
            @Param("trangThais") Collection<TrangThaiTienDo> trangThais,
            @Param("batDau") Instant batDau,
            @Param("ketThuc") Instant ketThuc
    );

    @Query("""
            select new com.do_an_tot_nghiep.k28.learning.repository.DeckCardRow(
                b.id,
                b.ten,
                count(distinct c.id),
                count(distinct case when c.id is not null and p.id is null then c.id end))
            from BoThe b
            left join TheTuVung c on c.boTheId = b.id and c.xoaAt is null
            left join TienDoThe p on p.theId = c.id
                and p.nguoiDungId = :userId
                and p.trangThai <> :moi
            where b.chuSoHuuId = :userId
              and b.xoaAt is null
            group by b.id, b.ten
            order by b.ten
            """)
    List<DeckCardRow> deckCards(
            @Param("userId") Long userId,
            @Param("moi") TrangThaiTienDo moi
    );

    @Query("""
            select t
            from TienDoThe t
            join TheTuVung c on c.id = t.theId
            join BoThe b on b.id = c.boTheId
            where t.nguoiDungId = :userId
              and t.chieuHoc = :chieu
              and t.trangThai in :trangThais
              and t.hanOnAt <= :now
              and c.xoaAt is null
              and b.xoaAt is null
              and b.chuSoHuuId = :userId
              and (:boTheId is null or b.id = :boTheId)
            order by t.hanOnAt, t.id
            """)
    List<TienDoThe> dueQueue(
            @Param("userId") Long userId,
            @Param("chieu") ChieuHoc chieu,
            @Param("trangThais") Collection<TrangThaiTienDo> trangThais,
            @Param("now") Instant now,
            @Param("boTheId") Long boTheId,
            Pageable pageable
    );

    @Query("""
            select c.id
            from TheTuVung c
            join BoThe b on b.id = c.boTheId
            where c.xoaAt is null
              and b.xoaAt is null
              and b.chuSoHuuId = :userId
              and (:boTheId is null or b.id = :boTheId)
              and not exists (
                  select 1 from TienDoThe p
                  where p.theId = c.id
                    and p.nguoiDungId = :userId
                    and p.trangThai <> :moi)
            order by b.id, c.id
            """)
    List<Long> physicallyNewCardIds(
            @Param("userId") Long userId,
            @Param("boTheId") Long boTheId,
            @Param("moi") TrangThaiTienDo moi,
            Pageable pageable
    );

    @Query("""
            select c.id
            from TheTuVung c
            join BoThe b on b.id = c.boTheId
            where c.xoaAt is null
              and b.xoaAt is null
              and b.chuSoHuuId = :userId
              and (:boTheId is null or b.id = :boTheId)
              and exists (
                  select 1 from TienDoThe p
                  where p.theId = c.id
                    and p.nguoiDungId = :userId
                    and p.trangThai <> :moi)
              and not exists (
                  select 1 from TienDoThe d
                  where d.theId = c.id
                    and d.nguoiDungId = :userId
                    and d.chieuHoc = :chieu
                    and d.trangThai <> :moi)
            order by b.id, c.id
            """)
    List<Long> otherDirectionCardIds(
            @Param("userId") Long userId,
            @Param("chieu") ChieuHoc chieu,
            @Param("boTheId") Long boTheId,
            @Param("moi") TrangThaiTienDo moi,
            Pageable pageable
    );

    Optional<TienDoThe> findByNguoiDungIdAndTheIdAndChieuHoc(
            Long nguoiDungId, Long theId, ChieuHoc chieuHoc
    );

    boolean existsByNguoiDungIdAndTheIdAndTrangThaiNot(
            Long nguoiDungId, Long theId, TrangThaiTienDo trangThai
    );

    List<TienDoThe> findByNguoiDungIdAndChieuHocAndTheIdIn(Long nguoiDungId, ChieuHoc chieuHoc, Collection<Long> theIds);
}
