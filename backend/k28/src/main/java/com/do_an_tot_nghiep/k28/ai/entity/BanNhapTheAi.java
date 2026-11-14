package com.do_an_tot_nghiep.k28.ai.entity;

import com.do_an_tot_nghiep.k28.ai.entity.enums.TrangThaiDuyet;
import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
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
public class BanNhapTheAi extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, updatable = false)
    private Long yeuCauId;

    @Column(nullable = false, updatable = false)
    private int thuTu;

    @Column(nullable = false, columnDefinition = "json")
    private String noiDungJson;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrangThaiDuyet trangThaiDuyet;

    private Long theDaLuuId;

    private Long anhId;

    public static BanNhapTheAi moi(Long yeuCauId, int thuTu, String noiDungJson) {
        BanNhapTheAi draft = new BanNhapTheAi();
        draft.yeuCauId = yeuCauId;
        draft.thuTu = thuTu;
        draft.noiDungJson = noiDungJson;
        draft.trangThaiDuyet = TrangThaiDuyet.CHO_DUYET;
        return draft;
    }

    public void suaNoiDung(String noiDungJson) {
        this.noiDungJson = noiDungJson;
    }

    public void daLuu(Long theId) {
        this.trangThaiDuyet = TrangThaiDuyet.DA_LUU;
        this.theDaLuuId = theId;
    }
}
