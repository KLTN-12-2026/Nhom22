package com.do_an_tot_nghiep.k28.content.entity;

import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiKiemDuyet;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class BoThe extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long chuSoHuuId;

    private Long chuDeId;

    @Column(nullable = false, length = 150)
    private String ten;

    @Column(length = 1000)
    private String moTa;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrinhDo trinhDo;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private QuyenTruyCap quyenTruyCap;


    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrangThaiKiemDuyet trangThaiKiemDuyet;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 20)
    private MucTieu mucTieu;

    @Column(nullable = false)
    private boolean boMau;

    private Long boNguonId;

    private Instant xoaAt;

    @Version
    private Long version;

    public static BoThe create(
            Long chuSoHuuId,
            Long chuDeId,
            String ten,
            String moTa,
            TrinhDo trinhDo,
            QuyenTruyCap quyenTruyCap
    ) {
        BoThe deck = new BoThe();
        deck.chuSoHuuId = chuSoHuuId;
        deck.trangThaiKiemDuyet = TrangThaiKiemDuyet.BINH_THUONG;
        deck.updateDetails(
                chuDeId,
                ten,
                moTa,
                trinhDo,
                quyenTruyCap == null
                        ? QuyenTruyCap.RIENG_TU
                        : quyenTruyCap
        );
        return deck;
    }

    public void updateDetails(
            Long chuDeId,
            String ten,
            String moTa,
            TrinhDo trinhDo,
            QuyenTruyCap quyenTruyCap
    ) {
        this.chuDeId = chuDeId;
        this.ten = ten;
        this.moTa = moTa;
        this.trinhDo = trinhDo;
        this.quyenTruyCap = quyenTruyCap;
    }

    public void markDeleted(Instant deletedAt) {
        if (xoaAt == null) {
            xoaAt = deletedAt;
        }
    }

    public void updateGoal(MucTieu mucTieu) {
        this.mucTieu = mucTieu;
    }

    pulic st
}
