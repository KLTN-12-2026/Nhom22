package com.do_an_tot_nghiep.k28.billing.service;

import com.do_an_tot_nghiep.k28.common.realtime.LoaiSuKien;
import com.do_an_tot_nghiep.k28.common.realtime.RealtimeService;
import com.do_an_tot_nghiep.k28.billing.config.BillingProperties;
import com.do_an_tot_nghiep.k28.billing.entity.GiaoDichThanhToan;
import com.do_an_tot_nghiep.k28.billing.entity.enums.TrangThaiGiaoDich;
import com.do_an_tot_nghiep.k28.billing.gateway.KetQuaCong;
import com.do_an_tot_nghiep.k28.billing.gateway.PaymentGateway;
import com.do_an_tot_nghiep.k28.billing.repository.GiaoDichThanhToanRepository;
import java.time.Clock;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.TreeMap;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentConfirmationService {

    public enum KetQuaXacNhan {
        DA_GHI_NHAN("00", "Confirm Success"),
        KHONG_THAY_DON("01", "Order not found"),
        DA_XAC_NHAN_TRUOC("02", "Order already confirmed"),
        SAI_SO_TIEN("04", "invalid amount"),
        SAI_CHU_KY("97", "Invalid signature"),
        LOI_KHAC("99", "Unknown error");

        public final String rspCode;
        public final String message;

        KetQuaXacNhan(String rspCode, String message) {
            this.rspCode = rspCode;
            this.message = message;
        }
    }

    public record XacNhan(KetQuaXacNhan ketQua, String maDon) {
    }

    private final GiaoDichThanhToanRepository giaoDich;
    private final EntitlementService entitlements;
    private final PaymentGateway gateway;
    private final BillingProperties props;
    private final JsonMapper jsonMapper;
    private final Clock clock;
    private final RealtimeService realtime;

    @Transactional
    public XacNhan confirm(Map<String, String> thamSo) {
        KetQuaCong cong = gateway.xacMinh(thamSo);
        if (!cong.chuKyHopLe()) {
            return new XacNhan(KetQuaXacNhan.SAI_CHU_KY, null);
        }
        Optional<GiaoDichThanhToan> tim = cong.maDon() == null ? Optional.empty() : giaoDich.findForUpdateByMaDon(cong.maDon());
        if (tim.isEmpty()) {
            return new XacNhan(KetQuaXacNhan.KHONG_THAY_DON, null);
        }
        GiaoDichThanhToan don = tim.get();
        if (don.getSoTien() != cong.soTien()) {
            log.warn("Payment amount mismatch for order {}", don.getMaDon());
            return new XacNhan(KetQuaXacNhan.SAI_SO_TIEN, don.getMaDon());
        }
        if (don.getTrangThai() != TrangThaiGiaoDich.CHO_THANH_TOAN) {
            return new XacNhan(KetQuaXacNhan.DA_XAC_NHAN_TRUOC, don.getMaDon());
        }
        Instant now = clock.instant();
        String duLieu = jsonMapper.writeValueAsString(new TreeMap<>(thamSo));
        if (!now.isBefore(don.getTaoAt().plus(props.orderTtl()))) {
            log.warn("Payment callback for expired order {} with response {}", don.getMaDon(), cong.maPhanHoi());
            don.ketThuc(TrangThaiGiaoDich.HET_HAN, cong.maGiaoDichCong(), cong.maPhanHoi(), duLieu, now);
            realtime.toUser(don.getNguoiDungId(), LoaiSuKien.THANH_TOAN, don.getMaDon());
            return new XacNhan(KetQuaXacNhan.DA_GHI_NHAN, don.getMaDon());
        }
        if (cong.thanhCong()) {
            don.ketThuc(TrangThaiGiaoDich.THANH_CONG, cong.maGiaoDichCong(), cong.maPhanHoi(), duLieu, now);
            entitlements.activate(don.getNguoiDungId(), don.getGoiMa(), don.getChuKy(), now, don.isNangCap());
        } else {
            don.ketThuc(TrangThaiGiaoDich.THAT_BAI, cong.maGiaoDichCong(), cong.maPhanHoi(), duLieu, now);
        }
        realtime.toUser(don.getNguoiDungId(), LoaiSuKien.THANH_TOAN, don.getMaDon());
        return new XacNhan(KetQuaXacNhan.DA_GHI_NHAN, don.getMaDon());
    }
}
