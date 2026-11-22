package com.do_an_tot_nghiep.k28.engagement.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.engagement.entity.enums.ChuKyThuThach;
import com.do_an_tot_nghiep.k28.engagement.entity.enums.LoaiDieuKienThuThach;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ThuThach extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ma;

    @Column(nullable = false)
    private String ten;

    @Column(nullable = false)
    private String moTa;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false)
    private LoaiDieuKienThuThach loaiDieuKien;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false)
    private ChuKyThuThach chuKy;

    private int mucTieu;

    private boolean hoatDong;

    @Version
    private Long version;

    public static ThuThach create(String ma, String ten, String moTa, LoaiDieuKienThuThach loaiDieuKien, ChuKyThuThach chuKy, int mucTieu, boolean hoatDong) {
        ThuThach row = new ThuThach();
        row.ma = ma;
        row.update(ten, moTa, loaiDieuKien, chuKy, mucTieu, hoatDong);
        return row;
    }

    public void update(String ten, String moTa, LoaiDieuKienThuThach loaiDieuKien, ChuKyThuThach chuKy, int mucTieu, boolean hoatDong) {
        this.ten = ten;
        this.moTa = moTa;
        this.loaiDieuKien = loaiDieuKien;
        this.chuKy = chuKy;
        this.mucTieu = mucTieu;
        this.hoatDong = hoatDong;
    }
}
