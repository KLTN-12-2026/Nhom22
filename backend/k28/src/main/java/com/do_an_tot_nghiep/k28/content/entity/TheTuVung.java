package com.do_an_tot_nghiep.k28.content.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Version;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TheTuVung extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long boTheId;

    @Column(nullable = false, length = 100)
    private String tu;

    @Column(length = 30)
    private String tuLoai;

    @Column(nullable = false, length = 500)
    private String nghiaVi;

    @Column(length = 100)
    private String phienAm;

    @Column(length = 300)
    private String viDuEn;

    @Column(length = 300)
    private String dichVi;

    @Column(nullable = false)
    private int doKho;

    @Column(length = 500)
    private String nguon;

    private Instant xoaAt;

    @Version
    private Long version;

    @Builder
    public static TheTuVung create(
            Long boTheId,
            String tu,
            String tuLoai,
            String nghiaVi,
            String phienAm,
            String viDuEn,
            String dichVi,
            int doKho,
            String nguon
    ) {
        TheTuVung card = new TheTuVung();
        card.boTheId = boTheId;
        card.updateDetails(
                tu, tuLoai, nghiaVi, phienAm,
                viDuEn, dichVi, doKho, nguon
        );
        return card;
    }

    public void updateDetails(
            String tu,
            String tuLoai,
            String nghiaVi,
            String phienAm,
            String viDuEn,
            String dichVi,
            int doKho,
            String nguon
    ) {
        this.tu = tu;
        this.tuLoai = tuLoai;
        this.nghiaVi = nghiaVi;
        this.phienAm = phienAm;
        this.viDuEn = viDuEn;
        this.dichVi = dichVi;
        this.doKho = doKho;
        this.nguon = nguon;
    }

    public void markDeleted(Instant deletedAt) {
        if (xoaAt == null) {
            xoaAt = deletedAt;
        }
    }
}