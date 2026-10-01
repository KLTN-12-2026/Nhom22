package com.do_an_tot_nghiep.k28.account.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DanhTinhOauth {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long nguoiDungId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private NhaCungCap nhaCungCap;

    private String subject;

    private String email;

    private Instant createdAt;

    public static DanhTinhOauth google(Long nguoiDungId, String subject, String email, Instant now) {
        DanhTinhOauth identity = new DanhTinhOauth();
        identity.nguoiDungId = nguoiDungId;
        identity.nhaCungCap = NhaCungCap.GOOGLE;
        identity.subject = subject;
        identity.email = email;
        identity.createdAt = now;
        return identity;
    }
}
