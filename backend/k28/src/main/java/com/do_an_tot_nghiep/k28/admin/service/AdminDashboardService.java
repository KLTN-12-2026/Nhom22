package com.do_an_tot_nghiep.k28.admin.service;

import com.do_an_tot_nghiep.k28.admin.dto.AdminDashboardResponse;
import com.do_an_tot_nghiep.k28.admin.dto.AuditLogQuery;
import com.do_an_tot_nghiep.k28.admin.repository.AdminDashboardRepository;
import com.do_an_tot_nghiep.k28.admin.repository.AdminDashboardRepository.DayLearning;
import com.do_an_tot_nghiep.k28.admin.repository.AdminDashboardRepository.DayRecall;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.quota.QuotaService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    static final Set<Integer> KHOANG_HOP_LE = Set.of(7, 30, 90);
    static final int SO_THANG = 12;
    static final int SO_MUC = 5;
    static final int SO_NHAT_KY = 6;

    private final AdminDashboardRepository repository;
    private final AdminServiceOpsService serviceOps;
    private final AuditService audit;
    private final QuotaService quota;
    private final RedisConnectionFactory redis;
    private final Clock clock;

    @Transactional(readOnly = true)
    public AdminDashboardResponse dashboard(Long adminId, Integer soNgayParam) {
        int soNgay = soNgayParam == null ? 7 : soNgayParam;
        if (!KHOANG_HOP_LE.contains(soNgay)) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "soNgay", "Chỉ chọn 7, 30 hoặc 90 ngày");
        }
        Instant now = clock.instant();
        ZoneId zone = quota.zone();
        String offset = zone.getRules().getOffset(now).getId().replace("Z", "+00:00");
        LocalDate homNay = LocalDate.ofInstant(now, zone);
        LocalDate tuNgay = homNay.minusDays(soNgay - 1L);
        LocalDate kyTruocTu = tuNgay.minusDays(soNgay);
        Instant tu = tuNgay.atStartOfDay(zone).toInstant();
        Instant kyTruoc = kyTruocTu.atStartOfDay(zone).toInstant();

        Map<LocalDate, Long> signups = repository.signupsByDay(tu, offset);
        Map<LocalDate, DayLearning> learning = repository.learningByDay(tuNgay, homNay);
        Map<LocalDate, DayRecall> recall = repository.recallByDay(tu, offset);
        List<AdminDashboardResponse.Ngay> theoNgay = new ArrayList<>();
        long recallTotal = 0;
        long recallGood = 0;
        for (LocalDate ngay = tuNgay; !ngay.isAfter(homNay); ngay = ngay.plusDays(1)) {
            DayLearning day = learning.getOrDefault(ngay, new DayLearning(0, 0));
            DayRecall rc = recall.getOrDefault(ngay, new DayRecall(0, 0));
            recallTotal += rc.tong();
            recallGood += rc.nho();
            theoNgay.add(new AdminDashboardResponse.Ngay(ngay, signups.getOrDefault(ngay, 0L), day.nguoiHoc(),
                    day.luotOn(), AdminDashboardRepository.ratio(rc.nho(), rc.tong())));
        }

        YearMonth thangNay = YearMonth.from(homNay);
        YearMonth thangDau = thangNay.minusMonths(SO_THANG - 1L);
        Map<String, long[]> revenue = repository.revenueByMonth(thangDau.atDay(1).atStartOfDay(zone).toInstant(), offset);
        List<AdminDashboardResponse.Thang> doanhThu = new ArrayList<>();
        for (YearMonth thang = thangDau; !thang.isAfter(thangNay); thang = thang.plusMonths(1)) {
            long[] row = revenue.getOrDefault(thang.toString(), new long[] {0, 0});
            doanhThu.add(new AdminDashboardResponse.Thang(thang.toString(), row[0], row[1]));
        }

        AdminDashboardRepository.UserCounts users = repository.userCounts();
        DayLearning trongKy = repository.learningTotal(tuNgay, homNay);
        DayLearning kyTruocTotal = repository.learningTotal(kyTruocTu, tuNgay.minusDays(1));
        List<AdminDashboardResponse.Goi> plans = repository.activePlans(now);
        long subscribers = plans.stream().mapToLong(AdminDashboardResponse.Goi::soNguoi).sum();
        AdminDashboardResponse.CanXuLy queue = repository.queue(now);

        AdminDashboardResponse.ChiSo chiSo = new AdminDashboardResponse.ChiSo(
                users.tong(), users.hoatDong(), users.biKhoa(), users.chuaXacThuc(), users.quanTri(),
                repository.newUsers(tu, now), repository.newUsers(kyTruoc, tu),
                learning.getOrDefault(homNay, new DayLearning(0, 0)).nguoiHoc(),
                repository.learningTotal(homNay.minusDays(1), homNay.minusDays(1)).nguoiHoc(),
                trongKy.nguoiHoc(), trongKy.luotOn(), kyTruocTotal.luotOn(),
                AdminDashboardRepository.ratio(recallGood, recallTotal), subscribers,
                doanhThu.get(doanhThu.size() - 1).doanhThu(), doanhThu.get(doanhThu.size() - 2).doanhThu());

        return new AdminDashboardResponse(zone.getId(), soNgay, tuNgay, homNay, now, chiSo, theoNgay, doanhThu, plans,
                queue, repository.topSampleDecks(tu, SO_MUC), repository.newestUsers(now, SO_MUC),
                serviceOps.usage(homNay.toString(), homNay.toString()),
                audit.page(adminId, new AuditLogQuery(null, null, null, null, null, null, 0, SO_NHAT_KY)).items(),
                new AdminDashboardResponse.HeThong("UP", redisStatus(), repository.pendingJobs(), queue.tacVuLoi24h()));
    }

    private String redisStatus() {
        try (RedisConnection connection = redis.getConnection()) {
            return "PONG".equalsIgnoreCase(connection.ping()) ? "UP" : "DOWN";
        } catch (RuntimeException exception) {
            log.warn("Redis ping failed: {}", exception.getClass().getSimpleName());
            return "DOWN";
        }
    }
}
