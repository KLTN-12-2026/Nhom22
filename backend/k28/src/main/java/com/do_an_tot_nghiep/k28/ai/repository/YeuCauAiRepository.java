package com.do_an_tot_nghiep.k28.ai.repository;

import com.do_an_tot_nghiep.k28.ai.entity.YeuCauAi;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface YeuCauAiRepository extends JpaRepository<YeuCauAi, Long> {

    Optional<YeuCauAi> findByIdAndNguoiDungId(Long id, Long nguoiDungId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select y from YeuCauAi y where y.id = :id")
    Optional<YeuCauAi> findForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select y from YeuCauAi y where y.id = :id and y.nguoiDungId = :userId")
    Optional<YeuCauAi> findOwnedForUpdate(@Param("id") Long id, @Param("userId") Long userId);
}
