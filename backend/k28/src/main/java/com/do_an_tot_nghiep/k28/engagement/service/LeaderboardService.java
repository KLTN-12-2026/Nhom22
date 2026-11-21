package com.do_an_tot_nghiep.k28.engagement.service;

import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.account.service.SettingsService;
import com.do_an_tot_nghiep.k28.common.quota.GoiDichVuResolver;
import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.content.service.FileService;
import com.do_an_tot_nghiep.k28.engagement.dto.KyXepHang;
import com.do_an_tot_nghiep.k28.engagement.dto.LeaderboardEntryResponse;
import com.do_an_tot_nghiep.k28.engagement.dto.LeaderboardQuery;
import com.do_an_tot_nghiep.k28.engagement.dto.LeaderboardResponse;
import com.do_an_tot_nghiep.k28.engagement.repository.LeaderboardRepository;
import com.do_an_tot_nghiep.k28.learning.service.StreakService;
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class LeaderboardService {

    private final LeaderboardRepository leaderboard;
    private final AccountService accountService;
    private final SettingsService settingsService;
    private final FileService fileService;
    private final GoiDichVuResolver plans;
    private final Clock clock;
    private final NguoiDungRepository users;

    public LeaderboardResponse leaderboard(Long userId, LeaderboardQuery query) {
        LocalDate homNay = LocalDate.ofInstant(clock.instant(), accountService.zoneOf(userId));
        LocalDate tuNgay = query.ky() == KyXepHang.THANG
                ? homNay.withDayOfMonth(1)
                : homNay.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate denNgay = query.ky() == KyXepHang.THANG
                ? homNay.with(TemporalAdjusters.lastDayOfMonth())
                : tuNgay.plusDays(6);
        int toiThieu = StreakService.LUOT_TOI_THIEU_CHUOI;
        List<LeaderboardRepository.Row> rows = leaderboard.rows(tuNgay, denNgay, toiThieu, query.gioiHan(), userId);
        List<LeaderboardEntryResponse> entries = rows.stream().map(row -> entry(row, userId)).toList();
        List<LeaderboardEntryResponse> top = entries.stream().filter(e -> e.hang() <= query.gioiHan()).toList();
        Optional<LeaderboardEntryResponse> toi = entries.stream().filter(LeaderboardEntryResponse::laToi).findFirst();
        LeaderboardEntryResponse truocToi = toi.flatMap(me -> entries.stream()
                .filter(e -> e.hang() == me.hang() - 1).findFirst()).orElse(null);
        boolean thamGia = !admin(userId) && settingsService.joinsLeaderboard(userId);
        return new LeaderboardResponse(query.ky(), tuNgay, denNgay, query.gioiHan(), toiThieu,
                leaderboard.count(tuNgay, denNgay, toiThieu), thamGia, top, toi.orElse(null), truocToi);
    }

    private boolean admin(Long userId) {
        return users.existsByIdAndVaiTro_Ma(userId, VaiTro.ADMIN);
    }

    private LeaderboardEntryResponse entry(LeaderboardRepository.Row row, Long userId) {
        FileResponse avatar = fileService.publicAvatar(row.nguoiDungId());
        return new LeaderboardEntryResponse(
                row.hang(),
                String.valueOf(row.nguoiDungId()),
                row.tenHienThi(),
                avatar == null ? null : avatar.downloadUrl(),
                Optional.ofNullable(plans.goiMa(row.nguoiDungId())).orElse("FREE"),
                row.soNgay(),
                row.soLuot(),
                Objects.equals(row.nguoiDungId(), userId)
        );
    }
}
