package com.do_an_tot_nghiep.k28.billing.entity;

import com.do_an_tot_nghiep.k28.billing.entity.enums.ChuKy;
import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GoiDichVu extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false, length = 20)
    private String ma;
    @Column(nullable = false, length = 50)
    private String ten;
    @Column(nullable = false)
    private long giaThang;
    @Column(nullable = false)
    private long giaNam;
    private Integer gioiHanThe;
    @Column(nullable = false)
    private boolean phatAm;
    @Column(nullable = false)
    private boolean thongKeNangCao;
    @Column(nullable = false)
    private boolean hoatDong;

    @Version
    private Long version;

    public void capNhat(String ten, long giaThang, long giaNam, Integer gioiHanThe, boolean phatAm,
                        boolean thongKeNangCao, boolean hoatDong) {
        this.ten = ten;
        this.giaThang = giaThang;
        this.giaNam = giaNam;
        this.gioiHanThe = gioiHanThe;
        this.phatAm = phatAm;
        this.thongKeNangCao = thongKeNangCao;
        this.hoatDong = hoatDong;
    }

    public long gia(ChuKy chuKy) {
        return chuKy == ChuKy.NAM ? giaNam : giaThang;
    }
}
