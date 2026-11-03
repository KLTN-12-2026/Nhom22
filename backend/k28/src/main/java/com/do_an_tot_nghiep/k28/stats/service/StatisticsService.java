package com.do_an_tot_nghiep.k28.stats.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.account.service.SettingsService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import com.do_an_tot_nghiep.k28.learning.service.LearningPlanService;
import com.do_an_tot_nghiep.k28.learning.service.StudyTimeService;
import com.do_an_tot_nghiep.k28.practice.entity.enums.KyNang;
import com.do_an_tot_nghiep.k28.practice.entity.enums.LoaiCau;
import com.do_an_tot_nghiep.k28.practice.entity.enums.NguonSuKien;
import com.do_an_tot_nghiep.k28.stats.dto.BaiLuyenStatsResponse;
import com.do_an_tot_nghiep.k28.stats.dto.OverviewQuery;
import com.do_an_tot_nghiep.k28.stats.dto.SkillStatResponse;
import com.do_an_tot_nghiep.k28.stats.dto.SkillsQuery;
import com.do_an_tot_nghiep.k28.stats.dto.StatisticsOverviewResponse;
import com.do_an_tot_nghiep.k28.stats.dto.TheoNgayResponse;
import com.do_an_tot_nghiep.k28.stats.repository.AttemptStatRow;
import com.do_an_tot_nghiep.k28.stats.repository.ReviewStatRow;
import com.do_an_tot_nghiep.k28.stats.repository.SkillAnswerRow;
import com.do_an_tot_nghiep.k28.stats.repository.SkillCountRow;
import com.do_an_tot_nghiep.k28.stats.repository.StatisticsRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StatisticsService {

    static final int SO_NGAY_MAC_DINH = 7;
    static final int SO_NGAY_TOI_DA = 90;

    private final Clock clock;
    private final AccountService accountService;
    private final SettingsService settingsService;
    private final LearningPlanService learningPlanService;
    private final StudyTimeService studyTimeService;
    private final StatisticsRepository statistics;

    @Value("${app.statistics.so-luot-toi-da:20}")
    private int soLuotToiDa;

    @Value("${app.statistics.so-quan-sat-toi-thieu:5}")
    private int soQuanSatToiThieu;

    @Transactional
    public StatisticsOverviewResponse overview(Long userId, OverviewQuery query) {
        ZoneId zone = accountService.zoneOf(userId);
        LocalDate homNay = LocalDate.ofInstant(clock.instant(), zone);
        LocalDate denNgay = query.denNgay() == null ? homNay : parseDate(query.denNgay(), "denNgay");
        LocalDate tuNgay = query.tuNgay() == null
                ? denNgay.minusDays(SO_NGAY_MAC_DINH - 1)
                : parseDate(query.tuNgay(), "tuNgay");
        validateRange(tuNgay, denNgay, homNay);
        Long boTheId = query.deckId();
        requireDeck(userId, boTheId);

        Instant batDau = tuNgay.atStartOfDay(zone).toInstant();
        Instant ketThuc = denNgay.plusDays(1).atStartOfDay(zone).toInstant();
        List<ReviewStatRow> reviews = statistics.reviews(userId, batDau, ketThuc, boTheId);
        List<AttemptStatRow> attempts = statistics.attempts(userId, batDau, ketThuc, boTheId);
        Map<LocalDate, StudyTimeService.StudyTime> thoiGian =
                studyTimeService.days(userId, tuNgay, denNgay, zone, boTheId);
        Map<LocalDate, Long> luotTheoNgay = reviews.stream().collect(Collectors.groupingBy(
                row -> LocalDate.ofInstant(row.createdAt(), zone), Collectors.counting()));
        Map<LocalDate, Integer> cauTheoNgay = attempts.stream().collect(Collectors.groupingBy(
                row -> LocalDate.ofInstant(row.nopAt(), zone), Collectors.summingInt(AttemptStatRow::tongSoCau)));

        int phutMoiNgay = settingsService.learning(userId).phutMoiNgay();
        List<TheoNgayResponse> theoNgay = thoiGian.entrySet().stream()
                .map(entry -> new TheoNgayResponse(
                        entry.getKey(),
                        Math.toIntExact(luotTheoNgay.getOrDefault(entry.getKey(), 0L)),
                        cauTheoNgay.getOrDefault(entry.getKey(), 0),
                        entry.getValue().thoiGian(),
                        entry.getValue().soPhut()))
                .toList();

        int soCauDung = attempts.stream().mapToInt(AttemptStatRow::soCauDung).sum();
        int tongSoCau = attempts.stream().mapToInt(AttemptStatRow::tongSoCau).sum();
        long soNho = reviews.stream().filter(row -> row.danhGia() != DanhGia.QUEN).count();

        return new StatisticsOverviewResponse(
                zone.getId(),
                tuNgay,
                denNgay,
                boTheId == null ? null : String.valueOf(boTheId),
                Math.toIntExact(reviews.stream().map(ReviewStatRow::theId).distinct().count()),
                reviews.size(),
                MasteryCalculator.percent(soNho, reviews.size()),
                new BaiLuyenStatsResponse(
                        attempts.size(), soCauDung, tongSoCau, MasteryCalculator.percent(soCauDung, tongSoCau)),
                theoNgay.stream().mapToInt(TheoNgayResponse::soPhut).sum(),
                phutMoiNgay,
                Math.toIntExact(theoNgay.stream()
                        .filter(day -> day.soLuotOn() > 0 || day.soCauLuyen() > 0)
                        .count()),
                Math.toIntExact(theoNgay.stream()
                        .filter(day -> day.thoiGian() >= phutMoiNgay * 60_000L)
                        .count()),
                learningPlanService.streak(userId, homNay),
                theoNgay
        );
    }

    @Transactional(readOnly = true)
    public List<SkillStatResponse> skills(Long userId, SkillsQuery query) {
        Long boTheId = query.deckId();
        requireDeck(userId, boTheId);

        Map<KyNang, long[]> counts = new EnumMap<>(KyNang.class);
        for (SkillCountRow row : statistics.skillCounts(userId, boTheId)) {
            long[] count = counts.computeIfAbsent(row.loaiCau().kyNang(), kyNang -> new long[4]);
            int offset = row.laLuyenLai() ? 2 : 0;
            count[offset] += row.soQuanSat();
            count[offset + 1] += row.soDung();
        }
        Map<KyNang, List<Boolean>> recent = new EnumMap<>(KyNang.class);
        for (SkillAnswerRow row : statistics.recentAnswers(userId, boTheId, soLuotToiDa)) {
            List<Boolean> answers = recent.computeIfAbsent(
                    LoaiCau.valueOf(row.getLoaiCau()).kyNang(), kyNang -> new ArrayList<>());
            if (answers.size() < soLuotToiDa) {
                answers.add(Boolean.TRUE.equals(row.getDung()));
            }
        }

        return Arrays.stream(KyNang.values())
                .map(kyNang -> {
                    long[] count = counts.getOrDefault(kyNang, new long[4]);
                    List<Boolean> answers = recent.getOrDefault(kyNang, List.of());
                    boolean duDuLieu = answers.size() >= soQuanSatToiThieu;
                    return new SkillStatResponse(
                            kyNang,
                            Math.toIntExact(count[0] + count[2]),
                            answers.size(),
                            duDuLieu,
                            duDuLieu ? MasteryCalculator.weighted(answers, soLuotToiDa) : null,
                            MasteryCalculator.percent(count[1], count[0]),
                            MasteryCalculator.percent(count[3], count[2]),
                            soQuanSatToiThieu,
                            NguonSuKien.BAI_LUYEN);
                })
                .toList();
    }

    private void requireDeck(Long userId, Long boTheId) {
        if (boTheId != null && !statistics.ownsDeck(userId, boTheId)) {
            throw new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy bộ thẻ");
        }
    }

    private void validateRange(LocalDate tuNgay, LocalDate denNgay, LocalDate homNay) {
        if (denNgay.isAfter(homNay)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "denNgay", "Không chọn ngày trong tương lai");
        }
        if (tuNgay.isAfter(denNgay)) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED, "denNgay", "Ngày kết thúc phải từ ngày bắt đầu trở đi");
        }
        if (ChronoUnit.DAYS.between(tuNgay, denNgay) >= SO_NGAY_TOI_DA) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "tuNgay", "Chọn khoảng tối đa 90 ngày");
        }
    }

    private LocalDate parseDate(String value, String field) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, field, "Ngày không tồn tại");
        }
    }
}
