package com.do_an_tot_nghiep.k28.billing.service;

import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.billing.config.BillingProperties;
import com.do_an_tot_nghiep.k28.billing.dto.CheckoutRequest;
import com.do_an_tot_nghiep.k28.billing.dto.CheckoutResponse;
import com.do_an_tot_nghiep.k28.billing.dto.PlanResponse;
import com.do_an_tot_nghiep.k28.billing.dto.SubscriptionResponse;
import com.do_an_tot_nghiep.k28.billing.dto.TransactionQuery;
import com.do_an_tot_nghiep.k28.billing.dto.TransactionResponse;
import com.do_an_tot_nghiep.k28.billing.entity.DangKyGoi;
import com.do_an_tot_nghiep.k28.billing.entity.GiaoDichThanhToan;
import com.do_an_tot_nghiep.k28.billing.entity.GoiDichVu;
import com.do_an_tot_nghiep.k28.billing.entity.enums.CongThanhToan;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich;
import com.do_an_tot_nghiep.k28.billing.gateway.PaymentGateway;
import com.do_an_tot_nghiep.k28.billing.mapper.BillingMapper;
import com.do_an_tot_nghiep.k28.billing.repository.GiaoDichThanhToanRepository;
import com.do_an_tot_nghiep.k28.billing.repository.GoiDichVuRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.quota.QuotaService;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.common.quota.entity.enums.LoaiDichVu;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BillingService {

    private static final String KY_TU_MA = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final DateTimeFormatter NGAY_MA = DateTimeFormatter.ofPattern("yyyyMMdd");
    private static final DateTimeFormatter NGAY_HIEN_THI = DateTimeFormatter.ofPattern("HH:mm dd/MM/yyyy");

    private final GoiDichVuRepository goiDichVu;
    private final GiaoDichThanhToanRepository giaoDich;
    private final EntitlementService entitlements;
    private final PaymentGateway gateway;
    private final QuotaService quota;
    private final AccountService accounts;
    private final BillingMapper mapper;
    private final ReceiptRenderer receipts;
    private final BillingProperties props;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<PlanResponse> plans() {
        return goiDichVu.findByHoatDongTrueOrderByGiaThangAsc().stream()
                .map(goi -> {
                    Map<LoaiDichVu, Integer> hanMuc = quota.hanMucNgay(goi.getMa());
                    return mapper.toResponse(goi, hanMuc.get(LoaiDichVu.AI), hanMuc.get(LoaiDichVu.ANH),
                            hanMuc.get(LoaiDichVu.PHAT_AM));
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public SubscriptionResponse subscription(Long nguoiDungId) {
        Instant now = clock.instant();
        return entitlements.latest(nguoiDungId)
                .map(dangKy -> {
                    boolean hieuLuc = dangKy.hieuLucLuc(now);
                    Long soNgay = hieuLuc ? soNgayConLai(dangKy, accounts.zoneOf(nguoiDungId), now) : null;
                    return new SubscriptionResponse(dangKy.getGoiMa(), tenGoi(dangKy.getGoiMa()),
                            hieuLuc ? "HIEU_LUC" : "HET_HAN", dangKy.getBatDauAt(), dangKy.getHetHanAt(), soNgay);
                })
                .orElseGet(() -> new SubscriptionResponse(null, null, "CHUA_CO_GOI", null, null, null));
    }

    @Transactional
    public CheckoutResponse checkout(Long nguoiDungId, CheckoutRequest request, String ipKhach) {
        GoiDichVu goi = goiDichVu.findByMaAndHoatDongTrue(request.goiMa())
                .orElseThrow(() -> new ApiException(ErrorCode.BUSINESS_RULE, "goiMa",
                        "Gói không tồn tại hoặc đã ngừng bán"));
        Instant now = clock.instant();
        entitlements.current(nguoiDungId)
                .filter(dangKy -> !dangKy.getGoiMa().equals(goi.getMa()))
                .ifPresent(dangKy -> {
                    throw new ApiException(ErrorCode.BUSINESS_RULE, "goiMa", "Bạn đang dùng gói "
                            + tenGoi(dangKy.getGoiMa()) + " đến "
                            + NGAY_HIEN_THI.format(dangKy.getHetHanAt().atZone(accounts.zoneOf(nguoiDungId)))
                            + ". Hệ thống không đổi gói giữa kỳ, bạn có thể mua gói khác sau khi gói hiện tại hết hạn");
                });
        if (giaoDich.existsByNguoiDungIdAndTrangThaiAndGoiMaNotAndTaoAtAfter(nguoiDungId,
                TrangThaiGiaoDich.CHO_THANH_TOAN, goi.getMa(), now.minus(props.orderTtl()))) {
            throw new ApiException(ErrorCode.CONFLICT,
                    "Bạn đang có đơn thanh toán gói khác chưa hoàn tất. Hãy hoàn tất đơn đó hoặc thử lại sau 15 phút");
        }
        GiaoDichThanhToan don = giaoDich.save(GiaoDichThanhToan.builder()
                .maDon(maDon(now))
                .nguoiDungId(nguoiDungId)
                .goiMa(goi.getMa())
                .chuKy(request.chuKy())
                .soTien(goi.gia(request.chuKy()))
                .cong(gateway.cong())
                .trangThai(TrangThaiGiaoDich.CHO_THANH_TOAN)
                .taoAt(now)
                .build());
        Instant hanThanhToan = now.plus(props.orderTtl());
        return new CheckoutResponse(don.getMaDon(), gateway.taoUrl(don, ipKhach, hanThanhToan), don.getSoTien(),
                hanThanhToan, don.getCong() == CongThanhToan.MO_PHONG);
    }

    @Transactional
    public TransactionResponse transaction(Long nguoiDungId, String maDon) {
        Instant now = clock.instant();
        giaoDich.hetHanNeuQuaHan(maDon, now.minus(props.orderTtl()), now);
        GiaoDichThanhToan don = giaoDich.findByMaDonAndNguoiDungId(maDon, nguoiDungId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy đơn thanh toán"));
        return mapper.toResponse(don, tenGoi(don.getGoiMa()));
    }

    @Transactional
    public PageResponse<TransactionResponse> transactions(Long nguoiDungId, TransactionQuery query) {
        Instant now = clock.instant();
        giaoDich.hetHanQuaHanCuaNguoiDung(nguoiDungId, now.minus(props.orderTtl()), now);
        PageRequest pageable = PageRequest.of(query.page(), query.size(),
                Sort.by(Sort.Order.desc("taoAt"), Sort.Order.desc("id")));
        Map<String, String> tenGoi = goiDichVu.findAll().stream()
                .collect(Collectors.toMap(GoiDichVu::getMa, GoiDichVu::getTen));
        return PageResponse.of((query.trangThai() == null
                ? giaoDich.findByNguoiDungId(nguoiDungId, pageable)
                : giaoDich.findByNguoiDungIdAndTrangThai(nguoiDungId, query.trangThai(), pageable))
                .map(don -> mapper.toResponse(don, tenGoi.getOrDefault(don.getGoiMa(), don.getGoiMa()))));
    }

    @Transactional(readOnly = true)
    public String receipt(Long nguoiDungId, String maDon) {
        GiaoDichThanhToan don = giaoDich.findByMaDonAndNguoiDungId(maDon, nguoiDungId)
                .orElseThrow(() -> new ApiException(ErrorCode.NOT_FOUND, "Không tìm thấy đơn thanh toán"));
        if (don.getTrangThai() != TrangThaiGiaoDich.THANH_CONG) {
            throw new ApiException(ErrorCode.BUSINESS_RULE, "Chỉ giao dịch thành công mới có biên nhận");
        }
        return receipts.render(don, tenGoi(don.getGoiMa()), accounts.me(nguoiDungId));
    }

    private String tenGoi(String goiMa) {
        return goiDichVu.findByMa(goiMa).map(GoiDichVu::getTen).orElse(goiMa);
    }

    private static Long soNgayConLai(DangKyGoi dangKy, ZoneId zone, Instant now) {
        return ChronoUnit.DAYS.between(now.atZone(zone).toLocalDate(), dangKy.getHetHanAt().atZone(zone).toLocalDate());
    }

    private String maDon(Instant now) {
        StringBuilder ma = new StringBuilder("DH").append(NGAY_MA.format(now.atZone(props.businessZone())));
        for (int i = 0; i < 8; i++) {
            ma.append(KY_TU_MA.charAt(RANDOM.nextInt(KY_TU_MA.length())));
        }
        return ma.toString();
    }
}
