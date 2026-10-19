package com.do_an_tot_nghiep.k28.learning.service;

import com.do_an_tot_nghiep.k28.account.dto.LearningSettingsResponse;
import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.account.service.SettingsService;
import com.do_an_tot_nghiep.k28.learning.dto.DaHocHomNayResponse;
import com.do_an_tot_nghiep.k28.learning.dto.DeckPlanResponse;
import com.do_an_tot_nghiep.k28.learning.dto.TodayPlanResponse;
import com.do_an_tot_nghiep.k28.learning.entity.SuDungHocNgay;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import com.do_an_tot_nghiep.k28.learning.repository.DeckCardRow;
import com.do_an_tot_nghiep.k28.learning.repository.DeckDueRow;
import com.do_an_tot_nghiep.k28.learning.repository.SuDungHocNgayRepository;
import com.do_an_tot_nghiep.k28.learning.repository.TienDoTheRepository;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LearningPlanService {

    static final int GIAY_MOI_LUOT = 20;
    static final int LUOT_TOI_THIEU_CHUOI = 5;
    static final int SO_NGAY_TOI_DA = 1000;

    private static final List<TrangThaiTienDo> TRANG_THAI_CO_HAN = List.of(
            TrangThaiTienDo.DANG_HOC,
            TrangThaiTienDo.ON_TAP,
            TrangThaiTienDo.HOC_LAI
    );

    private final Clock clock;
    private final AccountService accountService;
    private final SettingsService settingsService;
    private final TienDoTheRepository progress;
    private final SuDungHocNgayRepository usage;

    @Transactional
    public TodayPlanResponse today(Long userId) {
        ZoneId zone = accountService.zoneOf(userId);
        LocalDate homNay = LocalDate.ofInstant(clock.instant(), zone);
        Instant batDau = homNay.atStartOfDay(zone).toInstant();
        Instant ketThuc = homNay.plusDays(1).atStartOfDay(zone).toInstant();
        LearningSettingsResponse settings = settingsService.learning(userId);

        List<DeckDueRow> dueRows = progress.dueByDeck(userId, TRANG_THAI_CO_HAN, batDau, ketThuc);
        Map<Long, DeckDueRow> dueByDeck = dueRows.stream()
                .collect(Collectors.toMap(DeckDueRow::boTheId, Function.identity()));
        List<DeckCardRow> deckRows = progress.deckCards(userId, TrangThaiTienDo.MOI);

        int soQuaHan = Math.toIntExact(dueRows.stream().mapToLong(DeckDueRow::soQuaHan).sum());
        int soDenHan = Math.toIntExact(dueRows.stream().mapToLong(DeckDueRow::soDenHan).sum());
        int tongSoThe = Math.toIntExact(deckRows.stream().mapToLong(DeckCardRow::tongSoThe).sum());
        int soMoiKhaDung = Math.toIntExact(deckRows.stream().mapToLong(DeckCardRow::soMoi).sum());

        SuDungHocNgay homNayDung = usage.findByNguoiDungIdAndNgayDiaPhuong(userId, homNay).orElse(null);
        int soTheMoiDaHoc = homNayDung == null ? 0 : homNayDung.getSoTheMoi();
        int soLuot = homNayDung == null ? 0 : homNayDung.getSoLuotHopLe();

        int soMoiConLai = Math.min(Math.max(0, settings.tuMoiMoiNgay() - soTheMoiDaHoc), soMoiKhaDung);
        int uocTinhPhut = Math.ceilDiv((soQuaHan + soDenHan + soMoiConLai) * GIAY_MOI_LUOT, 60);

        List<LocalDate> days = usage.qualifyingDays(
                userId, LUOT_TOI_THIEU_CHUOI, homNay, PageRequest.ofSize(SO_NGAY_TOI_DA));
        int chuoiNgay = StreakCalculator.current(days, homNay);
        boolean homNayDaTinhChuoi = !days.isEmpty() && days.get(0).equals(homNay);

        List<DeckPlanResponse> boThe = deckRows.stream()
                .map(row -> {
                    DeckDueRow due = dueByDeck.get(row.boTheId());
                    int soCanOn = due == null ? 0 : Math.toIntExact(due.soQuaHan() + due.soDenHan());
                    return new DeckPlanResponse(
                            String.valueOf(row.boTheId()), row.ten(), soCanOn, Math.toIntExact(row.soMoi()));
                })
                .toList();

        return new TodayPlanResponse(
                homNay,
                soQuaHan,
                soDenHan,
                soTheMoiDaHoc,
                settings.tuMoiMoiNgay(),
                soMoiConLai,
                GIAY_MOI_LUOT,
                uocTinhPhut,
                settings.phutMoiNgay(),
                chuoiNgay,
                homNayDaTinhChuoi,
                LUOT_TOI_THIEU_CHUOI,
                new DaHocHomNayResponse(soLuot, Math.ceilDiv(soLuot * GIAY_MOI_LUOT, 60)),
                tongSoThe,
                boThe
        );
    }
}
