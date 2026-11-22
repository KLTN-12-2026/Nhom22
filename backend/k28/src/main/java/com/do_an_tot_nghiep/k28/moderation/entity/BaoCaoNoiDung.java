package com.do_an_tot_nghiep.k28.moderation.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.LoaiDoiTuongBaoCao;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.LyDoBaoCao;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.QuyetDinhBaoCao;
import com.do_an_tot_nghiep.k28.moderation.entity.enums.TrangThaiBaoCao;
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
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BaoCaoNoiDung extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Long nguoiBaoCaoId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, updatable = false, length = 20)
    private LoaiDoiTuongBaoCao loaiDoiTuong;

    @Column(nullable = false, updatable = false)
    private Long doiTuongId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, updatable = false, length = 20)
    private LyDoBaoCao lyDo;

    @Column(updatable = false, length = 500)
    private String moTa;

    @Column(nullable = false, updatable = false, columnDefinition = "json")
    private String noiDungJson;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrangThaiBaoCao trangThai;

    private Long nguoiXuLyId;

    @Column(length = 500)
    private String lyDoXuLy;

    private Instant xuLyAt;

    @Version
    private Long version;

    @Builder
    private static BaoCaoNoiDung create(Long nguoiBaoCaoId, LoaiDoiTuongBaoCao loaiDoiTuong, Long doiTuongId,
                                        LyDoBaoCao lyDo, String moTa, String noiDungJson) {
        BaoCaoNoiDung report = new BaoCaoNoiDung();
        report.nguoiBaoCaoId = nguoiBaoCaoId;
        report.loaiDoiTuong = loaiDoiTuong;
        report.doiTuongId = doiTuongId;
        report.lyDo = lyDo;
        report.moTa = moTa;
        report.noiDungJson = noiDungJson;
        report.trangThai = TrangThaiBaoCao.CHO_XU_LY;
        return report;
    }

    public boolean isPending() {
        return trangThai == TrangThaiBaoCao.CHO_XU_LY;
    }

    public void resolve(QuyetDinhBaoCao quyetDinh, Long adminId, String lyDoXuLy, Instant now) {
        this.trangThai = switch (quyetDinh) {
            case GIU -> TrangThaiBaoCao.DA_GIU;
            case AN -> TrangThaiBaoCao.DA_AN;
            case KHOA -> TrangThaiBaoCao.DA_KHOA;
        };
        this.nguoiXuLyId = adminId;
        this.lyDoXuLy = lyDoXuLy;
        this.xuLyAt = now;
    }
}
