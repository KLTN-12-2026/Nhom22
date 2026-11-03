package com.do_an_tot_nghiep.k28.practice.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Version;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SoTayTuKho extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long nguoiDungId;

    @Column(nullable = false)
    private Long theId;

    @Column(length = 500)
    private String ghiChu;

    @Column(nullable = false)
    private boolean danhDauThuCong;

    private Instant anTuAt;

    @Version
    private Long version;

    public void update(String ghiChu, Boolean danhDauThuCong) {
        if (ghiChu != null) {
            this.ghiChu = ghiChu.isEmpty() ? null : ghiChu;
        }
        if (danhDauThuCong != null) {
            this.danhDauThuCong = danhDauThuCong;
        }
    }

    public void hide(Instant at) {
        danhDauThuCong = false;
        anTuAt = at;
    }
}
