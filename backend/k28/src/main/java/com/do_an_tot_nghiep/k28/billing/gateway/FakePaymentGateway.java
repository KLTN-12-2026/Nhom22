package com.do_an_tot_nghiep.k28.billing.gateway;

import com.do_an_tot_nghiep.k28.billing.config.BillingProperties;
import com.do_an_tot_nghiep.k28.billing.entity.GiaoDichThanhToan;
import com.do_an_tot_nghiep.k28.billing.entity.enums.CongThanhToan;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "app.billing.provider", havingValue = "fake", matchIfMissing = true)
public class FakePaymentGateway implements PaymentGateway {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final String returnUrl;
    private final boolean thanhCong;
    private final VnpaySigner signer;

    public FakePaymentGateway(BillingProperties props) {
        this.returnUrl = props.vnpay().returnUrl();
        this.thanhCong = !"THAT_BAI".equals(props.fake().ketQua());
        String secret = props.fake().hashSecret();
        if (secret == null || secret.isBlank()) {
            byte[] random = new byte[32];
            RANDOM.nextBytes(random);
            secret = HexFormat.of().formatHex(random);
        }
        this.signer = new VnpaySigner(secret);
    }

    @Override
    public CongThanhToan cong() {
        return CongThanhToan.MO_PHONG;
    }

    @Override
    public String taoUrl(GiaoDichThanhToan giaoDich, String ipKhach, Instant hetHanAt) {
        Map<String, String> thamSo = new HashMap<>();
        thamSo.put("vnp_TmnCode", "MOPHONG");
        thamSo.put("vnp_Amount", String.valueOf(giaoDich.getSoTien() * 100));
        thamSo.put("vnp_TxnRef", giaoDich.getMaDon());
        thamSo.put("vnp_OrderInfo", "Thanh toan mo phong " + giaoDich.getMaDon());
        thamSo.put("vnp_BankCode", "MOPHONG");
        thamSo.put("vnp_PayDate", VnpaySigner.ngay(giaoDich.getTaoAt()));
        thamSo.put("vnp_TransactionNo", String.valueOf(100000000L + RANDOM.nextLong(900000000L)));
        thamSo.put("vnp_ResponseCode", thanhCong ? "00" : "24");
        thamSo.put("vnp_TransactionStatus", thanhCong ? "00" : "02");
        return returnUrl + "?" + signer.query(thamSo);
    }

    @Override
    public KetQuaCong xacMinh(Map<String, String> thamSo) {
        return signer.xacMinh(thamSo);
    }
}
