package com.do_an_tot_nghiep.k28.billing.gateway;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public final class VnpaySigner {

    public static final ZoneId VNPAY_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("yyyyMMddHHmmss").withZone(VNPAY_ZONE);
    private static final String HASH = "vnp_SecureHash";
    private static final String HASH_TYPE = "vnp_SecureHashType";

    private final byte[] secret;

    public VnpaySigner(String secret) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
    }

    public static String ngay(Instant instant) {
        return DATE.format(instant);
    }

    public String query(Map<String, String> thamSo) {
        String data = chuoiKy(thamSo);
        return data + "&" + HASH + "=" + hmac(data);
    }

    public KetQuaCong xacMinh(Map<String, String> thamSo) {
        String chuKy = thamSo.get(HASH);
        if (chuKy == null || chuKy.isBlank()) {
            return KetQuaCong.khongHopLe();
        }
        Map<String, String> duLieu = thamSo.entrySet().stream()
                .filter(e -> e.getKey().startsWith("vnp_") && !e.getKey().equals(HASH) && !e.getKey().equals(HASH_TYPE))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        byte[] mong = hmac(chuoiKy(duLieu)).getBytes(StandardCharsets.US_ASCII);
        byte[] nhan = chuKy.toLowerCase().getBytes(StandardCharsets.US_ASCII);
        if (!MessageDigest.isEqual(mong, nhan)) {
            return KetQuaCong.khongHopLe();
        }
        return new KetQuaCong(true, duLieu.get("vnp_TxnRef"), soTien(duLieu.get("vnp_Amount")),
                duLieu.get("vnp_ResponseCode"), duLieu.get("vnp_TransactionNo"),
                "00".equals(duLieu.get("vnp_ResponseCode")) && "00".equals(duLieu.get("vnp_TransactionStatus")));
    }

    private static long soTien(String vnpAmount) {
        try {
            long xu = Long.parseLong(vnpAmount);
            return xu % 100 == 0 ? xu / 100 : -1;
        } catch (NumberFormatException e) {
            return -1;
        }
    }

    private static String chuoiKy(Map<String, String> thamSo) {
        return new TreeMap<>(thamSo).entrySet().stream()
                .filter(e -> e.getValue() != null && !e.getValue().isEmpty())
                .map(e -> encode(e.getKey()) + "=" + encode(e.getValue()))
                .collect(Collectors.joining("&"));
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.US_ASCII);
    }

    private String hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            mac.init(new SecretKeySpec(secret, "HmacSHA512"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HmacSHA512 unavailable", e);
        }
    }
}
