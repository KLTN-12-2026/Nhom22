package com.do_an_tot_nghiep.k28.privacy.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.privacy.entity.enums.TrangThaiYeuCauXoa;
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
public class YeuCauXoaDuLieu extends BaseEntity {

    public static final String PHAM_VI_TAI_KHOAN = "TAI_KHOAN";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Long nguoiDungId;
    @Column(nullable = false, updatable = false, length = 20)
    private String phamVi;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrangThaiYeuCauXoa trangThai;
    @Column(columnDefinition = "json")
    private String ketQuaJson;
    @Column(length = 50)
    private String maLoi;
    @Column(nullable = false, updatable = false)
    private Instant yeuCauAt;
    private Instant hoanTatAt;

    @Version
    private Long version;

    public static YeuCauXoaDuLieu moi(Long nguoiDungId, Instant now) {
        YeuCauXoaDuLieu yeuCau = new YeuCauXoaDuLieu();
        yeuCau.nguoiDungId = nguoiDungId;
        yeuCau.phamVi = PHAM_VI_TAI_KHOAN;
        yeuCau.trangThai = TrangThaiYeuCauXoa.CHO_XU_LY;
        yeuCau.yeuCauAt = now;
        return yeuCau;
    }

    public boolean daKetThuc() {
        return trangThai == TrangThaiYeuCauXoa.HOAN_TAT;
    }

    public void batDau() {
        this.trangThai = TrangThaiYeuCauXoa.DANG_XU_LY;
        this.maLoi = null;
    }

    public void hoanTat(String ketQuaJson, Instant now) {
        this.trangThai = TrangThaiYeuCauXoa.HOAN_TAT;
        this.ketQuaJson = ketQuaJson;
        this.hoanTatAt = now;
    }

    public void loi(String maLoi) {
        this.trangThai = TrangThaiYeuCauXoa.LOI;
        this.maLoi = maLoi;
    }
}
