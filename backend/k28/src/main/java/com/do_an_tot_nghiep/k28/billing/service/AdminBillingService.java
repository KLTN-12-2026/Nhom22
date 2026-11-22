package com.do_an_tot_nghiep.k28.billing.service;

import com.do_an_tot_nghiep.k28.common.realtime.LoaiSuKien;
import com.do_an_tot_nghiep.k28.common.realtime.RealtimeService;
import com.do_an_tot_nghiep.k28.account.dto.NotificationContact;
import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.admin.entity.enums.HanhDongQuanTri;
import com.do_an_tot_nghiep.k28.admin.entity.enums.LoaiDoiTuong;
import com.do_an_tot_nghiep.k28.admin.service.AuditService;
import com.do_an_tot_nghiep.k28.billing.config.BillingProperties;
import com.do_an_tot_nghiep.k28.billing.dto.AdminPaymentDetailResponse;
import com.do_an_tot_nghiep.k28.billing.dto.AdminPaymentQuery;
import com.do_an_tot_nghiep.k28.billing.dto.AdminPaymentResponse;
import com.do_an_tot_nghiep.k28.billing.dto.AdminPlanResponse;
import com.do_an_tot_nghiep.k28.billing.dto.AdminSubscriptionQuery;
import com.do_an_tot_nghiep.k28.billing.dto.AdminSubscriptionResponse;
import com.do_an_tot_nghiep.k28.billing.dto.ExpiryCheckRequest;
import com.do_an_tot_nghiep.k28.billing.dto.ExpiryCheckResponse;
import com.do_an_tot_nghiep.k28.billing.dto.UpdateExpiryRequest;
import com.do_an_tot_nghiep.k28.billing.dto.UpdatePlanRequest;
import com.do_an_tot_nghiep.k28.billing.entity.DangKyGoi;
import com.do_an_tot_nghiep.k28.billing.entity.GiaoDichThanhToan;
import com.do_an_tot_nghiep.k28.billing.entity.GoiDichVu;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiDangKy;
import com.do_an_tot_nghiep.k28.billing.repository.DangKyGoiRepository;
import com.do_an_tot_nghiep.k28.billing.repository.GiaoDichThanhToanRepository;
import com.do_an_tot_nghiep.k28.billing.repository.GoiDichVuRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeMap;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

@Service
@RequiredArgsConstructor
public class AdminBillingService {

    private static final Set<String> KHOA_AN = Set.of("vnp_SecureHash", "vnp_SecureHashType");

    private final GiaoDichThanhToanRepository giaoDich;
    private final DangKyGoiRepository dangKyGoi;
    private final GoiDichVuRepository goiDichVu;
    private final AccountService accounts;
    private final AuditService audit;
    private final SubscriptionExpiryService expiry;
    private final BillingProperties props;
    private final JsonMapper json;
    private final Clock clock;
    private final TransactionTemplate tx;
    private final RealtimeService realtime;

    @Transactional(readOnly = true)
    public PageResponse<AdminPaymentResponse> payments(AdminPaymentQuery query) {
        ZoneId zone = props.businessZone();
        Instant tu = query.tuNgay() == null ? null : query.tuNgay().atStartOfDay(zone).toInstant();
        Instant den = query.denNgay() == null ? null : query.denNgay().plusDays(1).atStartOfDay(zone).toInstant();
        var page = giaoDich.adminSearch(query.trangThai(), query.goiMa(), tu, den, like(query.email()),
                PageRequest.of(query.page(), query.size(), Sort.by(Sort.Order.desc("taoAt"), Sort.Order.desc("id"))));
        Map<Long, NotificationContact> contacts = accounts.contacts(
                page.getContent().stream().map(GiaoDichThanhToan::getNguoiDungId).distinct().toList());
        Map<String, String> ten = planNames();
        return PageResponse.of(page.map(don -> toPayment(don, contacts.get(don.getNguoiDungId()), ten)));
    }

    @Transactional(readOnly = true)
    public AdminPaymentDetailResponse payment(String maDon) {
        GiaoDichThanhToan don = giaoDich.findByMaDon(maDon)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy đơn thanh toán"));
        NotificationContact contact = accounts.contacts(List.of(don.getNguoiDungId())).get(don.getNguoiDungId());
        Map<String, String> duLieu = null;
        if (don.getDuLieuCongJson() != null) {
            duLieu = new TreeMap<>(json.readValue(don.getDuLieuCongJson(), new TypeReference<Map<String, String>>() {
            }));
            duLieu.keySet().removeAll(KHOA_AN);
        }
        return new AdminPaymentDetailResponse(toPayment(don, contact, planNames()), duLieu);
    }

    @Transactional(readOnly = true)
    public PageResponse<AdminSubscriptionResponse> subscriptions(AdminSubscriptionQuery query) {
        Instant now = clock.instant();
        TrangThaiDangKy trangThai = query.trangThai();
        Instant tu = null;
        Instant den = null;
        if (query.sapHetHan() != null) {
            trangThai = TrangThaiDangKy.HIEU_LUC;
            tu = now;
            den = now.plus(Duration.ofDays(query.sapHetHan()));
        }
        Sort sort = query.sapHetHan() != null
                ? Sort.by(Sort.Order.asc("hetHanAt"), Sort.Order.asc("id"))
                : Sort.by(Sort.Order.desc("hetHanAt"), Sort.Order.desc("id"));
        var page = dangKyGoi.adminSearch(trangThai, query.goiMa(), tu, den, like(query.email()),
                PageRequest.of(query.page(), query.size(), sort));
        Map<Long, NotificationContact> contacts = accounts.contacts(
                page.getContent().stream().map(DangKyGoi::getNguoiDungId).distinct().toList());
        Map<String, String> ten = planNames();
        return PageResponse.of(page.map(dangKy -> toSubscription(dangKy, contacts.get(dangKy.getNguoiDungId()), ten, now)));
    }

    @Transactional(readOnly = true)
    public List<AdminPlanResponse> plans() {
        Instant now = clock.instant();
        return goiDichVu.findAllByOrderByGiaThangAsc().stream().map(goi -> toPlan(goi, now)).toList();
    }

    @Transactional
    public AdminPlanResponse updatePlan(Long actorId, String ma, UpdatePlanRequest request) {
        GoiDichVu goi = goiDichVu.findByMa(ma)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy gói dịch vụ"));
        if (!Objects.equals(goi.getVersion(), request.version())) {
            throw new ApiException(ErrorCode.VERSION_CONFLICT, "Gói đã được sửa ở nơi khác, vui lòng tải lại");
        }
        if (!request.hoatDong() && goi.isHoatDong() && goiDichVu.countByHoatDongTrueAndMaNot(ma) == 0) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "hoatDong", "Cần ít nhất một gói đang bán");
        }
        Map<String, Object> truoc = planFields(goi);
        goi.capNhat(request.ten(), request.giaThang(), request.giaNam(), request.gioiHanThe(), request.phatAm(),
                request.boMauCaoCap(), request.hoatDong());
        Map<String, Object> sau = planFields(goi);
        truoc.keySet().removeIf(key -> Objects.equals(truoc.get(key), sau.get(key)));
        sau.keySet().retainAll(truoc.keySet());
        if (!truoc.isEmpty()) {
            goiDichVu.saveAndFlush(goi);
            audit.record(actorId, HanhDongQuanTri.SUA_GOI_DICH_VU, LoaiDoiTuong.GOI_DICH_VU, goi.getId(), goi.getMa(),
                    request.lyDo(), truoc, sau);
        }
        return toPlan(goi, clock.instant());
    }

    @Transactional
    public AdminSubscriptionResponse updateExpiry(Long actorId, Long id, UpdateExpiryRequest request) {
        requireDemoTools();
        DangKyGoi dangKy = dangKyGoi.findForUpdate(id)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy đăng ký gói"));
        if (dangKy.getTrangThai() != TrangThaiDangKy.HIEU_LUC) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Chỉ sửa được ngày hết hạn của gói đang hiệu lực");
        }
        if (!Objects.equals(dangKy.getVersion(), request.version())) {
            throw new ApiException(ErrorCode.VERSION_CONFLICT, "Đăng ký đã thay đổi, vui lòng tải lại");
        }
        Instant hetHanMoi = request.hetHanAt().truncatedTo(ChronoUnit.MILLIS);
        if (!hetHanMoi.isAfter(dangKy.getBatDauAt())) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "hetHanAt", "Ngày hết hạn phải sau ngày bắt đầu gói");
        }
        Instant cu = dangKy.getHetHanAt();
        dangKy.doiHetHan(hetHanMoi);
        dangKyGoi.saveAndFlush(dangKy);
        realtime.toUser(dangKy.getNguoiDungId(), LoaiSuKien.GOI_THAY_DOI, null);
        NotificationContact contact = accounts.contacts(List.of(dangKy.getNguoiDungId())).get(dangKy.getNguoiDungId());
        audit.record(actorId, HanhDongQuanTri.SUA_HAN_GOI, LoaiDoiTuong.DANG_KY_GOI, dangKy.getId(),
                (contact == null ? dangKy.getNguoiDungId().toString() : contact.email()) + " — " + dangKy.getGoiMa(),
                request.lyDo(), Map.of("hetHanAt", cu.toString()), Map.of("hetHanAt", hetHanMoi.toString()));
        return toSubscription(dangKy, contact, planNames(), clock.instant());
    }

    public ExpiryCheckResponse runExpiryCheck(Long actorId, ExpiryCheckRequest request) {
        requireDemoTools();
        ExpiryCheckResponse result = expiry.run(clock.instant());
        tx.executeWithoutResult(status -> audit.record(actorId, HanhDongQuanTri.CHAY_KIEM_TRA_HET_HAN,
                LoaiDoiTuong.DANG_KY_GOI, 0L, "SubscriptionExpiryJob", request.lyDo(), null, Map.of(
                        "soNhacSapHetHan", result.soNhacSapHetHan(),
                        "soChuyenHetHan", result.soChuyenHetHan(),
                        "soDonHetHan", result.soDonHetHan())));
        return result;
    }

    private void requireDemoTools() {
        if (!props.demoTools()) {
            throw new ApiException(ErrorCode.NOT_FOUND, "Công cụ demo đang tắt");
        }
    }

    private AdminPaymentResponse toPayment(GiaoDichThanhToan don, NotificationContact contact, Map<String, String> ten) {
        return new AdminPaymentResponse(don.getMaDon(), don.getNguoiDungId().toString(),
                contact == null ? null : contact.email(), don.getGoiMa(),
                ten.getOrDefault(don.getGoiMa(), don.getGoiMa()), don.getChuKy(), don.getSoTien(), don.getCong(),
                don.getTrangThai(), don.getMaGiaoDichCong(), don.getMaPhanHoi(), don.getTaoAt(), don.getHoanTatAt());
    }

    private AdminSubscriptionResponse toSubscription(DangKyGoi dangKy, NotificationContact contact,
                                                     Map<String, String> ten, Instant now) {
        Long soNgay = null;
        if (dangKy.hieuLucLuc(now)) {
            ZoneId zone = contact == null ? props.businessZone() : ZoneId.of(contact.muiGio());
            soNgay = ChronoUnit.DAYS.between(now.atZone(zone).toLocalDate(), dangKy.getHetHanAt().atZone(zone).toLocalDate());
        }
        return new AdminSubscriptionResponse(dangKy.getId().toString(), dangKy.getNguoiDungId().toString(),
                contact == null ? null : contact.email(), contact == null ? null : contact.tenHienThi(),
                dangKy.getGoiMa(), ten.getOrDefault(dangKy.getGoiMa(), dangKy.getGoiMa()), dangKy.getBatDauAt(),
                dangKy.getHetHanAt(), dangKy.getTrangThai(), soNgay, dangKy.getVersion());
    }

    private AdminPlanResponse toPlan(GoiDichVu goi, Instant now) {
        return new AdminPlanResponse(goi.getMa(), goi.getTen(), goi.getGiaThang(), goi.getGiaNam(), goi.getGioiHanThe(),
                goi.isPhatAm(), goi.isBoMauCaoCap(), goi.isHoatDong(),
                dangKyGoi.countByGoiMaAndTrangThaiAndHetHanAtAfter(goi.getMa(), TrangThaiDangKy.HIEU_LUC, now),
                goi.getVersion());
    }

    private static Map<String, Object> planFields(GoiDichVu goi) {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("ten", goi.getTen());
        fields.put("giaThang", goi.getGiaThang());
        fields.put("giaNam", goi.getGiaNam());
        fields.put("gioiHanThe", goi.getGioiHanThe());
        fields.put("phatAm", goi.isPhatAm());
        fields.put("boMauCaoCap", goi.isBoMauCaoCap());
        fields.put("hoatDong", goi.isHoatDong());
        return fields;
    }

    private Map<String, String> planNames() {
        return goiDichVu.findAll().stream().collect(Collectors.toMap(GoiDichVu::getMa, GoiDichVu::getTen));
    }

    private static String like(String email) {
        if (email == null) {
            return null;
        }
        return "%" + email.toLowerCase(Locale.ROOT).replace("!", "!!").replace("%", "!%").replace("_", "!_") + "%";
    }
}
