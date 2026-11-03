package com.do_an_tot_nghiep.k28.content.repository;

import com.do_an_tot_nghiep.k28.content.entity.ChuDe;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ChuDeRepository extends JpaRepository<ChuDe, Long> {

    Page<ChuDe> findAllByOrderByTenAscIdAsc(Pageable pageable);

    boolean existsByTen(String ten);

    boolean existsByTenAndIdNot(String ten, Long id);

    @Query(value = """
        SELECT
            (SELECT COUNT(*) FROM bo_the WHERE chu_de_id = :id)
            + (SELECT COUNT(*) FROM chu_de_yeu_thich WHERE chu_de_id = :id)
        """, nativeQuery = true)
    long countReferences(@Param("id") Long id);
}