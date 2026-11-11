package com.do_an_tot_nghiep.k28.engagement.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Version;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TienDoThuThach extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long nguoiDungId;

    @Column(nullable = false)
    private Long thuThachId;

    @Column(nullable = false)
    private LocalDate tuanBatDau;

    private int giaTri;

    private Instant hoanThanhAt;

    @Version
    private Long version;

    public static TienDoThuThach create(Long nguoiDungId, Long thuThachId, LocalDate tuanBatDau) {
        TienDoThuThach row = new TienDoThuThach();
        row.nguoiDungId = nguoiDungId;
        row.thuThachId = thuThachId;
        row.tuanBatDau = tuanBatDau;
        return row;
    }

    public void add(int soLuong, int mucTieu, Instant now) {
        this.giaTri += soLuong;
        if (this.hoanThanhAt == null && this.giaTri >= mucTieu) {
            this.hoanThanhAt = now;
        }
    }
}
