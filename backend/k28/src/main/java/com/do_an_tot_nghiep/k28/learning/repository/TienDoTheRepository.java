package com.do_an_tot_nghiep.k28.learning.repository;

import com.do_an_tot_nghiep.k28.learning.entity.TienDoThe;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
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
}
