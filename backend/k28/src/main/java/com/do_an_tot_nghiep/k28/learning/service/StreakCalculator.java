package com.do_an_tot_nghiep.k28.learning.service;

import java.time.LocalDate;
import java.util.List;

public final class StreakCalculator {

    private StreakCalculator() {
    }

    public static int current(List<LocalDate> daysDescending, LocalDate today) {
        if (daysDescending.isEmpty()) {
            return 0;
        }
        LocalDate expected = daysDescending.get(0).equals(today) ? today : today.minusDays(1);
        int streak = 0;
        for (LocalDate day : daysDescending) {
            if (!day.equals(expected)) {
                break;
            }
            streak++;
            expected = expected.minusDays(1);
        }
        return streak;
    }
}
