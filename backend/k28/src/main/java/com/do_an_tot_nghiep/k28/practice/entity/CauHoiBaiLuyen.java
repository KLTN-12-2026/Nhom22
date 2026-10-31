package com.do_an_tot_nghiep.k28.practice.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiCau;
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
public class CauHoiBaiLuyen extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long baiId;

    @Column(nullable = false)
    private int thuTu;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 30)
    private LoaiCau loaiCau;

    private Long theId;

    @Column(nullable = false, columnDefinition = "json")
    private String deBaiJson;

    @Column(columnDefinition = "json")
    private String phuongAnJson;

    @Column(nullable = false, columnDefinition = "json")
    private String dapAnJson;

    @Column(nullable = false, columnDefinition = "json")
    private String giaiThichJson;

    public static CauHoiBaiLuyen create(
            Long baiId,
            int thuTu,
            LoaiCau loaiCau,
            Long theId,
            String deBaiJson,
            String phuongAnJson,
            String dapAnJson,
            String giaiThichJson
    ) {
        CauHoiBaiLuyen question = new CauHoiBaiLuyen();
        question.baiId = baiId;
        question.thuTu = thuTu;
        question.loaiCau = loaiCau;
        question.theId = theId;
        question.deBaiJson = deBaiJson;
        question.phuongAnJson = phuongAnJson;
        question.dapAnJson = dapAnJson;
        question.giaiThichJson = giaiThichJson;
        return question;
    }
}
