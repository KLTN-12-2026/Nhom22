package com.do_an_tot_nghiep.k28.content.repository;

import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import org.springframework.data.jpa.repository.Modifying;

public interface TheTuVungRepository
        extends JpaRepository<TheTuVung, Long> {

    Page<TheTuVung> findByBoTheIdAndXoaAtIsNullOrderByIdDesc(
            Long boTheId,
            Pageable pageable
    );

    Optional<TheTuVung> findByIdAndXoaAtIsNull(Long id);

    @Query("""
            select c.id as id,
                   c.tu as tu,
                   c.tuLoai as tuLoai
            from TheTuVung c
            where c.boTheId = :deckId
              and c.xoaAt is null
            order by c.id
            """)
    List<DuplicateCandidate> findDuplicateCandidates(
            @Param("deckId") Long deckId
    );

    interface DuplicateCandidate {

        Long getId();

        String getTu();

        String getTuLoai();
    }

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
        update TheTuVung c
        set c.version = c.version + 1,
            c.updatedAt = :now
        where c.id = :id
          and c.version = :expectedVersion
          and c.xoaAt is null
        """)
    int touchVersion(
            @Param("id") Long id,
            @Param("expectedVersion") Long expectedVersion,
            @Param("now") Instant now
    );
}