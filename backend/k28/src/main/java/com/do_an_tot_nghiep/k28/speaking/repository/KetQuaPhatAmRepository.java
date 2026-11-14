package com.do_an_tot_nghiep.k28.speaking.repository;

import com.do_an_tot_nghiep.k28.speaking.entity.KetQuaPhatAm;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface KetQuaPhatAmRepository extends JpaRepository<KetQuaPhatAm, Long> {

    Optional<KetQuaPhatAm> findByIdAndNguoiDungId(Long id, Long nguoiDungId);

    Optional<KetQuaPhatAm> findFirstByNguoiDungIdAndTheIdAndIdLessThanOrderByIdDesc(
            Long nguoiDungId, Long theId, Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<KetQuaPhatAm> findByNguoiDungIdAndTepGhiAmId(Long nguoiDungId, Long tepGhiAmId);

    @Query(value = """
            select k
            from KetQuaPhatAm k
            where k.nguoiDungId = :userId
              and (:theId is null or k.theId = :theId)
            order by k.id desc
            """, countQuery = """
            select count(k)
            from KetQuaPhatAm k
            where k.nguoiDungId = :userId
              and (:theId is null or k.theId = :theId)
            """)
    Page<KetQuaPhatAm> history(@Param("userId") Long userId, @Param("theId") Long theId, Pageable pageable);
}
