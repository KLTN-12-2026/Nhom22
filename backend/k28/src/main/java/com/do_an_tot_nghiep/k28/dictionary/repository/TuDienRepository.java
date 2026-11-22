package com.do_an_tot_nghiep.k28.dictionary.repository;

import com.do_an_tot_nghiep.k28.dictionary.entity.TuDien;
import com.do_an_tot_nghiep.k28.dictionary.entity.enums.ChieuTuDien;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TuDienRepository extends JpaRepository<TuDien, Long> {

    @Query("""
            select t.id as id, t.tu as tu, t.phienAm as phienAm, t.tomTat as tomTat
            from TuDien t
            where t.chieu = :chieu and t.tuChuanHoa like :prefix escape '\\'
            order by case when t.tu = :raw then 0 when t.tuChuanHoa = :exact then 1 else 2 end,
                     length(t.tu), t.tu
            """)
    List<Headword> suggest(@Param("chieu") ChieuTuDien chieu,
                           @Param("prefix") String prefix,
                           @Param("exact") String exact,
                           @Param("raw") String raw,
                           Pageable pageable);

    @Query("""
            select t from TuDien t
            where t.chieu = :chieu and t.tuChuanHoa = :exact
            order by case when t.tu = :raw then 0 when lower(t.tu) = lower(:raw) then 1 else 2 end, t.tu
            """)
    List<TuDien> lookup(@Param("chieu") ChieuTuDien chieu,
                        @Param("exact") String exact,
                        @Param("raw") String raw,
                        Pageable pageable);

    @Query(value = """
            SELECT id AS id, tu AS tu, phien_am AS phienAm, tom_tat AS tomTat
            FROM tu_dien
            WHERE chieu = 'ANH_VIET'
              AND (tom_tat COLLATE utf8mb4_0900_as_ci LIKE :start ESCAPE '!'
                   OR tom_tat COLLATE utf8mb4_0900_as_ci LIKE :inside ESCAPE '!')
            ORDER BY CASE
                         WHEN tom_tat COLLATE utf8mb4_0900_as_ci IN (:q, CONCAT('sự ', :q)) THEN 0
                         WHEN tom_tat COLLATE utf8mb4_0900_as_ci LIKE :firstComma ESCAPE '!'
                              OR tom_tat COLLATE utf8mb4_0900_as_ci LIKE :firstSemi ESCAPE '!'
                              OR tom_tat COLLATE utf8mb4_0900_as_ci LIKE CONCAT('sự ', :firstComma) ESCAPE '!'
                              OR tom_tat COLLATE utf8mb4_0900_as_ci LIKE CONCAT('sự ', :firstSemi) ESCAPE '!' THEN 1
                         WHEN tom_tat COLLATE utf8mb4_0900_as_ci LIKE :start ESCAPE '!' THEN 2
                         ELSE 3
                     END,
                     phien_am IS NULL,
                     CHAR_LENGTH(tu),
                     tu
            LIMIT :limit
            """, nativeQuery = true)
    List<Headword> byMeaning(@Param("q") String q,
                             @Param("start") String start,
                             @Param("inside") String inside,
                             @Param("firstComma") String firstComma,
                             @Param("firstSemi") String firstSemi,
                             @Param("limit") int limit);

    interface Headword {
        Long getId();

        String getTu();

        String getPhienAm();

        String getTomTat();
    }
}
