package com.do_an_tot_nghiep.k28.account.repository;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface NguoiDungRepository extends JpaRepository<NguoiDung, Long> {

    Optional<NguoiDung> findByEmail(String email);

    boolean existsByEmail(String email);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from NguoiDung u where u.id = :id")
    Optional<NguoiDung> findForUpdate(@Param("id") Long id);

    @Query("""
            select u.id as id,
                   u.tenHienThi as tenHienThi
            from NguoiDung u
            where u.id in :ids
            """)
    List<PublicDisplayName> findPublicDisplayName(
            @Param("ids") Collection<Long> ids
    );

    interface PublicDisplayName {
        Long getId();

        String getTenHienThi();
    }
}
