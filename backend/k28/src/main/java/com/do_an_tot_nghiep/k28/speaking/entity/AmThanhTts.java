package com.do_an_tot_nghiep.k28.speaking.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class AmThanhTts extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false, length = 64)
    private String khoaCache;
    @Column(nullable = false, updatable = false)
    private Long tepTinId;
    @Column(nullable = false, length = 30)
    private String nhaCungCap;
    @Column(nullable = false, length = 60)
    private String model;
    @Column(nullable = false, length = 30)
    private String giong;
    @Column(nullable = false, length = 10)
    private String ngonNgu;
    @Column(nullable = false, length = 30)
    private String phienBan;
    @Column(nullable = false)
    private int doDaiVanBan;
    @Column(nullable = false)
    private int thoiLuongMs;
    @Column(nullable = false)
    private boolean moPhong;
}
