package com.do_an_tot_nghiep.k28.account.repository;

import com.do_an_tot_nghiep.k28.account.entity.LoaiToken;
import com.do_an_tot_nghiep.k28.account.entity.TokenTaiKhoan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Optional;

public interface TokenTaiKhoanRepository extends JpaRepository<TokenTaiKhoan, Long> {

    Optional<TokenTaiKhoan> findByTokenHashAndLoai(String tokenHash, LoaiToken loai);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update TokenTaiKhoan t set t.daDungAt = :now
            where t.id = :id and t.daDungAt is null and t.hetHanAt > :now
            """)
    int markUsed(@Param("id") Long id, @Param("now") Instant now);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update TokenTaiKhoan t set t.daDungAt = :now
            where t.nguoiDungId = :userId and t.loai = :loai and t.daDungAt is null
            """)
    int revokeActive(@Param("userId") Long userId, @Param("loai") LoaiToken loai, @Param("now") Instant now);
}
