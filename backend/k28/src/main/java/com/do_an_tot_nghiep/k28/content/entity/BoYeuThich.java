package com.do_an_tot_nghiep.k28.content.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.io.Serializable;
import java.time.Instant;

@Entity
@Immutable
@Getter
@IdClass(BoYeuThich.Key.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BoYeuThich {

    @Id
    private Long nguoiDungId;

    @Id
    private Long boTheId;

    @Column(nullable = false)
    private Instant createdAt;

    @EqualsAndHashCode
    @NoArgsConstructor
    public static class Key implements Serializable {
        private Long nguoiDungId;
        private Long boTheId;
    }
}
