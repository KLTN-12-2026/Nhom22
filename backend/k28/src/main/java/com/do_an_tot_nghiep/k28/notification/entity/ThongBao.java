package com.do_an_tot_nghiep.k28.notification.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.notification.entity.enums.LoaiThongBao;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ThongBao extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long nguoiDungId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false)
    private LoaiThongBao loai;

    @Column(nullable = false)
    private LocalDate ngayDiaPhuong;

    @Column(nullable = false)
    private String tieuDe;

    @Column(nullable = false)
    private String noiDung;

    private String lienKet;

    private boolean hienThi;

    private boolean guiEmail;

    private Instant daDocAt;

    public void markRead(boolean daDoc, Instant now) {
        if (!daDoc) {
            daDocAt = null;
        } else if (daDocAt == null) {
            daDocAt = now;
        }
    }
}
