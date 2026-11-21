package com.do_an_tot_nghiep.k28.learning.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.learning.dto.ChuoiNgayResponse;
import com.do_an_tot_nghiep.k28.learning.dto.KhoiPhucChuoiResponse;
import com.do_an_tot_nghiep.k28.learning.dto.NgayChuoiResponse;
import com.do_an_tot_nghiep.k28.learning.dto.TrangThaiNgayChuoi;
import com.do_an_tot_nghiep.k28.learning.entity.KhoiPhucChuoi;
import com.do_an_tot_nghiep.k28.learning.entity.SuDungHocNgay;
import com.do_an_tot_nghiep.k28.learning.repository.KhoiPhucChuoiRepository;
import com.do_an_tot_nghiep.k28.learning.repository.SuDungHocNgayRepository;
import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class StreakService {

    public static final int LUOT_TOI_THIEU_CHUOI = 5;
    public static final int KHOI_PHUC_MOI_THANG = 5;
    static final int SO_NGAY_TOI_DA = 1000;

    private final SuDungHocNgayRepository usage;
    private final KhoiPhucChuoiRepository restores;
    private final AccountService accountService;
    private final Clock clock;

    @Transactional(readOnly = true)
    public StreakCalculator.Result of(Long userId, LocalDate homNay) {
        return StreakCalculator.calculate(days(userId), restores.days(userId), homNay);
    }

    @Transactional(readOnly = true)
    public ChuoiNgayResponse status(Long userId) {
        return build(userId, today(userId));
    }

    @Transactional
    public ChuoiNgayResponse restore(Long userId) {
        LocalDate homNay = today(userId);
        StreakCalculator.RestorePlan plan = StreakCalculator.restorePlan(days(userId), restores.days(userId), homNay);
        if (!plan.coThe()) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Chuỗi của bạn đang ổn, chưa cần khôi phục");
        }
        LocalDate thang = homNay.withDayOfMonth(1);
        long daDung = restores.countByNguoiDungIdAndThang(userId, thang);
        long conLai = Math.max(0, KHOI_PHUC_MOI_THANG - daDung);
        if (plan.ngayCanBu().size() > conLai) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, conLai == 0
                    ? "Tháng này bạn đã dùng hết " + KHOI_PHUC_MOI_THANG + " lượt khôi phục"
                    : "Cần " + plan.ngayCanBu().size() + " lượt nhưng tháng này chỉ còn " + conLai + " lượt");
        }
        try {
            restores.saveAllAndFlush(plan.ngayCanBu().stream().map(day -> KhoiPhucChuoi.of(userId, day, thang)).toList());
        } catch (DataIntegrityViolationException e) {
            throw new ApiException(ErrorCode.CONFLICT, "Chuỗi vừa được khôi phục, hãy tải lại");
        }
        if (restores.countByNguoiDungIdAndThang(userId, thang) > KHOI_PHUC_MOI_THANG) {
            throw new ApiException(ErrorCode.CONFLICT, "Tháng này bạn đã dùng hết lượt khôi phục");
        }
        return build(userId, homNay);
    }

    private ChuoiNgayResponse build(Long userId, LocalDate homNay) {
        List<LocalDate> days = days(userId);
        List<LocalDate> covered = restores.days(userId);
        StreakCalculator.Result result = StreakCalculator.calculate(days, covered, homNay);
        StreakCalculator.RestorePlan plan = StreakCalculator.restorePlan(days, covered, homNay);
        Set<LocalDate> qualified = new HashSet<>(days);
        Set<LocalDate> bridged = new HashSet<>(covered);
        List<NgayChuoiResponse> week = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate day = homNay.minusDays(i);
            TrangThaiNgayChuoi trangThai = qualified.contains(day) ? TrangThaiNgayChuoi.HOC
                    : bridged.contains(day) ? TrangThaiNgayChuoi.KHOI_PHUC
                    : result.ngayNghi().contains(day) ? TrangThaiNgayChuoi.NGHI
                    : day.equals(homNay) ? TrangThaiNgayChuoi.CHUA_HOC
                    : TrangThaiNgayChuoi.LO;
            week.add(new NgayChuoiResponse(day, trangThai));
        }
        int daDung = (int) restores.countByNguoiDungIdAndThang(userId, homNay.withDayOfMonth(1));
        int conLai = Math.max(0, KHOI_PHUC_MOI_THANG - daDung);
        KhoiPhucChuoiResponse khoiPhuc = new KhoiPhucChuoiResponse(
                KHOI_PHUC_MOI_THANG,
                daDung,
                conLai,
                plan.coThe(),
                plan.coThe() && plan.ngayCanBu().size() <= conLai,
                plan.coThe() ? plan.chuoiSauKhoiPhuc() : result.chuoiNgay(),
                plan.coThe() ? plan.ngayCanBu() : List.of());
        int luotHomNay = usage.findByNguoiDungIdAndNgayDiaPhuong(userId, homNay).map(SuDungHocNgay::getSoLuotHopLe).orElse(0);
        return new ChuoiNgayResponse(homNay, result.chuoiNgay(), result.homNayDaTinhChuoi(), LUOT_TOI_THIEU_CHUOI, luotHomNay, week, khoiPhuc);
    }

    private List<LocalDate> days(Long userId) {
        return usage.qualifyingDays(userId, LUOT_TOI_THIEU_CHUOI, PageRequest.ofSize(SO_NGAY_TOI_DA));
    }

    private LocalDate today(Long userId) {
        return LocalDate.ofInstant(clock.instant(), accountService.zoneOf(userId));
    }
}
