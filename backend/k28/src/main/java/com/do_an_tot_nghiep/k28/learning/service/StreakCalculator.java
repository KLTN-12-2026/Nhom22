package com.do_an_tot_nghiep.k28.learning.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class StreakCalculator {

    public record Result(int chuoiNgay, boolean homNayDaTinhChuoi, LocalDate ngayNghiTuanNay) {

        public boolean daDungNgayNghiTuanNay() {
            return ngayNghiTuanNay != null;
        }
    }

    private StreakCalculator() {
    }

    public static LocalDate weekStart(LocalDate day) {
        return day.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    public static Result calculate(List<LocalDate> daysDescending, LocalDate today) {
        if (daysDescending.isEmpty()) {
            return new Result(0, false, null);
        }
        LocalDate latest = daysDescending.get(0);
        LocalDate anchor = latest.isAfter(today) ? latest : today;
        LocalDate earliest = daysDescending.get(daysDescending.size() - 1);
        Set<LocalDate> qualified = new HashSet<>(daysDescending);
        boolean todayCounted = qualified.contains(anchor);

        int streak = 0;
        Set<LocalDate> usedWeeks = new HashSet<>();
        List<LocalDate> pending = new ArrayList<>();
        List<LocalDate> frozen = new ArrayList<>();
        for (LocalDate day = todayCounted ? anchor : anchor.minusDays(1);
             !day.isBefore(earliest);
             day = day.minusDays(1)) {
            if (qualified.contains(day)) {
                streak++;
                frozen.addAll(pending);
                pending.clear();
                continue;
            }
            if (!usedWeeks.add(weekStart(day))) {
                break;
            }
            pending.add(day);
        }

        LocalDate currentWeek = weekStart(anchor);
        LocalDate ngayNghi = frozen.stream()
                .filter(day -> weekStart(day).equals(currentWeek))
                .findFirst()
                .orElse(null);
        return new Result(streak, todayCounted, ngayNghi);
    }
}
