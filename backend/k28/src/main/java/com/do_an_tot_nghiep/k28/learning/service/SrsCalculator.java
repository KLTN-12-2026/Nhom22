package com.do_an_tot_nghiep.k28.learning.service;

import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

public final class SrsCalculator {

    public static final String VERSION = "SM2-VN-1";

    private static final BigDecimal EF_BONUS = new BigDecimal("0.10");
    private static final BigDecimal EF_BASE = new BigDecimal("0.08");
    private static final BigDecimal EF_STEP = new BigDecimal("0.02");
    private static final BigDecimal HARD_FACTOR = new BigDecimal("1.2");
    private static final BigDecimal EASY_FACTOR = new BigDecimal("1.3");
    private static final int SECOND_REVIEW_DAYS = 6;

    public SrsState calculate(SrsState previous, DanhGia rating, Instant now) {
        Objects.requireNonNull(previous, "Trạng thái tiến độ cũ không được null");
        Objects.requireNonNull(rating, "Mức đánh giá không được null");
        Objects.requireNonNull(now, "Thời điểm trả lời không được null");
        return switch (previous.trangThai()) {
            case MOI, DANG_HOC -> learn(previous, rating, now);
            case ON_TAP -> review(previous, rating, now);
            case HOC_LAI -> relearn(previous, rating, now);
            case TAM_NGUNG -> throw new IllegalArgumentException("Không thể đánh giá thẻ đang tạm ngưng");
        };
    }

    private SrsState learn(SrsState previous, DanhGia rating, Instant now) {
        boolean secondStep = previous.buocHoc() == 1;
        return switch (rating) {
            case QUEN -> learning(previous, 0, afterMinutes(now, 1));
            case KHO -> secondStep
                    ? learning(previous, 1, afterMinutes(now, 10))
                    : learning(previous, 0, afterMinutes(now, 5));
            case NHO -> secondStep
                    ? graduated(previous, 1, now)
                    : learning(previous, 1, afterMinutes(now, 10));
            case DE -> graduated(previous, 4, now);
        };
    }

    private SrsState review(SrsState previous, DanhGia rating, Instant now) {
        BigDecimal ef = nextEf(previous.ef(), rating);
        int interval = previous.khoangOnNgay();
        return switch (rating) {
            case QUEN -> new SrsState(
                    TrangThaiTienDo.HOC_LAI, 0, ef, 0, 0,
                    previous.soLanQuen() + 1, afterMinutes(now, 10));
            case KHO -> scheduled(previous, ef, grow(interval, HARD_FACTOR), now);
            case NHO -> scheduled(previous, ef,
                    previous.chuoiThanhCong() == 1 ? SECOND_REVIEW_DAYS : grow(interval, ef), now);
            case DE -> scheduled(previous, ef, grow(interval, ef.multiply(EASY_FACTOR)), now);
        };
    }

    private SrsState relearn(SrsState previous, DanhGia rating, Instant now) {
        return switch (rating) {
            case QUEN -> relearning(previous, afterMinutes(now, 1));
            case KHO -> relearning(previous, afterMinutes(now, 10));
            case NHO -> graduated(previous, 1, now);
            case DE -> graduated(previous, 2, now);
        };
    }

    private SrsState learning(SrsState previous, int step, Instant due) {
        return new SrsState(
                TrangThaiTienDo.DANG_HOC, step, previous.ef(), 0, 0, previous.soLanQuen(), due);
    }

    private SrsState relearning(SrsState previous, Instant due) {
        return new SrsState(
                TrangThaiTienDo.HOC_LAI, 0, previous.ef(), 0, 0, previous.soLanQuen(), due);
    }

    private SrsState graduated(SrsState previous, int days, Instant now) {
        return new SrsState(
                TrangThaiTienDo.ON_TAP, 0, previous.ef(), days, 1,
                previous.soLanQuen(), afterDays(now, days));
    }

    private SrsState scheduled(SrsState previous, BigDecimal ef, int days, Instant now) {
        return new SrsState(
                TrangThaiTienDo.ON_TAP, 0, ef, days, previous.chuoiThanhCong() + 1,
                previous.soLanQuen(), afterDays(now, days));
    }

    private BigDecimal nextEf(BigDecimal ef, DanhGia rating) {
        BigDecimal gap = BigDecimal.valueOf(5 - quality(rating));
        BigDecimal penalty = gap.multiply(EF_BASE.add(gap.multiply(EF_STEP)));
        BigDecimal next = ef.add(EF_BONUS).subtract(penalty).setScale(2, RoundingMode.HALF_UP);
        return next.max(SrsState.MIN_EF);
    }

    private int quality(DanhGia rating) {
        return switch (rating) {
            case QUEN -> 1;
            case KHO -> 3;
            case NHO -> 4;
            case DE -> 5;
        };
    }

    private int grow(int interval, BigDecimal factor) {
        int rounded = BigDecimal.valueOf(interval)
                .multiply(factor)
                .setScale(0, RoundingMode.HALF_UP)
                .intValueExact();
        return Math.min(SrsState.MAX_INTERVAL_DAYS, Math.max(interval + 1, rounded));
    }

    private Instant afterMinutes(Instant now, long minutes) {
        return now.plus(Duration.ofMinutes(minutes));
    }

    private Instant afterDays(Instant now, long days) {
        return now.plus(days, ChronoUnit.DAYS);
    }
}