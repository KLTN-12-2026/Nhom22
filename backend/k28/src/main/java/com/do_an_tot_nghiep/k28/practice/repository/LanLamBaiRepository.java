package com.do_an_tot_nghiep.k28.practice.repository;

import com.do_an_tot_nghiep.k28.learning.repository.StudyTimeRow;
import com.do_an_tot_nghiep.k28.practice.entity.LanLamBai;
import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiBai;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LanLamBaiRepository extends JpaRepository<LanLamBai, Long> {

    String HISTORY_FILTER = """
            where a.nguoiDungId = :userId
              and (:loaiBai is null or b.loaiBai = :loaiBai)
              and (:batDau is null or a.nopAt >= :batDau)
              and (:ketThuc is null or a.nopAt < :ketThuc)
            """;

    Optional<LanLamBai> findByNguoiDungIdAndSubmitKey(Long nguoiDungId, String submitKey);

    Optional<LanLamBai> findByBaiId(Long baiId);

    Optional<LanLamBai> findByIdAndNguoiDungId(Long id, Long nguoiDungId);

    @Query(
            value = """
                    select new com.do_an_tot_nghiep.k28.practice.repository.PracticeHistoryRow(
                        a.id, b.id, b.loaiBai, b.nguon, d.ten, a.soCauDung, a.tongSoCau,
                        a.diem, a.thoiGian, a.nopAt, b.laLuyenLai)
                    from LanLamBai a
                    join BaiLuyen b on b.id = a.baiId
                    left join BoThe d on d.id = b.boTheId
                    """ + HISTORY_FILTER + "order by a.nopAt desc, a.id desc",
            countQuery = """
                    select count(a)
                    from LanLamBai a
                    join BaiLuyen b on b.id = a.baiId
                    """ + HISTORY_FILTER
    )
    Page<PracticeHistoryRow> history(
            @Param("userId") Long userId,
            @Param("loaiBai") LoaiBai loaiBai,
            @Param("batDau") Instant batDau,
            @Param("ketThuc") Instant ketThuc,
            Pageable pageable
    );

    @Query("""
            select new com.do_an_tot_nghiep.k28.learning.repository.StudyTimeRow(a.nopAt, a.thoiGian)
            from LanLamBai a
            join BaiLuyen b on b.id = a.baiId
            where a.nguoiDungId = :userId
              and a.nopAt >= :batDau
              and a.nopAt < :ketThuc
              and (:boTheId is null or b.boTheId = :boTheId)
            """)
    List<StudyTimeRow> studyTimes(
            @Param("userId") Long userId,
            @Param("batDau") Instant batDau,
            @Param("ketThuc") Instant ketThuc,
            @Param("boTheId") Long boTheId
    );
}
