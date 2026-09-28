package com.do_an_tot_nghiep.k28.account.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Version;
import java.time.LocalTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CaiDatThongBao extends BaseEntity {

    @Id
    private Long nguoiDungId;

    private boolean nhanTrongUngDung;

    private boolean nhanEmail;

    private boolean nhacHoc;

    private LocalTime gioNhac;

    @Version
    private Long version;

    public static CaiDatThongBao defaultFor(Long nguoiDungId) {
        CaiDatThongBao settings = new CaiDatThongBao();
        settings.nguoiDungId = nguoiDungId;
        settings.nhanTrongUngDung = true;
        settings.nhanEmail = true;
        settings.nhacHoc = true;
        return settings;
    }
}
