package com.do_an_tot_nghiep.k28.account.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LichLeGiaoDien extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String giaoDienMa;

    private LocalDate ngayLe;

    private int soNgayTruoc;

    private int soNgaySau;

    public static LichLeGiaoDien of(String giaoDienMa, LocalDate ngayLe, int soNgayTruoc, int soNgaySau) {
        LichLeGiaoDien lich = new LichLeGiaoDien();
        lich.giaoDienMa = giaoDienMa;
        lich.ngayLe = ngayLe;
        lich.soNgayTruoc = soNgayTruoc;
        lich.soNgaySau = soNgaySau;
        return lich;
    }

    public void update(LocalDate ngayLe, int soNgayTruoc, int soNgaySau) {
        this.ngayLe = ngayLe;
        this.soNgayTruoc = soNgayTruoc;
        this.soNgaySau = soNgaySau;
    }

    public LocalDate moTu() {
        return ngayLe.minusDays(soNgayTruoc);
    }

    public LocalDate denHet() {
        return ngayLe.plusDays(soNgaySau);
    }

    public boolean dangMo(LocalDate homNay) {
        return !homNay.isBefore(moTu()) && !homNay.isAfter(denHet());
    }
}
