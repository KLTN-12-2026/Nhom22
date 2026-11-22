package com.do_an_tot_nghiep.k28.admin.service;

import com.do_an_tot_nghiep.k28.account.service.AccountAdminService;
import com.do_an_tot_nghiep.k28.admin.dto.AdminUserDetailResponse;
import com.do_an_tot_nghiep.k28.admin.dto.AdminUserResponse;
import com.do_an_tot_nghiep.k28.admin.repository.AdminDashboardRepository;
import com.do_an_tot_nghiep.k28.admin.repository.AdminUserDetailRepository;
import com.do_an_tot_nghiep.k28.admin.repository.AdminUserDetailRepository.Cards;
import com.do_an_tot_nghiep.k28.admin.repository.AdminUserDetailRepository.Payments;
import com.do_an_tot_nghiep.k28.admin.repository.AdminUserDetailRepository.Profile;
import com.do_an_tot_nghiep.k28.admin.repository.AdminUserDetailRepository.Reviews;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.quota.QuotaService;
import com.do_an_tot_nghiep.k28.content.service.DeckService;
import com.do_an_tot_nghiep.k28.learning.service.StreakService;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminUserDetailService {

    static final int SO_NGAY = 30;
    static final int SO_GOI = 10;
    static final int SO_GIAO_DICH = 10;
    static final int SO_BO_THE = 5;

    private final AdminUserDetailRepository repository;
    private final DeckService decks;
    private final StreakService streaks;
    private final QuotaService quota;
    private final Clock clock;

    @Transactional(readOnly = true)
    public AdminUserDetailResponse detail(Long id) {
        Profile profile = repository.profile(id, AccountAdminService.SYSTEM_EMAIL)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy người dùng"));
        Instant now = clock.instant();
        ZoneId zone = ZoneId.of(profile.muiGio());
        LocalDate homNay = LocalDate.ofInstant(now, zone);
        LocalDate tuNgay = homNay.minusDays(SO_NGAY - 1);

        long soBoThe = decks.countByOwners(List.of(id)).getOrDefault(id, 0L);
        AdminUserResponse nguoiDung = new AdminUserResponse(String.valueOf(profile.id()), profile.email(),
                profile.tenHienThi(), profile.trangThai(), repository.roles(id), profile.createdAt(),
                profile.dangNhapCuoiAt(),
                profile.anhDaiDienId() == null ? null : String.valueOf(profile.anhDaiDienId()),
                profile.anhDaiDienId() != null && profile.anhDaiDienId().equals(profile.anhDaiDienAnId()),
                Math.toIntExact(soBoThe), null, null);

        Cards cards = repository.cards(id, now);
        Reviews reviews = repository.reviews(id, tuNgay.atStartOfDay(zone).toInstant());
        Map<LocalDate, AdminUserDetailResponse.Ngay> byDay = repository.learningByDay(id, tuNgay, homNay);
        List<AdminUserDetailResponse.Ngay> theoNgay = new ArrayList<>();
        int soNgayHoc = 0;
        for (LocalDate day = tuNgay; !day.isAfter(homNay); day = day.plusDays(1)) {
            AdminUserDetailResponse.Ngay value = byDay.getOrDefault(day, new AdminUserDetailResponse.Ngay(day, 0, 0));
            if (value.luotOn() > 0) {
                soNgayHoc++;
            }
            theoNgay.add(value);
        }
        AdminUserDetailResponse.HocTap hocTap = new AdminUserDetailResponse.HocTap(cards.daHoc(), cards.denHan(),
                cards.tamNgung(), reviews.tong(), AdminDashboardRepository.ratio(reviews.nho(), reviews.tong()),
                soNgayHoc, streaks.of(id, homNay).chuoiNgay(), repository.lastLearningDay(id), theoNgay);

        List<AdminUserDetailResponse.DangKy> lichSuGoi = repository.subscriptions(id, SO_GOI);
        AdminUserDetailResponse.DangKy goiHienTai = lichSuGoi.stream()
                .filter(goi -> "HIEU_LUC".equals(goi.trangThai()) && goi.hetHanAt() != null && goi.hetHanAt().isAfter(now))
                .findFirst().orElse(null);

        Payments payments = repository.payments(id);
        AdminUserDetailResponse.ThanhToan thanhToan = new AdminUserDetailResponse.ThanhToan(payments.tongDaChi(),
                payments.soThanhCong(), payments.soThatBai(), repository.recentPayments(id, SO_GIAO_DICH));

        LocalDate tuNgayDichVu = LocalDate.ofInstant(now, quota.zone()).minusDays(SO_NGAY - 1);
        return new AdminUserDetailResponse(nguoiDung, profile.muiGio(), profile.emailXacThucAt(), hocTap,
                goiHienTai, lichSuGoi, thanhToan, repository.serviceUsage(id, tuNgayDichVu),
                repository.decks(id, SO_BO_THE), repository.reports(id));
    }
}
