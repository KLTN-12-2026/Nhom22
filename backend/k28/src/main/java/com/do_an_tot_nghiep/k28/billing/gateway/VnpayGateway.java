package com.do_an_tot_nghiep.k28.billing.gateway;

import com.do_an_tot_nghiep.k28.billing.config.BillingProperties;
import com.do_an_tot_nghiep.k28.billing.entity.GiaoDichThanhToan;
import com.do_an_tot_nghiep.k28.billing.entity.enums.CongThanhToan;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.billing.provider", havingValue = "vnpay")
public class VnpayGateway implements PaymentGateway {

    private final BillingProperties.Vnpay vnpay;
    private final VnpaySigner signer;

    public VnpayGateway(BillingProperties props) {
        this.vnpay = props.vnpay();
        if (blank(vnpay.tmnCode()) || blank(vnpay.hashSecret()) || blank(vnpay.payUrl()) || blank(vnpay.returnUrl())) {
            throw new IllegalStateException(
                    "VNPAY_TMN_CODE, VNPAY_HASH_SECRET, VNPAY_PAY_URL and VNPAY_RETURN_URL are required when app.billing.provider=vnpay");
        }
        this.signer = new VnpaySigner(vnpay.hashSecret());
    }

    @Override
    public CongThanhToan cong() {
        return CongThanhToan.VNPAY;
    }

    @Override
    public String taoUrl(GiaoDichThanhToan giaoDich, String ipKhach, Instant hetHanAt) {
        Map<String, String> thamSo = new HashMap<>();
        thamSo.put("vnp_Version", "2.1.0");
        thamSo.put("vnp_Command", "pay");
        thamSo.put("vnp_TmnCode", vnpay.tmnCode());
        thamSo.put("vnp_Amount", String.valueOf(giaoDich.getSoTien() * 100));
        thamSo.put("vnp_CurrCode", "VND");
        thamSo.put("vnp_TxnRef", giaoDich.getMaDon());
        thamSo.put("vnp_OrderInfo", "Thanh toan goi " + giaoDich.getGoiMa() + " " + giaoDich.getChuKy() + " " + giaoDich.getMaDon());
        thamSo.put("vnp_OrderType", "other");
        thamSo.put("vnp_Locale", "vn");
        thamSo.put("vnp_ReturnUrl", vnpay.returnUrl());
        thamSo.put("vnp_IpAddr", ipKhach);
        thamSo.put("vnp_CreateDate", VnpaySigner.ngay(giaoDich.getTaoAt()));
        thamSo.put("vnp_ExpireDate", VnpaySigner.ngay(hetHanAt));
        return vnpay.payUrl() + "?" + signer.query(thamSo);
    }

    @Override
    public KetQuaCong xacMinh(Map<String, String> thamSo) {
        return signer.xacMinh(thamSo);
    }

    private static boolean blank(String value) {
        return value == null || value.isBlank();
    }
}
