package com.do_an_tot_nghiep.k28.content.repository;

import com.do_an_tot_nghiep.k28.content.entity.Nhan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NhanRepository extends JpaRepository<Nhan, Long> {

    Page<Nhan> findAllByOrderByTenAscIdAsc(Pageable pageable);

    boolean existsByTen(String ten);

    boolean existsByTenAndIdNot(String ten, Long id);

    @Query(value = """
        SELECT COUNT(*) FROM the_nhan WHERE nhan_id = :id
        """, nativeQuery = true)
    long countReferences(@Param("id") Long id);
}