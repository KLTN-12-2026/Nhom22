package com.do_an_tot_nghiep.k28.learning.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

public final class StreakCalculator {

    public static final int CUA_SO_KHOI_PHUC = 7;

    public record Result(int chuoiNgay, boolean homNayDaTinhChuoi, LocalDate ngayNghiTuanNay, Set<LocalDate> ngayNghi) {

        public Result(int chuoiNgay, boolean homNayDaTinhChuoi, LocalDate ngayNghiTuanNay) {
            this(chuoiNgay, homNayDaTinhChuoi, ngayNghiTuanNay, Set.of());
        }

        public boolean daDungNgayNghiTuanNay() {
            return ngayNghiTuanNay != null;
        }
    }

    public record RestorePlan(int chuoiHienTai, int chuoiSauKhoiPhuc, List<LocalDate> ngayCanBu) {

        public boolean coThe() {
            return !ngayCanBu.isEmpty() && chuoiSauKhoiPhuc > chuoiHienTai;
        }
    }

    private StreakCalculator() {
    }

    public static LocalDate weekStart(LocalDate day) {
        return day.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    public static Result calculate(List<LocalDate> daysDescending, LocalDate today) {
        return calculate(daysDescending, Set.of(), today);
    }

    public static Result calculate(List<LocalDate> daysDescending, Collection<LocalDate> covered, LocalDate today) {
        if (daysDescending.isEmpty()) {
            return new Result(0, false, null, Set.of());
        }
        Set<LocalDate> qualified = new HashSet<>(daysDescending);
        Set<LocalDate> bridged = new HashSet<>(covered);
        LocalDate latest = daysDescending.get(0);
        LocalDate anchor = latest.isAfter(today) ? latest : today;
        LocalDate earliest = Stream.concat(qualified.stream(), bridged.stream()).min(LocalDate::compareTo).orElse(latest);
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
            if (bridged.contains(day)) {
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
        return new Result(streak, todayCounted, ngayNghi, Set.copyOf(frozen));
    }

    public static RestorePlan restorePlan(List<LocalDate> daysDescending, Collection<LocalDate> covered, LocalDate today) {
        int current = calculate(daysDescending, covered, today).chuoiNgay();
        Set<LocalDate> qualified = new HashSet<>(daysDescending);
        List<LocalDate> missing = new ArrayList<>();
        for (int i = 1; i <= CUA_SO_KHOI_PHUC; i++) {
            LocalDate day = today.minusDays(i);
            if (!qualified.contains(day) && !covered.contains(day)) {
                missing.add(day);
            }
        }
        int best = current;
        List<LocalDate> bestDays = List.of();
        for (int mask = 1; mask < 1 << missing.size(); mask++) {
            List<LocalDate> chosen = new ArrayList<>();
            for (int i = 0; i < missing.size(); i++) {
                if ((mask & 1 << i) != 0) {
                    chosen.add(missing.get(i));
                }
            }
            Set<LocalDate> trial = new HashSet<>(covered);
            trial.addAll(chosen);
            int streak = calculate(daysDescending, trial, today).chuoiNgay();
            if (streak > best || streak == best && streak > current && chosen.size() < bestDays.size()) {
                best = streak;
                bestDays = chosen;
            }
        }
        return new RestorePlan(current, best, bestDays.stream().sorted().toList());
    }
}
