package com.do_an_tot_nghiep.k28.account.service;

import com.do_an_tot_nghiep.k28.account.dto.ChooseThemeRequest;
import com.do_an_tot_nghiep.k28.account.dto.ThemeCatalogResponse;
import com.do_an_tot_nghiep.k28.account.dto.ThemeEventRequest;
import com.do_an_tot_nghiep.k28.account.dto.ThemeEventResponse;
import com.do_an_tot_nghiep.k28.account.dto.ThemeResponse;
import com.do_an_tot_nghiep.k28.account.entity.GiaoDien;
import com.do_an_tot_nghiep.k28.account.entity.HoSoHocTap;
import com.do_an_tot_nghiep.k28.account.entity.LichLeGiaoDien;
import com.do_an_tot_nghiep.k28.account.mapper.ThemeMapper;
import com.do_an_tot_nghiep.k28.account.repository.GiaoDienRepository;
import com.do_an_tot_nghiep.k28.account.repository.HoSoHocTapRepository;
import com.do_an_tot_nghiep.k28.account.repository.LichLeGiaoDienRepository;
import com.do_an_tot_nghiep.k28.billing.service.EntitlementService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import com.do_an_tot_nghiep.k28.account.entity.enums.NhomGiaoDien;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ThemeService {

    public static final String MAC_DINH = "MAC_DINH";
    private static final List<String> THU_HANG_GOI = List.of("FREE", "PRO", "PREMIUM");
    private static final DateTimeFormatter NGAY = DateTimeFormatter.ofPattern("dd/MM");

    private final GiaoDienRepository themes;
    private final LichLeGiaoDienRepository events;
    private final HoSoHocTapRepository profiles;
    private final EntitlementService entitlements;
    private final AccountService accounts;
    private final ThemeMapper mapper;
    private final Clock clock;

    @Transactional(readOnly = true)
    public ThemeCatalogResponse catalog(Long userId) {
        String goiMa = entitlements.planCode(userId).orElse("FREE");
        LocalDate homNay = LocalDate.now(clock.withZone(accounts.zoneOf(userId)));
        String chon = profiles.findById(userId).map(HoSoHocTap::getGiaoDienMa).orElse(null);
        return build(goiMa, homNay, chon);
    }

    @Transactional
    public ThemeCatalogResponse choose(Long userId, ChooseThemeRequest request) {
        GiaoDien theme = themes.findById(request.giaoDienMa())
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "giaoDienMa", "Không tìm thấy giao diện"));
        String goiMa = entitlements.planCode(userId).orElse("FREE");
        LocalDate homNay = LocalDate.now(clock.withZone(accounts.zoneOf(userId)));
        LichLeGiaoDien leHoi = eventsByTheme(homNay).get(theme.getMa());
        String lyDo = lockReason(theme, goiMa, leHoi, homNay);
        if (lyDo != null) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "giaoDienMa", lyDo);
        }
        HoSoHocTap profile = profiles.findById(userId).orElseGet(() -> HoSoHocTap.defaultFor(userId));
        if (profile.chooseTheme(MAC_DINH.equals(theme.getMa()) ? null : theme.getMa())) {
            profiles.saveAndFlush(profile);
        }
        return build(goiMa, homNay, profile.getGiaoDienMa());
    }

    @Transactional(readOnly = true)
    public List<ThemeEventResponse> adminEvents(Long adminId) {
        LocalDate homNay = LocalDate.now(clock.withZone(accounts.zoneOf(adminId)));
        return events.findAllByOrderByNgayLeDesc().stream()
                .map(lich -> mapper.toResponse(lich, homNay))
                .toList();
    }

    @Transactional
    public ThemeEventResponse createEvent(Long adminId, ThemeEventRequest request) {
        festivalTheme(request.giaoDienMa());
        if (events.existsByGiaoDienMaAndNgayLe(request.giaoDienMa(), request.ngayLe())) {
            throw new ApiException(ErrorCode.CONFLICT, "ngayLe", "Lễ này đã có trong lịch");
        }
        try {
            LichLeGiaoDien lich = events.saveAndFlush(LichLeGiaoDien.of(
                    request.giaoDienMa(), request.ngayLe(), request.soNgayTruoc(), request.soNgaySau()));
            return mapper.toResponse(lich, LocalDate.now(clock.withZone(accounts.zoneOf(adminId))));
        } catch (DataIntegrityViolationException duplicate) {
            throw new ApiException(ErrorCode.CONFLICT, "ngayLe", "Lễ này đã có trong lịch");
        }
    }

    @Transactional
    public ThemeEventResponse updateEvent(Long adminId, Long id, ThemeEventRequest request) {
        LichLeGiaoDien lich = events.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy lịch lễ"));
        if (!lich.getGiaoDienMa().equals(request.giaoDienMa())) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "giaoDienMa", "Không đổi được giao diện của lịch lễ");
        }
        if (!lich.getNgayLe().equals(request.ngayLe())
                && events.existsByGiaoDienMaAndNgayLe(request.giaoDienMa(), request.ngayLe())) {
            throw new ApiException(ErrorCode.CONFLICT, "ngayLe", "Lễ này đã có trong lịch");
        }
        lich.update(request.ngayLe(), request.soNgayTruoc(), request.soNgaySau());
        return mapper.toResponse(events.saveAndFlush(lich), LocalDate.now(clock.withZone(accounts.zoneOf(adminId))));
    }

    @Transactional
    public void deleteEvent(Long id) {
        LichLeGiaoDien lich = events.findById(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy lịch lễ"));
        events.delete(lich);
    }

    private void festivalTheme(String ma) {
        GiaoDien theme = themes.findById(ma)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "giaoDienMa", "Không tìm thấy giao diện"));
        if (theme.getNhom() != NhomGiaoDien.LE_HOI) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "giaoDienMa", "Chỉ giao diện lễ hội mới có lịch lễ");
        }
    }

    private ThemeCatalogResponse build(String goiMa, LocalDate homNay, String chon) {
        Map<String, LichLeGiaoDien> leHoi = eventsByTheme(homNay);
        List<ThemeResponse> danhSach = themes.findAllByOrderByThuTuAsc().stream()
                .map(theme -> {
                    LichLeGiaoDien lich = leHoi.get(theme.getMa());
                    String lyDo = lockReason(theme, goiMa, lich, homNay);
                    return mapper.toResponse(theme, lyDo == null, lyDo, mapper.toResponse(lich, homNay));
                })
                .toList();
        String dangDung = danhSach.stream()
                .filter(theme -> theme.ma().equals(chon) && theme.duocDung())
                .map(ThemeResponse::ma)
                .findFirst()
                .orElse(MAC_DINH);
        return new ThemeCatalogResponse(dangDung, goiMa, danhSach);
    }

    private Map<String, LichLeGiaoDien> eventsByTheme(LocalDate homNay) {
        return events.findNear(homNay.minusDays(31), homNay.plusDays(400)).stream()
                .filter(lich -> !homNay.isAfter(lich.denHet()))
                .collect(Collectors.toMap(
                        LichLeGiaoDien::getGiaoDienMa,
                        Function.identity(),
                        (a, b) -> pickEvent(a, b, homNay)));
    }

    private static LichLeGiaoDien pickEvent(LichLeGiaoDien a, LichLeGiaoDien b, LocalDate homNay) {
        if (a.dangMo(homNay) != b.dangMo(homNay)) {
            return a.dangMo(homNay) ? a : b;
        }
        return Comparator.comparing(LichLeGiaoDien::getNgayLe).compare(a, b) <= 0 ? a : b;
    }

    static String lockReason(GiaoDien theme, String goiMa, LichLeGiaoDien leHoi, LocalDate homNay) {
        if (rank(goiMa) >= rank(theme.getGoiToiThieu())) {
            return null;
        }
        if (leHoi != null && leHoi.dangMo(homNay)) {
            return null;
        }
        if (leHoi != null) {
            return "Mở cho mọi người từ " + leHoi.moTu().format(NGAY) + ", hoặc dùng ngay với gói Premium";
        }
        return "Cần gói " + planName(theme.getGoiToiThieu());
    }

    private static int rank(String goiMa) {
        int index = THU_HANG_GOI.indexOf(goiMa);
        return Math.max(index, 0);
    }

    private static String planName(String goiMa) {
        return "PREMIUM".equals(goiMa) ? "Premium" : "PRO".equals(goiMa) ? "Pro" : goiMa;
    }
}
