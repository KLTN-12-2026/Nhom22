package com.do_an_tot_nghiep.k28.practice.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LanLamBai extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long nguoiDungId;

    @Column(nullable = false)
    private Long baiId;

    @Column(nullable = false, length = 128)
    private String submitKey;

    @Column(nullable = false)
    private int soCauDung;

    @Column(nullable = false)
    private int tongSoCau;

    @Column(nullable = false)
    private int diem;

    @Column(nullable = false)
    private int thoiGian;

    @Column(nullable = false)
    private Instant nopAt;

    public static LanLamBai create(
            Long nguoiDungId,
            Long baiId,
            String submitKey,
            int soCauDung,
            int tongSoCau,
            int diem,
            int thoiGian,
            Instant nopAt
    ) {
        LanLamBai attempt = new LanLamBai();
        attempt.nguoiDungId = nguoiDungId;
        attempt.baiId = baiId;
        attempt.submitKey = submitKey;
        attempt.soCauDung = soCauDung;
        attempt.tongSoCau = tongSoCau;
        attempt.diem = diem;
        attempt.thoiGian = thoiGian;
        attempt.nopAt = nopAt;
        return attempt;
    }
}
