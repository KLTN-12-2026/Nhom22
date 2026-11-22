package com.do_an_tot_nghiep.k28.billing.entity;

import com.do_an_tot_nghiep.k28.billing.entity.enums.ChuKy;
import com.do_an_tot_nghiep.k28.billing.entity.enums.LoaiGiam;
import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Version;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Entity
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class KhuyenMai extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 30)
    private String ma;
    @Column(nullable = false, length = 100)
    private String ten;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private LoaiGiam loaiGiam;
    @Column(nullable = false)
    private long giaTri;
    @Column(length = 20)
    private String goiMa;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 10)
    private ChuKy chuKy;
    @Column(nullable = false)
    private Instant batDauAt;
    @Column(nullable = false)
    private Instant ketThucAt;
    private Integer tongLuot;
    @Column(nullable = false)
    private int luotMoiNguoi;
    @Column(nullable = false)
    private boolean chiLanDau;
    @Column(nullable = false)
    private boolean hoatDong;

    @Version
    private Long version;

    public void capNhat(KhuyenMai moi) {
        this.ma = moi.ma;
        this.ten = moi.ten;
        this.loaiGiam = moi.loaiGiam;
        this.giaTri = moi.giaTri;
        this.goiMa = moi.goiMa;
        this.chuKy = moi.chuKy;
        this.batDauAt = moi.batDauAt;
        this.ketThucAt = moi.ketThucAt;
        this.tongLuot = moi.tongLuot;
        this.luotMoiNguoi = moi.luotMoiNguoi;
        this.chiLanDau = moi.chiLanDau;
        this.hoatDong = moi.hoatDong;
    }

    public boolean apDungDuoc(String goiMa, ChuKy chuKy, Instant now) {
        return hoatDong && !now.isBefore(batDauAt) && now.isBefore(ketThucAt)
                && (this.goiMa == null || this.goiMa.equals(goiMa))
                && (this.chuKy == null || this.chuKy == chuKy);
    }

    public long soTienGiam(long giaGoc) {
        return loaiGiam == LoaiGiam.PHAN_TRAM ? giaGoc * giaTri / 100 : Math.min(giaTri, giaGoc);
    }
}
