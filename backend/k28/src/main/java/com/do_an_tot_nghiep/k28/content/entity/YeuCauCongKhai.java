package com.do_an_tot_nghiep.k28.content.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.content.entity.enums.NguoiDuyetCongKhai;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiYeuCauCongKhai;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@NoArgsConstructor(access = lombok.AccessLevel.PROTECTED)
public class YeuCauCongKhai extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long boTheId;

    @Column(nullable = false)
    private Long boNguonId;

    @Column(nullable = false)
    private Long nguoiGuiId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10)
    private NguoiDuyetCongKhai nguoiDuyet;

    private Long nguoiXuLyId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrangThaiYeuCauCongKhai trangThai;

    @Column(length = 500)
    private String loiNhan;

    @Column(length = 500)
    private String lyDo;

    @Column(nullable = false)
    private Instant hetHanAt;

    private Instant xuLyAt;

    @Version
    private Long version;

    public static YeuCauCongKhai create(BoThe copy, Long nguoiGuiId, NguoiDuyetCongKhai nguoiDuyet,
                                        String loiNhan, Instant hetHanAt) {
        YeuCauCongKhai request = new YeuCauCongKhai();
        request.boTheId = copy.getId();
        request.boNguonId = copy.getBoNguonId();
        request.nguoiGuiId = nguoiGuiId;
        request.nguoiDuyet = nguoiDuyet;
        request.trangThai = TrangThaiYeuCauCongKhai.CHO_DUYET;
        request.loiNhan = loiNhan;
        request.hetHanAt = hetHanAt;
        return request;
    }

    public boolean isPending() {
        return trangThai == TrangThaiYeuCauCongKhai.CHO_DUYET;
    }

    public boolean isOverdue(Instant now) {
        return isPending() && !hetHanAt.isAfter(now);
    }

    public void resolve(TrangThaiYeuCauCongKhai trangThai, Long nguoiXuLyId, String lyDo, Instant now) {
        this.trangThai = trangThai;
        this.nguoiXuLyId = nguoiXuLyId;
        this.lyDo = lyDo;
        this.xuLyAt = now;
    }
}
