package com.do_an_tot_nghiep.k28.speaking.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.speaking.entity.enums.TrangThaiPhatAm;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Entity
@Builder
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class KetQuaPhatAm extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Long nguoiDungId;
    @Column(nullable = false, updatable = false)
    private Long theId;
    private Long tepGhiAmId;
    @Column(nullable = false, updatable = false, length = 100)
    private String vanBanMau;
    @Column(nullable = false, updatable = false, length = 10)
    private String ngonNgu;
    @Column(nullable = false, updatable = false, length = 30)
    private String nhaCungCap;
    @Column(nullable = false, updatable = false)
    private boolean moPhong;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, updatable = false, length = 20)
    private TrangThaiPhatAm trangThai;
    @Column(nullable = false, updatable = false, columnDefinition = "json")
    private String chiSoJson;
    @Column(nullable = false, updatable = false)
    private int thoiLuongGhiMs;
    @Column(nullable = false, updatable = false)
    private int thoiGianXuLyMs;

    public void xoaGhiAm() {
        this.tepGhiAmId = null;
    }
}
