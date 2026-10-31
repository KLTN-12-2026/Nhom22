package com.do_an_tot_nghiep.k28.learning.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.learning.entity.enums.CheDoPhien;
import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiPhienHoc;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Version;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhienHoc extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long nguoiDungId;

    private Long boTheId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10)
    private ChieuHoc chieuHoc;

    @Column(nullable = false, length = 50)
    private String muiGio;

    @Column(nullable = false)
    private Instant batDauAt;

    private Instant ketThucAt;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrangThaiPhienHoc trangThai;

    @Column(nullable = false)
    private int quyThoiGian;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private CheDoPhien cheDo;

    @Version
    private Long version;

    public static PhienHoc start(
            Long nguoiDungId,
            Long boTheId,
            ChieuHoc chieuHoc,
            String muiGio,
            Instant batDauAt,
            int quyThoiGian,
            CheDoPhien cheDo
    ) {
        PhienHoc session = new PhienHoc();
        session.nguoiDungId = nguoiDungId;
        session.boTheId = boTheId;
        session.chieuHoc = chieuHoc;
        session.muiGio = muiGio;
        session.batDauAt = batDauAt;
        session.trangThai = TrangThaiPhienHoc.DANG_HOC;
        session.quyThoiGian = quyThoiGian;
        session.cheDo = cheDo;
        return session;
    }

    public Instant hetGioAt() {
        return batDauAt.plusSeconds(quyThoiGian * 60L);
    }

    public void finish(Instant now) {
        if (trangThai != TrangThaiPhienHoc.DANG_HOC) {
            return;
        }
        Instant endedAt = now.truncatedTo(ChronoUnit.MILLIS);
        this.trangThai = TrangThaiPhienHoc.KET_THUC;
        this.ketThucAt = endedAt.isBefore(batDauAt) ? batDauAt : endedAt;
    }
}
