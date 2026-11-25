package com.do_an_tot_nghiep.k28.support.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.support.entity.enums.DoUuTien;
import com.do_an_tot_nghiep.k28.support.entity.enums.LoaiVanDe;
import com.do_an_tot_nghiep.k28.support.entity.enums.TrangThaiPhieu;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhieuHoTro extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Long nguoiDungId;

    @Column(nullable = false, length = 150)
    private String tieuDe;

    @Column(nullable = false, length = 5000)
    private String moTa;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private LoaiVanDe loaiVanDe;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private DoUuTien doUuTien;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrangThaiPhieu trangThai;

    @Version
    private Long version;

    @Builder
    private static PhieuHoTro create(Long nguoiDungId, String tieuDe, String moTa,
                                     LoaiVanDe loaiVanDe, DoUuTien doUuTien) {
        PhieuHoTro phieu = new PhieuHoTro();
        phieu.nguoiDungId = nguoiDungId;
        phieu.tieuDe = tieuDe;
        phieu.moTa = moTa;
        phieu.loaiVanDe = loaiVanDe;
        phieu.doUuTien = doUuTien;
        phieu.trangThai = TrangThaiPhieu.DANG_MO;
        return phieu;
    }

    public void handle(TrangThaiPhieu trangThai, DoUuTien doUuTien) {
        this.trangThai = trangThai;
        this.doUuTien = doUuTien;
    }
}
