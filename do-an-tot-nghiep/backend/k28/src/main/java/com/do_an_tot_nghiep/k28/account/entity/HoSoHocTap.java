package com.do_an_tot_nghiep.k28.account.entity;

import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HoSoHocTap extends BaseEntity {

    @Id
    private Long nguoiDungId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private TrinhDo trinhDo;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private MucTieu mucTieu;

    private int phutMoiNgay;

    private int tuMoiMoiNgay;

    private boolean daHoanTatKhoiDau;

    @Version
    private Long version;

    @ElementCollection
    @CollectionTable(
            name = "chu_de_yeu_thich",
            joinColumns = @JoinColumn(name = "nguoi_dung_id")
    )
    @Column(name = "chu_de_id", nullable = false)
    private Set<Long> chuDeIds = new LinkedHashSet<>();

    public void replaceTopics(Collection<Long> topicIds) {
        if (!chuDeIds.equals(new LinkedHashSet<>(topicIds))) {
            chuDeIds.clear();
            chuDeIds.addAll(topicIds);
        }
    }

    public static HoSoHocTap defaultFor(Long nguoiDungId) {
        HoSoHocTap profile = new HoSoHocTap();
        profile.nguoiDungId = nguoiDungId;
        profile.phutMoiNgay = 10;
        profile.tuMoiMoiNgay = 10;
        return profile;
    }

    public void updateLearning(TrinhDo trinhDo, MucTieu mucTieu, int phutMoiNgay, int tuMoiMoiNgay) {
        this.trinhDo = trinhDo;
        this.mucTieu = mucTieu;
        this.phutMoiNgay = phutMoiNgay;
        this.tuMoiMoiNgay = tuMoiMoiNgay;
        this.daHoanTatKhoiDau = true;
    }
}
