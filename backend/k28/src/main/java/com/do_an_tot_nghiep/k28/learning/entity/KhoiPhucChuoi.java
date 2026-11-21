package com.do_an_tot_nghiep.k28.learning.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class KhoiPhucChuoi extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long nguoiDungId;

    @Column(nullable = false)
    private LocalDate ngay;

    @Column(nullable = false)
    private LocalDate thang;

    public static KhoiPhucChuoi of(Long nguoiDungId, LocalDate ngay, LocalDate thang) {
        KhoiPhucChuoi item = new KhoiPhucChuoi();
        item.nguoiDungId = nguoiDungId;
        item.ngay = ngay;
        item.thang = thang;
        return item;
    }
}
