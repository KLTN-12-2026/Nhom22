package com.do_an_tot_nghiep.k28.practice.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TraLoiBaiLuyen extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long lanLamId;

    @Column(nullable = false)
    private Long cauHoiId;

    @Column(columnDefinition = "json")
    private String traLoiJson;

    @Column(nullable = false)
    private boolean dung;

    @Column(nullable = false, columnDefinition = "json")
    private String ketQuaJson;

    public static TraLoiBaiLuyen create(
            Long lanLamId,
            Long cauHoiId,
            String traLoiJson,
            boolean dung,
            String ketQuaJson
    ) {
        TraLoiBaiLuyen answer = new TraLoiBaiLuyen();
        answer.lanLamId = lanLamId;
        answer.cauHoiId = cauHoiId;
        answer.traLoiJson = traLoiJson;
        answer.dung = dung;
        answer.ketQuaJson = ketQuaJson;
        return answer;
    }
}
