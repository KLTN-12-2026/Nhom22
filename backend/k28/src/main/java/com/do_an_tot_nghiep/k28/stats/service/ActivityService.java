package com.do_an_tot_nghiep.k28.stats.service;

import com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.account.service.SettingsService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.learning.service.StudyTimeService;
import com.do_an_tot_nghiep.k28.stats.dto.ActivityDayResponse;
import com.do_an_tot_nghiep.k28.stats.dto.ActivityQuery;
import com.do_an_tot_nghiep.k28.stats.dto.ActivityResponse;
import com.do_an_tot_nghiep.k28.stats.dto.PublicActivityResponse;
import com.do_an_tot_nghiep.k28.stats.repository.AttemptStatRow;
import com.do_an_tot_nghiep.k28.stats.repository.StatisticsRepository;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.time.temporal.TemporalAdjusters;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ActivityService {

    static final int SO_TUAN = 53;

    private final Clock clock;
    private final AccountService accountService;
    private final StudyTimeService studyTimeService;
    private final StatisticsRepository statistics;
    private final SettingsService settingsService;
    private final NguoiDungRepository users;

    @Transactional(readOnly = true)
    public PublicActivityResponse publicActivity(Long userId) {
        if (userId == null || userId <= 0 || users.findById(userId)
                .filter(user -> user.getTrangThai() == TrangThaiNguoiDung.HOAT_DONG).isEmpty()) {
            throw new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy người dùng");
        }
        if (!settingsService.publicActivity(userId)) {
            return new PublicActivityResponse(false, null, null, null, List.of());
        }
        ActivityResponse full = activity(userId, new ActivityQuery(null));
        List<ActivityDayResponse> days = full.theoNgay().stream()
                .map(day -> new ActivityDayResponse(day.ngay(), day.soLuotOn(), 0, 0, day.soCongKhai()))
                .toList();
        return new PublicActivityResponse(true, full.muiGio(), full.tuNgay(), full.denNgay(), days);
    }

    @Transactional(readOnly = true)
    public ActivityResponse activity(Long userId, ActivityQuery query) {
        ZoneId zone = accountService.zoneOf(userId);
        LocalDate homNay = LocalDate.ofInstant(clock.instant(), zone);
        LocalDate denNgay = query.denNgay() == null ? homNay : parseDate(query.denNgay());
        if (denNgay.isAfter(homNay)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "denNgay", "Không chọn ngày trong tương lai");
        }
        LocalDate tuNgay = denNgay.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY))
                .minusWeeks(SO_TUAN - 1);
        Instant batDau = tuNgay.atStartOfDay(zone).toInstant();
        Instant ketThuc = denNgay.plusDays(1).atStartOfDay(zone).toInstant();

        Map<LocalDate, Long> luotOn = countByDay(statistics.reviewTimes(userId, batDau, ketThuc), zone);
        Map<LocalDate, Integer> cauLuyen = statistics.attempts(userId, batDau, ketThuc, null).stream()
                .collect(Collectors.groupingBy(row -> LocalDate.ofInstant(row.nopAt(), zone),
                        Collectors.summingInt(AttemptStatRow::tongSoCau)));
        Map<LocalDate, Long> congKhai = countByDay(statistics.approvedPublishTimes(userId, batDau, ketThuc), zone);
        Map<LocalDate, StudyTimeService.StudyTime> thoiGian = studyTimeService.days(userId, tuNgay, denNgay, zone);

        List<ActivityDayResponse> theoNgay = thoiGian.entrySet().stream()
                .map(entry -> new ActivityDayResponse(
                        entry.getKey(),
                        Math.toIntExact(luotOn.getOrDefault(entry.getKey(), 0L)),
                        cauLuyen.getOrDefault(entry.getKey(), 0),
                        entry.getValue().soPhut(),
                        Math.toIntExact(congKhai.getOrDefault(entry.getKey(), 0L))))
                .toList();
        return new ActivityResponse(zone.getId(), tuNgay, denNgay, theoNgay);
    }

    private Map<LocalDate, Long> countByDay(Collection<Instant> times, ZoneId zone) {
        return times.stream().collect(Collectors.groupingBy(
                time -> LocalDate.ofInstant(time, zone), Collectors.counting()));
    }

    private LocalDate parseDate(String value) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "denNgay", "Ngày không tồn tại");
        }
    }
}
