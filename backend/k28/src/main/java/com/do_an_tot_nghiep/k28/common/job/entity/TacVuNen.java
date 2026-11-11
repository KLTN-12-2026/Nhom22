package com.do_an_tot_nghiep.k28.common.job.entity;

import com.do_an_tot_nghiep.k28.common.entity.BaseEntity;
import com.do_an_tot_nghiep.k28.common.job.entity.enums.TrangThaiTacVu;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class TacVuNen extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String loai;

    @Column(nullable = false, columnDefinition = "json")
    private String payloadJson;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private TrangThaiTacVu trangThai;

    @Column(nullable = false)
    private int retryCount;

    @Column(nullable = false)
    private int maxRetry;

    @Column(nullable = false)
    private Instant nextRunAt;

    @Column(length = 64)
    private String khoaBoi;

    private Instant khoaDenAt;

    @Column(length = 50)
    private String maLoi;

    public static TacVuNen moi(String loai, String payloadJson, int maxRetry, Instant nextRunAt) {
        TacVuNen job = new TacVuNen();
        job.loai = loai;
        job.payloadJson = payloadJson;
        job.trangThai = TrangThaiTacVu.CHO;
        job.retryCount = 0;
        job.maxRetry = maxRetry;
        job.nextRunAt = nextRunAt;
        return job;
    }

    public void batDau(String worker, Instant khoaDenAt) {
        this.trangThai = TrangThaiTacVu.DANG_CHAY;
        this.khoaBoi = worker;
        this.khoaDenAt = khoaDenAt;
    }
}
