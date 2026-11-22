package com.do_an_tot_nghiep.k28.billing.entity;

import com.do_an_tot_nghiep.k28.billing.entity.enums.MaUuDai;
import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Version;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ChuongTrinhUuDai extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, updatable = false, length = 20)
    private MaUuDai ma;
    @Column(nullable = false, length = 20)
    private String goiMa;
    @Column(nullable = false)
    private int phanTramGiam;
    @Column(nullable = false)
    private int soNgay;
    private Integer soSuatToiDa;
    @Column(length = 1000)
    private String tenMien;
    @Column(nullable = false)
    private boolean hoatDong;

    @Version
    private Long version;

    public void capNhat(String goiMa, int phanTramGiam, int soNgay, Integer soSuatToiDa, String tenMien,
                        boolean hoatDong) {
        this.goiMa = goiMa;
        this.phanTramGiam = phanTramGiam;
        this.soNgay = soNgay;
        this.soSuatToiDa = soSuatToiDa;
        this.tenMien = tenMien;
        this.hoatDong = hoatDong;
    }

    public boolean mienPhi() {
        return phanTramGiam >= 100;
    }

    public List<String> danhSachTenMien() {
        if (tenMien == null || tenMien.isBlank()) {
            return List.of();
        }
        return Arrays.stream(tenMien.split(","))
                .map(item -> item.strip().toLowerCase(Locale.ROOT))
                .filter(item -> !item.isEmpty())
                .toList();
    }

    public boolean chapNhanEmail(String email) {
        String domain = email.substring(email.lastIndexOf('@') + 1).toLowerCase(Locale.ROOT);
        return danhSachTenMien().stream().anyMatch(item -> domain.equals(item) || domain.endsWith("." + item));
    }
}
