package com.do_an_tot_nghiep.k28.engagement.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import java.time.Instant;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class NguoiDungHuyHieu extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long nguoiDungId;

    @Column(nullable = false)
    private Long huyHieuId;

    @Column(nullable = false)
    private Instant nhanAt;

    public static NguoiDungHuyHieu create(Long nguoiDungId, Long huyHieuId, Instant nhanAt) {
        NguoiDungHuyHieu row = new NguoiDungHuyHieu();
        row.nguoiDungId = nguoiDungId;
        row.huyHieuId = huyHieuId;
        row.nhanAt = nhanAt;
        return row;
    }
}
