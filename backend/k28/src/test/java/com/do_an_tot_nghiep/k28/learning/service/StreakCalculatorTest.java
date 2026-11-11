package com.do_an_tot_nghiep.k28.learning.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;

class StreakCalculatorTest {

    private static final LocalDate MONDAY = LocalDate.of(2026, 10, 19);

    @Test
    void emptyListIsZero() {
        StreakCalculator.Result result = StreakCalculator.calculate(List.of(), MONDAY);
        assertThat(result.chuoiNgay()).isZero();
        assertThat(result.homNayDaTinhChuoi()).isFalse();
        assertThat(result.daDungNgayNghiTuanNay()).isFalse();
    }

    @Test
    void todayAndPreviousDaysAreCounted() {
        StreakCalculator.Result result = calc(MONDAY, "2026-10-19", "2026-10-18", "2026-10-17");
        assertThat(result.chuoiNgay()).isEqualTo(3);
        assertThat(result.homNayDaTinhChuoi()).isTrue();
        assertThat(result.ngayNghiTuanNay()).isNull();
    }

    @Test
    void streakSurvivesWhileTodayIsNotYetQualified() {
        StreakCalculator.Result result = calc(MONDAY, "2026-10-18", "2026-10-17");
        assertThat(result.chuoiNgay()).isEqualTo(2);
        assertThat(result.homNayDaTinhChuoi()).isFalse();
    }

    @Test
    void tc15_oneMissedDayIsFrozenAndNotCounted() {
        StreakCalculator.Result result = calc(day("2026-10-21"), "2026-10-21", "2026-10-19");
        assertThat(result.chuoiNgay()).isEqualTo(2);
        assertThat(result.ngayNghiTuanNay()).isEqualTo(day("2026-10-20"));
        assertThat(result.daDungNgayNghiTuanNay()).isTrue();
    }

    @Test
    void tc15_yesterdayMissedIsFrozenWhileTodayIsInProgress() {
        StreakCalculator.Result result = calc(day("2026-10-21"), "2026-10-19");
        assertThat(result.chuoiNgay()).isEqualTo(1);
        assertThat(result.homNayDaTinhChuoi()).isFalse();
        assertThat(result.ngayNghiTuanNay()).isEqualTo(day("2026-10-20"));
    }

    @Test
    void tc15_twoConsecutiveMissedDaysInOneWeekBreakTheStreak() {
        StreakCalculator.Result result = calc(day("2026-10-22"), "2026-10-22", "2026-10-19");
        assertThat(result.chuoiNgay()).isEqualTo(1);
        assertThat(result.ngayNghiTuanNay()).isNull();
    }

    @Test
    void tc15_twoSeparateMissedDaysInOneWeekBreakTheStreak() {
        StreakCalculator.Result result = calc(day("2026-10-25"), "2026-10-25", "2026-10-24", "2026-10-22", "2026-10-20");
        assertThat(result.chuoiNgay()).isEqualTo(3);
        assertThat(result.ngayNghiTuanNay()).isEqualTo(day("2026-10-23"));
    }

    @Test
    void tc15_sundayAndMondayUseTheFreezeOfTheirOwnWeeks() {
        StreakCalculator.Result result = calc(day("2026-10-20"), "2026-10-20", "2026-10-17");
        assertThat(result.chuoiNgay()).isEqualTo(2);
        assertThat(result.ngayNghiTuanNay()).isEqualTo(day("2026-10-19"));
    }

    @Test
    void tc15_previousWeekFreezeIsNotReportedForThisWeek() {
        StreakCalculator.Result result = calc(MONDAY, "2026-10-19", "2026-10-18", "2026-10-16", "2026-10-15");
        assertThat(result.chuoiNgay()).isEqualTo(4);
        assertThat(result.daDungNgayNghiTuanNay()).isFalse();
    }

    @Test
    void tc15_unusedFreezeWithoutEarlierDayIsNotReported() {
        StreakCalculator.Result result = calc(day("2026-10-21"), "2026-10-17");
        assertThat(result.chuoiNgay()).isZero();
        assertThat(result.ngayNghiTuanNay()).isNull();
    }

    @Test
    void tc15_dayStoredAheadOfTodayAfterTimeZoneChangeIsKept() {
        StreakCalculator.Result result = calc(MONDAY, "2026-10-20", "2026-10-19", "2026-10-18");
        assertThat(result.chuoiNgay()).isEqualTo(3);
        assertThat(result.homNayDaTinhChuoi()).isTrue();
    }

    @Test
    void countsAcrossMonthBoundary() {
        assertThat(calc(day("2026-11-01"), "2026-11-01", "2026-10-31", "2026-10-30").chuoiNgay()).isEqualTo(3);
    }

    @Test
    void weekStartsOnMonday() {
        assertThat(StreakCalculator.weekStart(day("2026-10-25"))).isEqualTo(MONDAY);
        assertThat(StreakCalculator.weekStart(MONDAY)).isEqualTo(MONDAY);
    }

    private static StreakCalculator.Result calc(LocalDate today, String... values) {
        List<LocalDate> days = Arrays.stream(values).map(LocalDate::parse).toList();
        return StreakCalculator.calculate(days, today);
    }

    private static LocalDate day(String value) {
        return LocalDate.parse(value);
    }
}
