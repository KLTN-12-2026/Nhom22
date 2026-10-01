package com.do_an_tot_nghiep.k28.account.repository;

import com.do_an_tot_nghiep.k28.account.entity.DanhTinhOauth;
import com.do_an_tot_nghiep.k28.account.entity.NhaCungCap;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DanhTinhOauthRepository extends JpaRepository<DanhTinhOauth, Long> {

    Optional<DanhTinhOauth> findByNhaCungCapAndSubject(NhaCungCap nhaCungCap, String subject);

    boolean existsByNguoiDungIdAndNhaCungCap(Long nguoiDungId, NhaCungCap nhaCungCap);
}
