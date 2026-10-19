package com.do_an_tot_nghiep.k28.learning.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.Test;

class StreakCalculatorTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 10, 19);

    @Test
    void emptyListIsZero() {
        assertThat(StreakCalculator.current(List.of(), TODAY)).isZero();
    }

    @Test
    void todayAndPreviousDaysAreCounted() {
        assertThat(StreakCalculator.current(days("2026-10-19", "2026-10-18", "2026-10-17"), TODAY)).isEqualTo(3);
    }

    @Test
    void streakSurvivesWhileTodayIsNotYetQualified() {
        assertThat(StreakCalculator.current(days("2026-10-18", "2026-10-17"), TODAY)).isEqualTo(2);
    }

    @Test
    void gapStopsTheCount() {
        assertThat(StreakCalculator.current(days("2026-10-19", "2026-10-18", "2026-10-16", "2026-10-15"), TODAY))
                .isEqualTo(2);
    }

    @Test
    void lastQualifyingDayOlderThanYesterdayBreaksTheStreak() {
        assertThat(StreakCalculator.current(days("2026-10-17"), TODAY)).isZero();
    }

    @Test
    void countsAcrossMonthBoundary() {
        LocalDate today = LocalDate.of(2026, 11, 1);
        assertThat(StreakCalculator.current(days("2026-11-01", "2026-10-31", "2026-10-30"), today)).isEqualTo(3);
    }

    private static List<LocalDate> days(String... values) {
        return Arrays.stream(values).map(LocalDate::parse).toList();
    }
}