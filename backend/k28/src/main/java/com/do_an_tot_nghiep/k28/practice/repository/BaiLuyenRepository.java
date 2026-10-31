package com.do_an_tot_nghiep.k28.practice.repository;

import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import com.do_an_tot_nghiep.k28.practice.entity.BaiLuyen;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BaiLuyenRepository extends JpaRepository<BaiLuyen, Long> {

    Optional<BaiLuyen> findByIdAndNguoiDungId(Long id, Long nguoiDungId);

    @Query("""
            select c.id
            from TheTuVung c
            join BoThe b on b.id = c.boTheId
            where b.chuSoHuuId = :userId
              and b.xoaAt is null
              and c.xoaAt is null
              and not exists (
                  select 1
                  from TienDoThe t
                  where t.nguoiDungId = :userId
                    and t.theId = c.id
                    and t.trangThai = :tamNgung)
            order by c.id
            """)
    List<Long> usableCardIds(
            @Param("userId") Long userId,
            @Param("tamNgung") TrangThaiTienDo tamNgung
    );

    @Query("""
            select b.ten
            from BoThe b
            where b.id = :id
              and b.chuSoHuuId = :userId
              and b.xoaAt is null
            """)
    Optional<String> ownedDeckName(@Param("userId") Long userId, @Param("id") Long id);

    @Query("select b.ten from BoThe b where b.id = :id")
    Optional<String> deckName(@Param("id") Long id);

    @Query(value = "select s.the_id from so_tay_tu_kho s where s.nguoi_dung_id = :userId order by s.id",
            nativeQuery = true)
    List<Long> notebookCardIds(@Param("userId") Long userId);

    @Query(value = """
            select p.id as id, p.the_1_id as the1Id, p.the_2_id as the2Id
            from cap_tu_de_nham p
            where p.nguoi_dung_id = :userId
            order by p.so_lan_nham desc, p.id
            """, nativeQuery = true)
    List<PairRow> confusingPairs(@Param("userId") Long userId);

    interface PairRow {

        Long getId();

        Long getThe1Id();

        Long getThe2Id();
    }
}
