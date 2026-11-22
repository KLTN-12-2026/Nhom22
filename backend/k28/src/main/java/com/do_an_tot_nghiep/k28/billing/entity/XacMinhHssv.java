package com.do_an_tot_nghiep.k28.billing.entity;

import com.do_an_tot_nghiep.k28.billing.entity.enums.PhuongThucXacMinh;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiXacMinh;
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
public class XacMinhHssv extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Long nguoiDungId;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, updatable = false, length = 20)
    private PhuongThucXacMinh phuongThuc;
    @Column(updatable = false)
    private Long tepTheId;
    @Column(length = 150)
    private String tenTruong;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrangThaiXacMinh trangThai;
    @Column(length = 500)
    private String lyDoTuChoi;
    private Long duyetBoi;
    private Instant duyetAt;
    private Instant hetHanAt;
    private Instant daNhanUuDaiAt;

    @Version
    private Long version;

    public static XacMinhHssv moi(Long nguoiDungId, PhuongThucXacMinh phuongThuc, Long tepTheId, String tenTruong) {
        XacMinhHssv xacMinh = new XacMinhHssv();
        xacMinh.nguoiDungId = nguoiDungId;
        xacMinh.phuongThuc = phuongThuc;
        xacMinh.tepTheId = tepTheId;
        xacMinh.tenTruong = tenTruong;
        xacMinh.trangThai = TrangThaiXacMinh.CHO_DUYET;
        return xacMinh;
    }

    public void duyet(Long duyetBoi, Instant now, Instant hetHanAt) {
        this.trangThai = TrangThaiXacMinh.DA_DUYET;
        this.duyetBoi = duyetBoi;
        this.duyetAt = now;
        this.hetHanAt = hetHanAt;
        this.lyDoTuChoi = null;
    }

    public void tuChoi(Long duyetBoi, Instant now, String lyDo) {
        this.trangThai = TrangThaiXacMinh.TU_CHOI;
        this.duyetBoi = duyetBoi;
        this.duyetAt = now;
        this.lyDoTuChoi = lyDo;
    }

    public boolean conHieuLuc(Instant now) {
        return trangThai == TrangThaiXacMinh.DA_DUYET && hetHanAt != null && hetHanAt.isAfter(now);
    }

    public void nhanUuDai(Instant now) {
        this.daNhanUuDaiAt = now;
    }
}
