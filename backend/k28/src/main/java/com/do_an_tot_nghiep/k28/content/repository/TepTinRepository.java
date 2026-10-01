package com.do_an_tot_nghiep.k28.content.repository;

import com.do_an_tot_nghiep.k28.content.entity.TepTin;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;
import java.time.Instant;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiXoaTep;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

public interface TepTinRepository extends JpaRepository<TepTin, Long> {

    Optional<TepTin> findByIdAndChuSoHuuId(Long id, Long chuSoHuuId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from TepTin f where f.id = :id and f.chuSoHuuId = :ownerId")
    Optional<TepTin> findOwnedForUpdate(
            @Param("id") Long id,
            @Param("ownerId") Long ownerId
    );

    boolean existsByObjectKeyAndTrangThaiXoa(String objectKey, TrangThaiXoaTep state);

    @Query("select f from TepTin f where f.trangThaiXoa = :state and f.daXoaObjectAt is null order by f.id")
    List<TepTin> awaitingDeletion(@Param("state") TrangThaiXoaTep state, Pageable page);

    @Transactional
    @Modifying
    @Query("update TepTin f set f.daXoaObjectAt = :now, f.updatedAt = :now where f.id = :id and f.trangThaiXoa = :state")
    int recordDeletion(@Param("id") Long id, @Param("state") TrangThaiXoaTep state, @Param("now") Instant now);

    @Transactional
    @Modifying
    @Query("update TepTin f set f.trangThaiXoa = :deleted, f.xoaAt = :now, f.updatedAt = :now where f.hoanTatAt is null and f.createdAt < :cutoff and f.trangThaiXoa = :active")
    int expirePending(@Param("cutoff") Instant cutoff, @Param("now") Instant now,
                      @Param("active") TrangThaiXoaTep active, @Param("deleted") TrangThaiXoaTep deleted);
}
