package com.do_an_tot_nghiep.k28.billing.entity;

import com.do_an_tot_nghiep.k28.billing.entity.enums.ChuKy;
import com.do_an_tot_nghiep.k28.billing.entity.enums.CongThanhToan;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich;
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
public class GiaoDichThanhToan extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false, length = 30)
    private String maDon;
    @Column(nullable = false, updatable = false)
    private Long nguoiDungId;
    @Column(nullable = false, updatable = false, length = 20)
    private String goiMa;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, updatable = false, length = 10)
    private ChuKy chuKy;
    @Column(nullable = false, updatable = false)
    private long soTien;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, updatable = false, length = 20)
    private CongThanhToan cong;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrangThaiGiaoDich trangThai;
    @Column(length = 50)
    private String maGiaoDichCong;
    @Column(length = 10)
    private String maPhanHoi;
    @Column(columnDefinition = "json")
    private String duLieuCongJson;
    @Column(nullable = false, updatable = false)
    private Instant taoAt;
    private Instant hoanTatAt;

    @Version
    private Long version;

    public void ketThuc(TrangThaiGiaoDich ketQua, String maGiaoDichCong, String maPhanHoi,
                        String duLieuCongJson, Instant now) {
        this.trangThai = ketQua;
        this.maGiaoDichCong = maGiaoDichCong;
        this.maPhanHoi = maPhanHoi;
        this.duLieuCongJson = duLieuCongJson;
        this.hoanTatAt = ketQua == TrangThaiGiaoDich.HET_HAN ? null : now;
    }
}
