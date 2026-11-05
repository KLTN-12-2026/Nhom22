package com.do_an_tot_nghiep.k28.practice.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NguonSuKien;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NhomLoi;
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
public class LoiHocTap extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long nguoiDungId;

    @Column(nullable = false)
    private Long theId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private NhomLoi nhomLoi;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 30)
    private NguonSuKien nguonSuKien;

    private Long suKienId;

    @Column(nullable = false, columnDefinition = "json")
    private String bangChungJson;

    public static LoiHocTap create(
            Long nguoiDungId,
            Long theId,
            NhomLoi nhomLoi,
            NguonSuKien nguonSuKien,
            Long suKienId,
            String bangChungJson
    ) {
        LoiHocTap mistake = new LoiHocTap();
        mistake.nguoiDungId = nguoiDungId;
        mistake.theId = theId;
        mistake.nhomLoi = nhomLoi;
        mistake.nguonSuKien = nguonSuKien;
        mistake.suKienId = suKienId;
        mistake.bangChungJson = bangChungJson;
        return mistake;
    }
}
