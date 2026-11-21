package com.do_an_tot_nghiep.k28.dictionary.entity;

import com.do_an_tot_nghiep.k28.dictionary.entity.enums.ChieuTuDien;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

@Entity
@Immutable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TuDien {

    @Id
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ChieuTuDien chieu;

    @Column(nullable = false, length = 120)
    private String tu;

    @Column(nullable = false, length = 120)
    private String tuChuanHoa;

    @Column(length = 100)
    private String phienAm;

    private String tomTat;

    @Column(nullable = false, columnDefinition = "json")
    private String noiDung;
}
