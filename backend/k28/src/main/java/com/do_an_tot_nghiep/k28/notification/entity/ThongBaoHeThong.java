package com.do_an_tot_nghiep.k28.notification.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.notification.entity.enums.MucDoThongBao;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Version;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ThongBaoHeThong extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String tieuDe;

    @Column(nullable = false, length = 2000)
    private String noiDung;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private MucDoThongBao mucDo;

    @Column(length = 300)
    private String lienKet;

    @Column(nullable = false)
    private Instant batDauAt;

    private Instant ketThucAt;

    private boolean hienThi;

    @Column(nullable = false)
    private Long nguoiTaoId;

    @Version
    private Long version;

    public static ThongBaoHeThong create(Long nguoiTaoId, String tieuDe, String noiDung, MucDoThongBao mucDo,
                                         String lienKet, Instant batDauAt, Instant ketThucAt, boolean hienThi) {
        ThongBaoHeThong thongBao = new ThongBaoHeThong();
        thongBao.nguoiTaoId = nguoiTaoId;
        thongBao.update(tieuDe, noiDung, mucDo, lienKet, batDauAt, ketThucAt, hienThi);
        return thongBao;
    }

    public void update(String tieuDe, String noiDung, MucDoThongBao mucDo, String lienKet,
                       Instant batDauAt, Instant ketThucAt, boolean hienThi) {
        this.tieuDe = tieuDe;
        this.noiDung = noiDung;
        this.mucDo = mucDo;
        this.lienKet = lienKet;
        this.batDauAt = batDauAt;
        this.ketThucAt = ketThucAt;
        this.hienThi = hienThi;
    }
}
