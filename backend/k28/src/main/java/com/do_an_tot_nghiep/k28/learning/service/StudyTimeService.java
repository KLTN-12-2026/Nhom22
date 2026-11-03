package com.do_an_tot_nghiep.k28.learning.service;

import com.do_an_tot_nghiep.k28.learning.repository.LichSuOnRepository;
import com.do_an_tot_nghiep.k28.learning.repository.StudyTimeRow;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StudyTimeService {

    static final long MS_MOI_PHUT = 60_000;

    private final LichSuOnRepository history;

    public record StudyTime(long thoiGian, int soPhut) {

        static StudyTime of(long thoiGian) {
            return new StudyTime(thoiGian, Math.toIntExact(thoiGian / MS_MOI_PHUT));
        }
    }

    @Transactional(readOnly = true)
    public StudyTime day(Long userId, LocalDate ngay, ZoneId zone) {
        return days(userId, ngay, ngay, zone).get(ngay);
    }

    @Transactional(readOnly = true)
    public Map<LocalDate, StudyTime> days(Long userId, LocalDate tuNgay, LocalDate denNgay, ZoneId zone) {
        Map<LocalDate, Long> msTheoNgay = history.studyTimes(
                        userId,
                        tuNgay.atStartOfDay(zone).toInstant(),
                        denNgay.plusDays(1).atStartOfDay(zone).toInstant())
                .stream()
                .collect(Collectors.groupingBy(
                        row -> LocalDate.ofInstant(row.createdAt(), zone),
                        Collectors.summingLong(StudyTimeRow::thoiGian)));
        Map<LocalDate, StudyTime> result = new LinkedHashMap<>();
        tuNgay.datesUntil(denNgay.plusDays(1))
                .forEach(ngay -> result.put(ngay, StudyTime.of(msTheoNgay.getOrDefault(ngay, 0L))));
        return result;
    }
}
