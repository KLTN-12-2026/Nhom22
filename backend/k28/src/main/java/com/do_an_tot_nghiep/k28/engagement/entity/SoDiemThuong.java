package com.do_an_tot_nghiep.k28.engagement.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.engagement.entity.enums.LoaiSuKien;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SoDiemThuong extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long nguoiDungId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false)
    private LoaiSuKien loaiSuKien;

    @Column(nullable = false)
    private String suKienId;

    private int diemGoc;

    private int soDiem;

    @Column(nullable = false)
    private LocalDate ngayDiaPhuong;

    public static SoDiemThuong create(
            Long nguoiDungId,
            LoaiSuKien loaiSuKien,
            String suKienId,
            int diemGoc,
            int soDiem,
            LocalDate ngayDiaPhuong
    ) {
        SoDiemThuong entry = new SoDiemThuong();
        entry.nguoiDungId = nguoiDungId;
        entry.loaiSuKien = loaiSuKien;
        entry.suKienId = suKienId;
        entry.diemGoc = diemGoc;
        entry.soDiem = soDiem;
        entry.ngayDiaPhuong = ngayDiaPhuong;
        return entry;
    }
}
