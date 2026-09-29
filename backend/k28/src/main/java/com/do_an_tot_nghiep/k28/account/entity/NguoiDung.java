package com.do_an_tot_nghiep.k28.account.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NguoiDung extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String email;

    private String tenHienThi;

    private Long anhDaiDienId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private TrangThaiNguoiDung trangThai;

    private String passwordHash;

    private String muiGio;

    private Instant emailXacThucAt;

    private Instant dangNhapCuoiAt;

    @Version
    private Long version;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "nguoi_dung_vai_tro",
            joinColumns = @JoinColumn(name = "nguoi_dung_id"),
            inverseJoinColumns = @JoinColumn(name = "vai_tro_id")
    )
    private Set<VaiTro> vaiTro = new HashSet<>();

    public static NguoiDung register(String email, String tenHienThi, String passwordHash,
                                     String muiGio, VaiTro defaultRole) {
        NguoiDung user = new NguoiDung();
        user.email = email;
        user.tenHienThi = tenHienThi;
        user.passwordHash = passwordHash;
        user.muiGio = muiGio;
        user.trangThai = TrangThaiNguoiDung.CHUA_XAC_THUC;
        user.vaiTro.add(defaultRole);
        return user;
    }

    public boolean isUnverified() {
        return trangThai == TrangThaiNguoiDung.CHUA_XAC_THUC;
    }

    public void verifyEmail(Instant now) {
        if (isUnverified()) {
            trangThai = TrangThaiNguoiDung.HOAT_DONG;
            emailXacThucAt = now;
        }
    }

    public void recordLogin(Instant now) {
        dangNhapCuoiAt = now;
    }
}
