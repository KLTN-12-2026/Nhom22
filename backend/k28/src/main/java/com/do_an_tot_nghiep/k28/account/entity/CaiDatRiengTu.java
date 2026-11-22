package com.do_an_tot_nghiep.k28.account.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CaiDatRiengTu extends BaseEntity {

    @Id
    private Long nguoiDungId;

    @Column(nullable = false)
    private boolean congKhaiHoatDong;

    @Column(nullable = false)
    private boolean thamGiaXepHang;

    @Version
    private Long version;

    public static CaiDatRiengTu defaultFor(Long nguoiDungId) {
        CaiDatRiengTu settings = new CaiDatRiengTu();
        settings.nguoiDungId = nguoiDungId;
        settings.congKhaiHoatDong = true;
        settings.thamGiaXepHang = true;
        return settings;
    }

    public void update(boolean congKhaiHoatDong, boolean thamGiaXepHang) {
        this.congKhaiHoatDong = congKhaiHoatDong;
        this.thamGiaXepHang = thamGiaXepHang;
    }
}
