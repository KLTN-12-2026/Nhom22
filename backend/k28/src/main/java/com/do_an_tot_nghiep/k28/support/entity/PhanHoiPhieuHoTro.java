package com.do_an_tot_nghiep.k28.support.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhanHoiPhieuHoTro extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Long phieuId;

    @Column(nullable = false, updatable = false)
    private Long nguoiXuLyId;

    @Column(nullable = false, updatable = false, length = 2000)
    private String noiDung;

    @Column(nullable = false, updatable = false, length = 200)
    private String hanhDong;

    public static PhanHoiPhieuHoTro of(Long phieuId, Long nguoiXuLyId, String noiDung, String hanhDong) {
        PhanHoiPhieuHoTro phanHoi = new PhanHoiPhieuHoTro();
        phanHoi.phieuId = phieuId;
        phanHoi.nguoiXuLyId = nguoiXuLyId;
        phanHoi.noiDung = noiDung;
        phanHoi.hanhDong = hanhDong;
        return phanHoi;
    }
}
