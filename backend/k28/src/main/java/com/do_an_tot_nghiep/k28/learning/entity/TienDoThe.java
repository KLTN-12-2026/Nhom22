package com.do_an_tot_nghiep.k28.learning.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import com.do_an_tot_nghiep.k28.learning.service.SrsState;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Version;

import java.math.BigDecimal;
import java.time.Instant;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TienDoThe extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long nguoiDungId;

    @Column(nullable = false)
    private Long theId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10)
    private ChieuHoc chieuHoc;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrangThaiTienDo trangThai;

    @Column(nullable = false)
    private int buocHoc;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal ef;

    @Column(nullable = false)
    private int khoangOnNgay;

    @Column(nullable = false)
    private int chuoiThanhCong;

    @Column(nullable = false)
    private int soLanQuen;

    private Instant hanOnAt;

    @Version
    private Long version;

    public static TienDoThe create(Long nguoiDungId, Long theId, ChieuHoc chieuHoc) {
        TienDoThe row = new TienDoThe();
        row.nguoiDungId = nguoiDungId;
        row.theId = theId;
        row.chieuHoc = chieuHoc;
        row.apply(SrsState.newCard());

        return row;
    }

    public SrsState toState() {
        return new SrsState(
                trangThai, buocHoc, ef, khoangOnNgay,
                chuoiThanhCong, soLanQuen, hanOnAt
        );
    }

    public void apply(SrsState state) {
        this.trangThai = state.trangThai();
        this.buocHoc = state.buocHoc();
        this.ef = state.ef();
        this.khoangOnNgay = state.khoangOnNgay();
        this.chuoiThanhCong = state.chuoiThanhCong();
        this.soLanQuen = state.soLanQuen();
        this.hanOnAt = state.hanOnAt();
    }

}
