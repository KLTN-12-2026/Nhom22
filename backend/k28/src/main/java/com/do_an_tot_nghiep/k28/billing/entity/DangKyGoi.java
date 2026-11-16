package com.do_an_tot_nghiep.k28.billing.entity;

import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiDangKy;
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
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DangKyGoi extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Long nguoiDungId;
    @Column(nullable = false, length = 20)
    private String goiMa;
    @Column(nullable = false)
    private Instant batDauAt;
    @Column(nullable = false)
    private Instant hetHanAt;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrangThaiDangKy trangThai;

    @Version
    private Long version;

    public static DangKyGoi moi(Long nguoiDungId, String goiMa, Instant batDauAt, Instant hetHanAt) {
        DangKyGoi dangKy = new DangKyGoi();
        dangKy.nguoiDungId = nguoiDungId;
        dangKy.goiMa = goiMa;
        dangKy.batDauAt = batDauAt;
        dangKy.hetHanAt = hetHanAt;
        dangKy.trangThai = TrangThaiDangKy.HIEU_LUC;
        return dangKy;
    }

    public boolean hieuLucLuc(Instant now) {
        return trangThai == TrangThaiDangKy.HIEU_LUC && hetHanAt.isAfter(now);
    }

    public void giaHan(Instant hetHanMoi) {
        this.hetHanAt = hetHanMoi;
    }

    public void doiHetHan(Instant hetHanMoi) {
        this.hetHanAt = hetHanMoi;
    }

    public void hetHan() {
        this.trangThai = TrangThaiDangKy.HET_HAN;
    }
}
