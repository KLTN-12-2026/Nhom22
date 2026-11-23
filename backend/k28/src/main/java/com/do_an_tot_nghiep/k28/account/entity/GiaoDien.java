package com.do_an_tot_nghiep.k28.account.entity;

import com.do_an_tot_nghiep.k28.account.entity.enums.NhomGiaoDien;
import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GiaoDien extends BaseEntity {

    @Id
    private String ma;

    private String ten;

    private String moTa;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private NhomGiaoDien nhom;

    private String goiToiThieu;

    private boolean coAmThanh;

    private int thuTu;
}
