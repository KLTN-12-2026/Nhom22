package com.do_an_tot_nghiep.k28.billing.service;

import com.do_an_tot_nghiep.k28.billing.config.BillingProperties;
import com.do_an_tot_nghiep.k28.billing.entity.DangKyGoi;
import com.do_an_tot_nghiep.k28.billing.entity.GoiDichVu;
import com.do_an_tot_nghiep.k28.billing.entity.enums.ChuKy;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiDangKy;
import com.do_an_tot_nghiep.k28.billing.repository.DangKyGoiRepository;
import com.do_an_tot_nghiep.k28.billing.repository.GoiDichVuRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import java.time.Clock;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.function.LongSupplier;
import java.util.function.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class EntitlementService {

    static final String GOI_MAC_DINH_KHI_TAT = "PRO";
    private static final Locale VI = Locale.forLanguageTag("vi-VN");

    private final DangKyGoiRepository dangKyGoi;
    private final GoiDichVuRepository goiDichVu;
    private final BillingProperties props;
    private final Clock clock;

    @Transactional(readOnly = true)
    public Optional<DangKyGoi> current(Long nguoiDungId) {
        Instant now = clock.instant();
        return dangKyGoi.findByNguoiDungIdAndTrangThai(nguoiDungId, TrangThaiDangKy.HIEU_LUC)
                .filter(dangKy -> dangKy.hieuLucLuc(now));
    }

    @Transactional(readOnly = true)
    public Optional<GoiDichVu> plan(Long nguoiDungId) {
        Optional<String> goiMa = current(nguoiDungId).map(DangKyGoi::getGoiMa);
        if (goiMa.isEmpty() && !props.enforce()) {
            goiMa = Optional.of(GOI_MAC_DINH_KHI_TAT);
        }
        return goiMa.flatMap(goiDichVu::findByMa);
    }

    @Transactional(readOnly = true)
    public void requireCardCapacity(Long nguoiDungId, long soTheThem, LongSupplier soTheHienCo) {
        if (soTheThem <= 0) {
            return;
        }
        plan(nguoiDungId).ifPresent(goi -> {
            Integer gioiHan = goi.getGioiHanThe();
            if (gioiHan == null) {
                return;
            }
            long hienCo = soTheHienCo.getAsLong();
            long canCo = hienCo + soTheThem;
            if (canCo <= gioiHan) {
                return;
            }
            Optional<GoiDichVu> nangCap = upgrade(goi, g -> g.getGioiHanThe() == null || g.getGioiHanThe() >= canCo);
            String loiKhuyen = nangCap
                    .map(g -> " Xóa bớt thẻ hoặc mua gói " + g.getTen() + " sau khi gói hiện tại hết hạn.")
                    .orElse(" Xóa bớt thẻ để thêm thẻ mới.");
            throw denied("GIOI_HAN_THE", nangCap, "Gói " + goi.getTen() + " cho phép tối đa " + number(gioiHan)
                    + " thẻ, bạn đang có " + number(hienCo) + " thẻ nên không thêm được " + number(soTheThem)
                    + " thẻ." + loiKhuyen, Map.of("gioiHanThe", gioiHan, "soTheHienCo", hienCo));
        });
    }

    @Transactional(readOnly = true)
    public void requirePronunciation(Long nguoiDungId) {
        plan(nguoiDungId).filter(goi -> !goi.isPhatAm()).ifPresent(goi -> {
            Optional<GoiDichVu> nangCap = upgrade(goi, GoiDichVu::isPhatAm);
            throw denied("PHAT_AM", nangCap, "Gói " + goi.getTen() + " chưa có đánh giá phát âm"
                    + nangCap.map(g -> ". Gói " + g.getTen() + " có tính năng này").orElse(""), Map.of());
        });
    }

    @Transactional(readOnly = true)
    public void requirePremiumSamples(Long nguoiDungId) {
        plan(nguoiDungId).filter(goi -> !goi.isBoMauCaoCap()).ifPresent(goi -> {
            Optional<GoiDichVu> nangCap = upgrade(goi, GoiDichVu::isBoMauCaoCap);
            throw denied("BO_MAU_CAO_CAP", nangCap, "Bộ mẫu cao cấp chỉ dành cho gói "
                    + nangCap.map(GoiDichVu::getTen).orElse("cao hơn") + ". Gói " + goi.getTen()
                    + " vẫn sao chép được các bộ mẫu khác", Map.of());
        });
    }

    @Transactional(readOnly = true)
    public Optional<DangKyGoi> latest(Long nguoiDungId) {
        return current(nguoiDungId)
                .or(() -> dangKyGoi.findFirstByNguoiDungIdOrderByIdDesc(nguoiDungId));
    }

    @Transactional(propagation = Propagation.MANDATORY)
    public DangKyGoi activate(Long nguoiDungId, String goiMa, ChuKy chuKy, Instant now) {
        Optional<DangKyGoi> hienTai = dangKyGoi.findForUpdateByNguoiDungIdAndTrangThai(nguoiDungId, TrangThaiDangKy.HIEU_LUC);
        if (hienTai.isPresent()) {
            DangKyGoi dangKy = hienTai.get();
            if (dangKy.getHetHanAt().isAfter(now)) {
                if (!dangKy.getGoiMa().equals(goiMa)) {
                    throw new IllegalStateException("User " + nguoiDungId + " paid " + goiMa
                            + " while plan " + dangKy.getGoiMa() + " is active");
                }
                dangKy.giaHan(plus(dangKy.getHetHanAt(), chuKy));
                return dangKy;
            }
            dangKy.hetHan();
            dangKyGoi.saveAndFlush(dangKy);
        }
        return dangKyGoi.save(DangKyGoi.moi(nguoiDungId, goiMa, now, plus(now, chuKy)));
    }

    private Optional<GoiDichVu> upgrade(GoiDichVu hienTai, Predicate<GoiDichVu> du) {
        return goiDichVu.findByHoatDongTrueOrderByGiaThangAsc().stream()
                .filter(goi -> !goi.getMa().equals(hienTai.getMa()))
                .filter(du)
                .findFirst();
    }

    private static ApiException denied(String quyenLoi, Optional<GoiDichVu> nangCap, String message,
                                       Map<String, Object> them) {
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("quyenLoi", quyenLoi);
        details.put("goiCanNangCap", nangCap.map(GoiDichVu::getMa).orElse(null));
        details.putAll(them);
        return new ApiException(ErrorCode.BUSINESS_RULE, message, details);
    }

    private static String number(long value) {
        return String.format(VI, "%,d", value);
    }

    private Instant plus(Instant from, ChuKy chuKy) {
        ZonedDateTime local = from.atZone(props.businessZone());
        return (chuKy == ChuKy.NAM ? local.plusYears(1) : local.plusMonths(1)).toInstant();
    }
}
