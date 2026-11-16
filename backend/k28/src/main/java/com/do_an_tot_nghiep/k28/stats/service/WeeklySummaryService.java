package com.do_an_tot_nghiep.k28.stats.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.practice.dto.RecommendationResponse;
import com.do_an_tot_nghiep.k28.practice.entity.enums.KyNang;
import com.do_an_tot_nghiep.k28.practice.service.recommendation.RecommendationService;
import com.do_an_tot_nghiep.k28.stats.dto.OverviewQuery;
import com.do_an_tot_nghiep.k28.stats.dto.StatisticsOverviewResponse;
import com.do_an_tot_nghiep.k28.stats.dto.WeeklySummaryQuery;
import com.do_an_tot_nghiep.k28.stats.dto.WeeklySummaryResponse;
import com.do_an_tot_nghiep.k28.stats.dto.WeeklySummaryResponse.KyNangTuan;
import com.do_an_tot_nghiep.k28.stats.dto.WeeklySummaryResponse.MucTieuTuanSau;
import com.do_an_tot_nghiep.k28.stats.dto.WeeklySummaryResponse.TuKho;
import com.do_an_tot_nghiep.k28.stats.repository.SkillCountRow;
import com.do_an_tot_nghiep.k28.stats.repository.StatisticsRepository;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.TemporalAdjusters;
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
public class WeeklySummaryService {

    static final int SO_TU_KHO = 3;
    static final int SO_NGAY_HOC_TOI_THIEU = 3;

    private static final DateTimeFormatter NGAY = DateTimeFormatter.ofPattern("dd/MM");
    private static final Map<KyNang, String> TEN_KY_NANG = Map.of(
            KyNang.NHAN_NGHIA, "nhận nghĩa",
            KyNang.VIET, "viết",
            KyNang.NGHE, "nghe",
            KyNang.NGU_CANH, "ngữ cảnh",
            KyNang.CAP_NHAM, "phân biệt từ dễ nhầm");

    private final Clock clock;
    private final AccountService accounts;
    private final StatisticsService statisticsService;
    private final StatisticsRepository statistics;
    private final RecommendationService recommendations;

    @Value("${app.statistics.so-quan-sat-toi-thieu:5}")
    private int soQuanSatToiThieu;

    @Transactional
    public WeeklySummaryResponse summary(Long userId, WeeklySummaryQuery query) {
        ZoneId zone = accounts.zoneOf(userId);
        LocalDate homNay = LocalDate.ofInstant(clock.instant(), zone);
        LocalDate ngay = query.ngay() == null ? homNay : parseDate(query.ngay());
        LocalDate tuNgay = ngay.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate denNgay = tuNgay.plusDays(6);
        if (tuNgay.isAfter(homNay)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "ngay", "Không chọn tuần trong tương lai");
        }
        boolean tuanHienTai = !denNgay.isBefore(homNay);
        LocalDate denNgayDaQua = tuanHienTai ? homNay : denNgay;
        StatisticsOverviewResponse overview = statisticsService.overview(userId,
                new OverviewQuery(tuNgay.toString(), denNgayDaQua.toString(), null));

        Instant batDau = tuNgay.atStartOfDay(zone).toInstant();
        Instant ketThuc = denNgay.plusDays(1).atStartOfDay(zone).toInstant();
        Instant batDauTuanTruoc = tuNgay.minusWeeks(1).atStartOfDay(zone).toInstant();

        List<KyNangTuan> kyNang = skills(
                count(statistics.skillCountsBetween(userId, batDau, ketThuc)),
                count(statistics.skillCountsBetween(userId, batDauTuanTruoc, batDau)));
        List<TuKho> tuKho = statistics.hardWords(userId, batDau, ketThuc, SO_TU_KHO).stream()
                .map(row -> new TuKho(String.valueOf(row.getTheId()), row.getTu(), String.valueOf(row.getBoTheId()),
                        row.getTenBo(), row.getSoLanSai().intValue(), row.getSoLuot().intValue()))
                .toList();
        List<RecommendationResponse> tuDaVuotQua = recommendations.progressed(userId, ketThuc);
        int soTuMoi = Math.toIntExact(statistics.countNewCards(userId, batDau, ketThuc));

        MucTieuTuanSau mucTieu = goal(overview, tuKho);
        return new WeeklySummaryResponse(
                zone.getId(),
                tuNgay,
                denNgay,
                tuanHienTai,
                overview.soTuDaHoc(),
                soTuMoi,
                overview.soLuotOn(),
                overview.tyLeNho(),
                overview.baiLuyen().tongSoCau(),
                overview.tongPhut(),
                overview.soNgayCoHoc(),
                kyNang,
                tuKho,
                tuDaVuotQua,
                mucTieu,
                summaryText(tuNgay, denNgay, overview, soTuMoi, kyNang, tuDaVuotQua.size()));
    }

    private List<KyNangTuan> skills(Map<KyNang, long[]> tuanNay, Map<KyNang, long[]> tuanTruoc) {
        return Arrays.stream(KyNang.values())
                .map(kyNang -> {
                    long[] nay = tuanNay.getOrDefault(kyNang, new long[2]);
                    long[] truoc = tuanTruoc.getOrDefault(kyNang, new long[2]);
                    Integer tyLe = MasteryCalculator.percent(nay[1], nay[0]);
                    Integer tyLeTruoc = MasteryCalculator.percent(truoc[1], truoc[0]);
                    boolean duDuLieu = nay[0] >= soQuanSatToiThieu && truoc[0] >= soQuanSatToiThieu;
                    return new KyNangTuan(kyNang, Math.toIntExact(nay[0]), tyLe, Math.toIntExact(truoc[0]),
                            tyLeTruoc, duDuLieu, duDuLieu && tyLe > tyLeTruoc);
                })
                .toList();
    }

    private static Map<KyNang, long[]> count(List<SkillCountRow> rows) {
        Map<KyNang, long[]> counts = new EnumMap<>(KyNang.class);
        for (SkillCountRow row : rows) {
            long[] count = counts.computeIfAbsent(row.loaiCau().kyNang(), kyNang -> new long[2]);
            count[0] += row.soQuanSat();
            count[1] += row.soDung();
        }
        return counts;
    }

    private static MucTieuTuanSau goal(StatisticsOverviewResponse overview, List<TuKho> tuKho) {
        int soNgayHoc = Math.min(7, Math.max(SO_NGAY_HOC_TOI_THIEU, overview.soNgayCoHoc() + 1));
        String vanBan = "Học %d ngày, mỗi ngày %d phút".formatted(soNgayHoc, overview.phutMoiNgay());
        if (!tuKho.isEmpty()) {
            vanBan += "; ôn lại " + tuKho.stream().map(word -> "‘" + word.tu() + "’")
                    .collect(Collectors.joining(", ")) + " trước khi thêm từ mới";
        }
        return new MucTieuTuanSau(soNgayHoc, overview.phutMoiNgay(),
                tuKho.stream().map(TuKho::theId).toList(), vanBan + ".");
    }

    private static String summaryText(LocalDate tuNgay, LocalDate denNgay, StatisticsOverviewResponse overview,
                                      int soTuMoi, List<KyNangTuan> kyNang, int soTuVuotQua) {
        String tuan = "Tuần " + tuNgay.format(NGAY) + "–" + denNgay.format(NGAY);
        if (overview.soLuotOn() == 0 && overview.baiLuyen().tongSoCau() == 0) {
            return tuan + ": chưa có lượt học nào.";
        }
        StringBuilder text = new StringBuilder("%s: bạn ôn %d từ (%d từ mới) qua %d lượt, làm %d câu luyện, học %d/7 ngày."
                .formatted(tuan, overview.soTuDaHoc(), soTuMoi, overview.soLuotOn(),
                        overview.baiLuyen().tongSoCau(), overview.soNgayCoHoc()));
        List<String> tienBo = kyNang.stream().filter(KyNangTuan::tienBo)
                .map(skill -> TEN_KY_NANG.get(skill.kyNang())).toList();
        if (!tienBo.isEmpty()) {
            text.append(" Tiến bộ so với tuần trước: ").append(String.join(", ", tienBo)).append('.');
        }
        if (soTuVuotQua > 0) {
            text.append(" Đã vượt qua %d từ từng khó.".formatted(soTuVuotQua));
        }
        return text.toString();
    }

    private static LocalDate parseDate(String value) {
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException exception) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "ngay", "Ngày không tồn tại");
        }
    }
}
