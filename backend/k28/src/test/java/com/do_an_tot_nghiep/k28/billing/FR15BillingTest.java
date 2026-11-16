package com.do_an_tot_nghiep.k28.billing;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.billing.gateway.VnpaySigner;
import com.do_an_tot_nghiep.k28.common.quota.GoiDichVuResolver;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.util.UriComponentsBuilder;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = "app.billing.enforce=true")
class FR15BillingTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final VnpaySigner SIGNER = new VnpaySigner("test-fake-secret");

    @Autowired JdbcTemplate jdbc;
    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired GoiDichVuResolver plans;
    @Autowired Clock clock;

    @Test
    void tc22_noPlanBlocksLearningButKeepsAllowedRoutes() throws Exception {
        Learner learner = learner();

        mockMvc.perform(get("/api/v1/decks").cookie(learner.session))
                .andExpect(status().isPaymentRequired())
                .andExpect(jsonPath("$.code").value("SUBSCRIPTION_REQUIRED"))
                .andExpect(jsonPath("$.details.lyDo").value("CHUA_CO_GOI"))
                .andExpect(jsonPath("$.details.goiGanNhat").isEmpty());
        mockMvc.perform(get("/api/v1/me").cookie(learner.session)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/notifications").cookie(learner.session)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/me/subscription").cookie(learner.session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("CHUA_CO_GOI"));
        mockMvc.perform(get("/api/v1/billing/plans"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].ma").value("PRO"))
                .andExpect(jsonPath("$[0].giaThang").value(299000))
                .andExpect(jsonPath("$[0].giaNam").value(2990000))
                .andExpect(jsonPath("$[0].gioiHanThe").value(5000))
                .andExpect(jsonPath("$[0].hanMucAi").value(20))
                .andExpect(jsonPath("$[0].boMauCaoCap").value(false))
                .andExpect(jsonPath("$[1].ma").value("PREMIUM"))
                .andExpect(jsonPath("$[1].giaNam").value(9990000))
                .andExpect(jsonPath("$[1].gioiHanThe").isEmpty())
                .andExpect(jsonPath("$[1].hanMucAnh").value(30));
    }

    @Test
    void tc21_paymentActivatesOnceAndRenewalStacks() throws Exception {
        Learner learner = learner();
        JsonNode checkout = checkout(learner, "PRO", "THANG");
        assertThat(checkout.get("soTien").asLong()).isEqualTo(299000);
        assertThat(checkout.get("moPhong").asBoolean()).isTrue();
        String maDon = checkout.get("maDon").asString();
        String paymentUrl = checkout.get("paymentUrl").asString();

        follow(paymentUrl)
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "http://localhost:3000/thanh-toan-ket-qua?maDon=" + maDon));
        mockMvc.perform(get("/api/v1/billing/transactions/" + maDon).cookie(learner.session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("THANH_CONG"))
                .andExpect(jsonPath("$.cong").value("MO_PHONG"))
                .andExpect(jsonPath("$.tenGoi").value("Pro"));
        Instant hetHan = hetHanAt(learner.id);

        follow(paymentUrl).andExpect(status().isFound());
        ipn(params(paymentUrl))
                .andExpect(jsonPath("$.RspCode").value("02"));
        assertThat(subscriptionRows(learner.id)).isEqualTo(1);
        assertThat(hetHanAt(learner.id)).isEqualTo(hetHan);

        mockMvc.perform(get("/api/v1/decks").cookie(learner.session)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/me/subscription").cookie(learner.session))
                .andExpect(jsonPath("$.goiMa").value("PRO"))
                .andExpect(jsonPath("$.trangThai").value("HIEU_LUC"))
                .andExpect(jsonPath("$.soNgayConLai").isNumber());
        assertThat(plans.goiMa(learner.id)).isEqualTo("PRO");

        JsonNode renewal = checkout(learner, "PRO", "THANG");
        follow(renewal.get("paymentUrl").asString()).andExpect(status().isFound());
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        assertThat(hetHanAt(learner.id)).isEqualTo(hetHan.atZone(zone).plusMonths(1).toInstant());
        assertThat(subscriptionRows(learner.id)).isEqualTo(1);
    }

    @Test
    void tc22_transactionHistoryAndReceiptAreOwnOnly() throws Exception {
        Learner learner = learner();
        JsonNode paid = checkout(learner, "PRO", "THANG");
        String maDon = paid.get("maDon").asString();
        follow(paid.get("paymentUrl").asString()).andExpect(status().isFound());
        String cho = checkout(learner, "PRO", "NAM").get("maDon").asString();

        mockMvc.perform(get("/api/v1/billing/transactions").cookie(learner.session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.items[0].maDon").value(cho))
                .andExpect(jsonPath("$.items[0].trangThai").value("CHO_THANH_TOAN"))
                .andExpect(jsonPath("$.items[1].maDon").value(maDon))
                .andExpect(jsonPath("$.items[1].tenGoi").value("Pro"));
        mockMvc.perform(get("/api/v1/billing/transactions").param("trangThai", "THANH_CONG").cookie(learner.session))
                .andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(get("/api/v1/billing/transactions").param("size", "101").cookie(learner.session))
                .andExpect(status().isBadRequest());

        String html = mockMvc.perform(get("/api/v1/billing/transactions/" + maDon + "/receipt").cookie(learner.session))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/html;charset=UTF-8"))
                .andExpect(header().string("Cache-Control", "no-store"))
                .andReturn().getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8);
        assertThat(html).contains(maDon, "299.000 ₫", "Billing tester", "mô phỏng", "không phải hóa đơn giá trị gia tăng");
        mockMvc.perform(get("/api/v1/billing/transactions/" + cho + "/receipt").cookie(learner.session))
                .andExpect(status().isUnprocessableContent());

        Learner other = learner();
        mockMvc.perform(get("/api/v1/billing/transactions/" + maDon + "/receipt").cookie(other.session))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/billing/transactions").cookie(other.session))
                .andExpect(jsonPath("$.totalElements").value(0));

        jdbc.update("UPDATE giao_dich_thanh_toan SET tao_at = UTC_TIMESTAMP(3) - INTERVAL 16 MINUTE WHERE ma_don = ?", cho);
        mockMvc.perform(get("/api/v1/billing/transactions").param("trangThai", "HET_HAN").cookie(learner.session))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].maDon").value(cho));
    }

    @Test
    void tc21_wrongSignatureOrAmountDoesNotActivate() throws Exception {
        Learner learner = learner();
        JsonNode checkout = checkout(learner, "PREMIUM", "NAM");
        String maDon = checkout.get("maDon").asString();
        Map<String, String> params = params(checkout.get("paymentUrl").asString());

        Map<String, String> tampered = new HashMap<>(params);
        tampered.put("vnp_Amount", "100");
        ipn(tampered).andExpect(jsonPath("$.RspCode").value("97"));

        Map<String, String> wrongAmount = new HashMap<>(params);
        wrongAmount.remove("vnp_SecureHash");
        wrongAmount.put("vnp_Amount", "100");
        ipn(signed(wrongAmount)).andExpect(jsonPath("$.RspCode").value("04"));

        Map<String, String> unknown = new HashMap<>(params);
        unknown.remove("vnp_SecureHash");
        unknown.put("vnp_TxnRef", "DH00000000NOTFOUND");
        ipn(signed(unknown)).andExpect(jsonPath("$.RspCode").value("01"));

        assertThat(orderStatus(maDon)).isEqualTo("CHO_THANH_TOAN");
        assertThat(subscriptionRows(learner.id)).isZero();

        ipn(params).andExpect(jsonPath("$.RspCode").value("00"));
        assertThat(orderStatus(maDon)).isEqualTo("THANH_CONG");
        assertThat(plans.goiMa(learner.id)).isEqualTo("PREMIUM");
    }

    @Test
    void tc21_failedPaymentAndOtherUsersOrder() throws Exception {
        Learner owner = learner();
        Learner other = learner();
        JsonNode checkout = checkout(owner, "PRO", "THANG");
        String maDon = checkout.get("maDon").asString();

        mockMvc.perform(get("/api/v1/billing/transactions/" + maDon).cookie(other.session))
                .andExpect(status().isNotFound());

        Map<String, String> failed = new HashMap<>(params(checkout.get("paymentUrl").asString()));
        failed.remove("vnp_SecureHash");
        failed.put("vnp_ResponseCode", "24");
        failed.put("vnp_TransactionStatus", "02");
        ipn(signed(failed)).andExpect(jsonPath("$.RspCode").value("00"));

        mockMvc.perform(get("/api/v1/billing/transactions/" + maDon).cookie(owner.session))
                .andExpect(jsonPath("$.trangThai").value("THAT_BAI"))
                .andExpect(jsonPath("$.maPhanHoi").value("24"));
        assertThat(subscriptionRows(owner.id)).isZero();
        mockMvc.perform(get("/api/v1/decks").cookie(owner.session)).andExpect(status().isPaymentRequired());
    }

    @Test
    void tc21_orderOlderThanFifteenMinutesExpires() throws Exception {
        Learner learner = learner();
        JsonNode checkout = checkout(learner, "PRO", "THANG");
        String maDon = checkout.get("maDon").asString();
        jdbc.update("UPDATE giao_dich_thanh_toan SET tao_at = UTC_TIMESTAMP(3) - INTERVAL 16 MINUTE WHERE ma_don = ?", maDon);

        follow(checkout.get("paymentUrl").asString()).andExpect(status().isFound());

        assertThat(orderStatus(maDon)).isEqualTo("HET_HAN");
        assertThat(subscriptionRows(learner.id)).isZero();

        JsonNode unpaid = checkout(learner, "PRO", "THANG");
        jdbc.update("UPDATE giao_dich_thanh_toan SET tao_at = UTC_TIMESTAMP(3) - INTERVAL 16 MINUTE WHERE ma_don = ?",
                unpaid.get("maDon").asString());
        mockMvc.perform(get("/api/v1/billing/transactions/" + unpaid.get("maDon").asString()).cookie(learner.session))
                .andExpect(jsonPath("$.trangThai").value("HET_HAN"));
    }

    @Test
    void tc22_expiredPlanBlocksThenRebuyStartsNow() throws Exception {
        Learner learner = learner();
        pay(learner, checkout(learner, "PRO", "THANG"));
        mockMvc.perform(post("/api/v1/billing/checkouts").cookie(learner.session).with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("goiMa", "PREMIUM", "chuKy", "THANG"))))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));

        jdbc.update("""
                UPDATE dang_ky_goi SET bat_dau_at = UTC_TIMESTAMP(3) - INTERVAL 2 HOUR,
                       het_han_at = UTC_TIMESTAMP(3) - INTERVAL 1 MINUTE
                WHERE nguoi_dung_id = ?""", learner.id);
        mockMvc.perform(get("/api/v1/decks").cookie(learner.session))
                .andExpect(status().isPaymentRequired())
                .andExpect(jsonPath("$.details.lyDo").value("HET_HAN"))
                .andExpect(jsonPath("$.details.goiGanNhat").value("PRO"))
                .andExpect(jsonPath("$.details.hetHanAt").isNotEmpty());
        mockMvc.perform(get("/api/v1/me/subscription").cookie(learner.session))
                .andExpect(jsonPath("$.trangThai").value("HET_HAN"));

        pay(learner, checkout(learner, "PREMIUM", "THANG"));
        assertThat(subscriptionRows(learner.id)).isEqualTo(2);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dang_ky_goi WHERE nguoi_dung_id = ? AND trang_thai = 'HIEU_LUC'",
                Integer.class, learner.id)).isEqualTo(1);
        assertThat(plans.goiMa(learner.id)).isEqualTo("PREMIUM");
        mockMvc.perform(get("/api/v1/decks").cookie(learner.session)).andExpect(status().isOk());
    }

    @Test
    void tc22_adminSkipsGuardAndPendingOtherPlanConflicts() throws Exception {
        Learner admin = learner();
        jdbc.update("INSERT INTO nguoi_dung_vai_tro (nguoi_dung_id, vai_tro_id) SELECT ?, id FROM vai_tro WHERE ma = 'ADMIN'",
                admin.id);
        Cookie adminSession = login(admin.email);
        mockMvc.perform(get("/api/v1/decks").cookie(adminSession)).andExpect(status().isOk());

        Learner learner = learner();
        checkout(learner, "PRO", "THANG");
        mockMvc.perform(post("/api/v1/billing/checkouts").cookie(learner.session).with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("goiMa", "PREMIUM", "chuKy", "THANG"))))
                .andExpect(status().isConflict());
        mockMvc.perform(post("/api/v1/billing/checkouts").cookie(learner.session).with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("goiMa", "FREE", "chuKy", "THANG"))))
                .andExpect(status().isUnprocessableContent());
    }

    private void pay(Learner learner, JsonNode checkout) throws Exception {
        follow(checkout.get("paymentUrl").asString()).andExpect(status().isFound());
    }

    private org.springframework.test.web.servlet.ResultActions follow(String paymentUrl) throws Exception {
        assertThat(paymentUrl).startsWith("http://localhost:8080/api/v1/billing/vnpay/return?");
        MockHttpServletRequestBuilder request = get("/api/v1/billing/vnpay/return");
        params(paymentUrl).forEach(request::param);
        return mockMvc.perform(request);
    }

    private JsonNode checkout(Learner learner, String goiMa, String chuKy) throws Exception {
        String body = mockMvc.perform(post("/api/v1/billing/checkouts").cookie(learner.session).with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("goiMa", goiMa, "chuKy", chuKy))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return jsonMapper.readTree(body);
    }

    private org.springframework.test.web.servlet.ResultActions ipn(Map<String, String> params) throws Exception {
        MockHttpServletRequestBuilder request = get("/api/v1/billing/vnpay/ipn");
        params.forEach(request::param);
        return mockMvc.perform(request).andExpect(status().isOk());
    }

    private static Map<String, String> params(String url) {
        Map<String, String> result = new HashMap<>();
        UriComponentsBuilder.fromUriString(url).build().getQueryParams()
                .forEach((key, values) -> result.put(key, URLDecoder.decode(values.getFirst(), StandardCharsets.US_ASCII)));
        return result;
    }

    private static Map<String, String> signed(Map<String, String> unsigned) {
        return params("http://localhost/?" + SIGNER.query(unsigned));
    }

    private Integer subscriptionRows(Long userId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM dang_ky_goi WHERE nguoi_dung_id = ?", Integer.class, userId);
    }

    private Instant hetHanAt(Long userId) {
        return jdbc.queryForObject("SELECT het_han_at FROM dang_ky_goi WHERE nguoi_dung_id = ? AND trang_thai = 'HIEU_LUC'",
                Timestamp.class, userId).toInstant();
    }

    private String orderStatus(String maDon) {
        return jdbc.queryForObject("SELECT trang_thai FROM giao_dich_thanh_toan WHERE ma_don = ?", String.class, maDon);
    }

    private Learner learner() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Billing tester", passwords.encode(PASSWORD),
                "Asia/Ho_Chi_Minh", roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        users.saveAndFlush(user);
        return new Learner(user.getId(), email, login(email));
    }

    private Cookie login(String email) throws Exception {
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return session;
    }

    private record Learner(Long id, String email, Cookie session) {
    }
}
