package com.do_an_tot_nghiep.k28.practice.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiBai;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NguonBaiLuyen;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BaiLuyen extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long nguoiDungId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 30)
    private LoaiBai loaiBai;

    private Long boTheId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10)
    private NguonBaiLuyen nguon;

    @Column(nullable = false)
    private int soCauYeuCau;

    @Column(nullable = false)
    private boolean laLuyenLai;

    private Long baiGocId;

    public static BaiLuyen create(
            Long nguoiDungId,
            LoaiBai loaiBai,
            Long boTheId,
            NguonBaiLuyen nguon,
            int soCauYeuCau
    ) {
        BaiLuyen practice = new BaiLuyen();
        practice.nguoiDungId = nguoiDungId;
        practice.loaiBai = loaiBai;
        practice.boTheId = boTheId;
        practice.nguon = nguon;
        practice.soCauYeuCau = soCauYeuCau;
        return practice;
    }
}
