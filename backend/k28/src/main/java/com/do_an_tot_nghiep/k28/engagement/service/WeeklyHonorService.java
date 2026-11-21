package com.do_an_tot_nghiep.k28.engagement.service;

import com.do_an_tot_nghiep.k28.common.quota.GoiDichVuResolver;
import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.content.service.FileService;
import com.do_an_tot_nghiep.k28.engagement.dto.WeeklyHonorEntryResponse;
import com.do_an_tot_nghiep.k28.engagement.dto.WeeklyHonorResponse;
import com.do_an_tot_nghiep.k28.engagement.entity.HuyHieu;
import com.do_an_tot_nghiep.k28.engagement.entity.enums.LoaiDieuKienHuyHieu;
import com.do_an_tot_nghiep.k28.engagement.repository.HuyHieuRepository;
import com.do_an_tot_nghiep.k28.engagement.repository.LeaderboardRepository;
import com.do_an_tot_nghiep.k28.engagement.repository.NguoiDungHuyHieuRepository;
import com.do_an_tot_nghiep.k28.engagement.repository.WeeklyHonorRepository;
import com.do_an_tot_nghiep.k28.learning.service.StreakService;
import com.do_an_tot_nghiep.k28.notification.entity.enums.LoaiThongBao;
import com.do_an_tot_nghiep.k28.notification.service.NotificationService;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeeklyHonorService {

    public static final ZoneId VUNG_GIO = ZoneId.of("Asia/Ho_Chi_Minh");
    static final int SO_VINH_DANH = 10;
    private static final DateTimeFormatter NGAY = DateTimeFormatter.ofPattern("dd/MM");

    private final Clock clock;
    private final LeaderboardRepository leaderboard;
    private final WeeklyHonorRepository honors;
    private final HuyHieuRepository badges;
    private final NguoiDungHuyHieuRepository earned;
    private final NotificationService notifications;
    private final FileService fileService;
    private final GoiDichVuResolver plans;

    public static LocalDate lastFinishedWeek(LocalDate homNay) {
        return homNay.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).minusWeeks(1);
    }

    @Transactional
    public int finalizeWeek(LocalDate tuanBatDau) {
        if (honors.exists(tuanBatDau)) {
            return 0;
        }
        LocalDate tuanKetThuc = tuanBatDau.plusDays(6);
        Instant now = clock.instant();
        List<LeaderboardRepository.Row> rows = leaderboard.rows(tuanBatDau, tuanKetThuc,
                StreakService.LUOT_TOI_THIEU_CHUOI, SO_VINH_DANH, null);
        List<HuyHieu> weekly = badges.findByHoatDongTrueOrderByThuTuAscIdAsc().stream()
                .filter(badge -> badge.getLoaiDieuKien() == LoaiDieuKienHuyHieu.XEP_HANG_TUAN)
                .toList();
        int saved = 0;
        for (LeaderboardRepository.Row row : rows) {
            if (row.hang() > SO_VINH_DANH || row.soNgay() <= 0) {
                continue;
            }
            saved += honors.insert(tuanBatDau, row.hang(), row.nguoiDungId(), row.soNgay(), row.soLuot(), now);
            for (HuyHieu badge : weekly) {
                if (row.hang() <= badge.getNguong()) {
                    earned.award(row.nguoiDungId(), badge.getId(), now);
                }
            }
            notifications.create(row.nguoiDungId(), LoaiThongBao.VINH_DANH_TUAN, tuanBatDau,
                    "Vinh danh tuần " + NGAY.format(tuanBatDau) + " – " + NGAY.format(tuanKetThuc),
                    message(row), "/bang-xep-hang", true, false);
        }
        log.info("Weekly honors for {}: {} learners", tuanBatDau, saved);
        return saved;
    }

    public void finalizeLastWeek() {
        finalizeWeek(lastFinishedWeek(LocalDate.ofInstant(clock.instant(), VUNG_GIO)));
    }

    public WeeklyHonorResponse latest() {
        Optional<LocalDate> tuan = honors.latestWeek();
        if (tuan.isEmpty()) {
            return new WeeklyHonorResponse(null, null, List.of());
        }
        List<WeeklyHonorEntryResponse> vinhDanh = honors.week(tuan.get(), 3).stream()
                .map(this::entry)
                .toList();
        return new WeeklyHonorResponse(tuan.get(), tuan.get().plusDays(6), vinhDanh);
    }

    private WeeklyHonorEntryResponse entry(WeeklyHonorRepository.Honor honor) {
        FileResponse avatar = fileService.publicAvatar(honor.nguoiDungId());
        return new WeeklyHonorEntryResponse(honor.hang(), String.valueOf(honor.nguoiDungId()), honor.tenHienThi(),
                avatar == null ? null : avatar.downloadUrl(),
                Optional.ofNullable(plans.goiMa(honor.nguoiDungId())).orElse("FREE"),
                honor.soNgay(), honor.soLuotHopLe(), honors.wins(honor.nguoiDungId(), 3));
    }

    private static String message(LeaderboardRepository.Row row) {
        String rank = row.hang() == 1 ? "hạng nhất" : "hạng " + row.hang();
        String badge = row.hang() == 1 ? "Quán quân tuần" : row.hang() <= 3 ? "Bục vinh quang" : "Top 10 tuần";
        return "Bạn đứng " + rank + " bảng xếp hạng siêng năng với " + row.soNgay() + " ngày học đủ và "
                + row.soLuot() + " lượt ôn. Huy hiệu \u201c" + badge + "\u201d đã được trao!";
    }
}
