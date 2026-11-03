package com.do_an_tot_nghiep.k28.admin.entity;

import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@Immutable
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NhatKyQuanTri {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long nguoiThucHienId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 30)
    private HanhDongQuanTri hanhDong;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private LoaiDoiTuong loaiDoiTuong;

    @Column(nullable = false)
    private Long doiTuongId;

    @Column(nullable = false, length = 255)
    private String tenDoiTuong;

    @Column(length = 500)
    private String lyDo;

    @Column(columnDefinition = "json")
    private String truocJson;

    @Column(columnDefinition = "json")
    private String sauJson;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Builder
    private NhatKyQuanTri(Long nguoiThucHienId, HanhDongQuanTri hanhDong, LoaiDoiTuong loaiDoiTuong,
                          Long doiTuongId, String tenDoiTuong, String lyDo, String truocJson,
                          String sauJson, Instant createdAt) {
        this.nguoiThucHienId = nguoiThucHienId;
        this.hanhDong = hanhDong;
        this.loaiDoiTuong = loaiDoiTuong;
        this.doiTuongId = doiTuongId;
        this.tenDoiTuong = tenDoiTuong.length() > 255 ? tenDoiTuong.substring(0, 255) : tenDoiTuong;
        this.lyDo = lyDo;
        this.truocJson = truocJson;
        this.sauJson = sauJson;
        this.createdAt = createdAt.truncatedTo(ChronoUnit.MILLIS);
    }
}
