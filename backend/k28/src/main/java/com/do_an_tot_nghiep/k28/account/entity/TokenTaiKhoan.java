package com.do_an_tot_nghiep.k28.account.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Duration;
import java.time.Instant;

@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TokenTaiKhoan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long nguoiDungId;

    @Column(columnDefinition = "CHAR(64)")
    private String tokenHash;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private LoaiToken loai;

    private Instant hetHanAt;

    private Instant daDungAt;

    private Instant createdAt;

    public static TokenTaiKhoan issue(Long nguoiDungId, String tokenHash, LoaiToken loai,
                                      Instant now, Duration ttl) {
        TokenTaiKhoan token = new TokenTaiKhoan();
        token.nguoiDungId = nguoiDungId;
        token.tokenHash = tokenHash;
        token.loai = loai;
        token.hetHanAt = now.plus(ttl);
        token.createdAt = now;
        return token;
    }
}
