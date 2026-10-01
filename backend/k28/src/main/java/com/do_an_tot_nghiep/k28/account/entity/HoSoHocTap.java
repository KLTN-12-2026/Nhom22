package com.do_an_tot_nghiep.k28.account.entity;

import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

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
