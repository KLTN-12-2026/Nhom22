package com.do_an_tot_nghiep.k28.account.repository;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface NguoiDungRepository extends JpaRepository<NguoiDung, Long> {

    Optional<NguoiDung> findByEmail(String email);

    boolean existsByEmail(String email);

    @Modifying(flushAutomatically = true)
    @Query("update NguoiDung u set u.dangNhapCuoiAt = :at where u.id = :id")
    int recordLogin(@Param("id") Long id, @Param("at") Instant at);

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

    @Query("""
            select u
            from NguoiDung u
            where u.email <> :systemEmail
              and (:pattern is null
                   or lower(u.email) like lower(:pattern) escape '!'
                   or lower(u.tenHienThi) like lower(:pattern) escape '!')
              and (:trangThai is null or u.trangThai = :trangThai)
              and (:vaiTro is null or exists (
                    select 1 from NguoiDung x join x.vaiTro r
                    where x.id = u.id and r.ma = :vaiTro))
            order by u.createdAt desc, u.id desc
            """)
    Page<NguoiDung> adminPage(
            @Param("systemEmail") String systemEmail,
            @Param("pattern") String pattern,
            @Param("trangThai") TrangThaiNguoiDung trangThai,
            @Param("vaiTro") String vaiTro,
            Pageable pageable
    );

    @Query("""
            select count(u)
            from NguoiDung u join u.vaiTro r
            where r.ma = :vaiTro and u.trangThai = :trangThai
            """)
    long countByRoleAndStatus(
            @Param("vaiTro") String vaiTro,
            @Param("trangThai") TrangThaiNguoiDung trangThai
    );

    interface PublicDisplayName {
        Long getId();

        String getTenHienThi();
    }
}
