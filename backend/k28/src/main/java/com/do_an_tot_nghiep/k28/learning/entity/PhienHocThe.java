package com.do_an_tot_nghiep.k28.learning.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiPhienHocThe;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PhienHocThe extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long phienId;

    @Column(nullable = false)
    private Long theId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 10)
    private ChieuHoc chieuHoc;

    @Column(nullable = false)
    private int thuTu;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrangThaiPhienHocThe trangThai;

    public static PhienHocThe queued(Long phienId, Long theId, ChieuHoc chieuHoc, int thuTu) {
        PhienHocThe item = new PhienHocThe();
        item.phienId = phienId;
        item.theId = theId;
        item.chieuHoc = chieuHoc;
        item.thuTu = thuTu;
        item.trangThai = TrangThaiPhienHocThe.CHUA_TRA_LOI;
        return item;
    }

    public void markAnswered() {
        this.trangThai = TrangThaiPhienHocThe.DA_TRA_LOI;
    }

    public void requeue(int thuTu) {
        this.thuTu = thuTu;
        this.trangThai = TrangThaiPhienHocThe.CHUA_TRA_LOI;
    }
}
