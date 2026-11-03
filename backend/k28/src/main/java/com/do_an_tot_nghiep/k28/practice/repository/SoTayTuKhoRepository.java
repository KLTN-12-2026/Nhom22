package com.do_an_tot_nghiep.k28.practice.repository;

import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import com.do_an_tot_nghiep.k28.practice.entity.SoTayTuKho;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SoTayTuKhoRepository extends JpaRepository<SoTayTuKho, Long> {

    List<SoTayTuKho> findByNguoiDungId(Long nguoiDungId);

    Optional<SoTayTuKho> findByNguoiDungIdAndTheId(Long nguoiDungId, Long theId);

    @Modifying
    @Query(value = """
            insert into so_tay_tu_kho
                (nguoi_dung_id, the_id, danh_dau_thu_cong, version, created_at, updated_at)
            values (:userId, :theId, false, 0, :at, :at)
            on duplicate key update id = id
            """, nativeQuery = true)
    void insertIfAbsent(@Param("userId") Long userId, @Param("theId") Long theId, @Param("at") Instant at);

    @Query("""
            select new com.do_an_tot_nghiep.k28.practice.repository.MistakeStatRow(
                l.theId, l.nhomLoi, count(l), max(l.createdAt))
            from LoiHocTap l
            where l.nguoiDungId = :userId
              and not exists (
                  select 1
                  from SoTayTuKho s
                  where s.nguoiDungId = l.nguoiDungId
                    and s.theId = l.theId
                    and s.anTuAt >= l.createdAt)
            group by l.theId, l.nhomLoi
            """)
    List<MistakeStatRow> mistakeStats(@Param("userId") Long userId);

    @Query("""
            select new com.do_an_tot_nghiep.k28.practice.repository.LapseStatRow(
                t.theId, count(h), max(h.createdAt))
            from LichSuOn h
            join TienDoThe t on t.id = h.tienDoId
            where h.nguoiDungId = :userId
              and h.createdAt >= :since
              and h.danhGia = :quen
              and function('json_unquote', function('json_extract', h.truocJson, '$.trangThai')) = :onTap
              and not exists (
                  select 1
                  from SoTayTuKho s
                  where s.nguoiDungId = h.nguoiDungId
                    and s.theId = t.theId
                    and s.anTuAt >= h.createdAt)
            group by t.theId
            """)
    List<LapseStatRow> lapseStats(
            @Param("userId") Long userId,
            @Param("since") Instant since,
            @Param("quen") DanhGia quen,
            @Param("onTap") String onTap
    );

    @Query(value = """
            select x.the_id
            from (
                select c.the_id,
                       case when json_unquote(json_extract(r.ket_qua_json, '$.nhomLoi')) = 'CHINH_TA'
                            then 1 else 0 end as chinh_ta,
                       row_number() over (partition by c.the_id order by a.nop_at desc, r.id desc) as rn
                from tra_loi_bai_luyen r
                join lan_lam_bai a on a.id = r.lan_lam_id
                join cau_hoi_bai_luyen c on c.id = r.cau_hoi_id
                left join so_tay_tu_kho s on s.nguoi_dung_id = a.nguoi_dung_id and s.the_id = c.the_id
                where a.nguoi_dung_id = :userId
                  and c.the_id is not null
                  and r.tra_loi_json is not null
                  and c.loai_cau in ('NHAP_TU_THEO_NGHIA', 'NGHE_VIET', 'DIEN_CHO_TRONG')
                  and (s.an_tu_at is null or a.nop_at > s.an_tu_at)
            ) x
            where x.rn <= :window
            group by x.the_id
            having sum(x.chinh_ta) >= :threshold
            """, nativeQuery = true)
    List<Long> spellingCardIds(
            @Param("userId") Long userId,
            @Param("window") int window,
            @Param("threshold") int threshold
    );

    @Query(value = """
            select x.id
            from (
                select l.id,
                       row_number() over (partition by l.the_id order by l.created_at desc, l.id desc) as rn
                from loi_hoc_tap l
                left join so_tay_tu_kho s on s.nguoi_dung_id = l.nguoi_dung_id and s.the_id = l.the_id
                where l.nguoi_dung_id = :userId
                  and l.the_id in (:ids)
                  and (s.an_tu_at is null or l.created_at > s.an_tu_at)
            ) x
            where x.rn <= :limit
            """, nativeQuery = true)
    List<Long> evidenceIds(
            @Param("userId") Long userId,
            @Param("ids") Collection<Long> ids,
            @Param("limit") int limit
    );

    @Query("""
            select new com.do_an_tot_nghiep.k28.practice.repository.NotebookCardRow(
                c.id, c.tu, c.tuLoai, c.phienAm, c.nghiaVi, c.viDuEn, b.id, b.ten)
            from TheTuVung c
            join BoThe b on b.id = c.boTheId
            where b.chuSoHuuId = :userId
              and b.xoaAt is null
              and c.xoaAt is null
              and c.id in :ids
            """)
    List<NotebookCardRow> cards(@Param("userId") Long userId, @Param("ids") Collection<Long> ids);

    @Query("""
            select distinct t.theId
            from TienDoThe t
            where t.nguoiDungId = :userId
              and t.theId in :ids
              and t.trangThai = :tamNgung
            """)
    List<Long> suspendedCardIds(
            @Param("userId") Long userId,
            @Param("ids") Collection<Long> ids,
            @Param("tamNgung") TrangThaiTienDo tamNgung
    );

    @Query(value = """
            select p.id as id,
                   p.the_1_id as the1Id,
                   p.the_2_id as the2Id,
                   p.so_lan_nham as soLanNham,
                   p.lan_cuoi_at as lanCuoiAt
            from cap_tu_de_nham p
            where p.nguoi_dung_id = :userId
              and p.so_lan_nham > 0
            order by p.so_lan_nham desc, p.lan_cuoi_at desc, p.id
            """, nativeQuery = true)
    List<PairStatRow> pairStats(@Param("userId") Long userId);

    interface PairStatRow {

        Long getId();

        Long getThe1Id();

        Long getThe2Id();

        Integer getSoLanNham();

        Instant getLanCuoiAt();
    }
}
