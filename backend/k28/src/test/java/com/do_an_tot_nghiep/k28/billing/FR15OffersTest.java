package com.do_an_tot_nghiep.k28.billing;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.common.quota.GoiDichVuResolver;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.web.util.UriComponentsBuilder;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = "app.billing.enforce=true")
class FR15OffersTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String REASON = "Điều chỉnh chương trình ưu đãi";

    @Autowired JdbcTemplate jdbc;
    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired GoiDichVuResolver plans;

    @Test
    void tc27_trialOnceThenPurchaseReplacesTrial() throws Exception {
        Actor learner = actor(false, "test.local");
        send(learner, post("/api/v1/me/subscription/trial"), null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.goiMa").value("PREMIUM"))
                .andExpect(jsonPath("$.nguon").value("DUNG_THU"))
                .andExpect(jsonPath("$.soNgayConLai").value(7));
        assertThat(plans.goiMa(learner.id())).isEqualTo("PREMIUM");
        send(learner, post("/api/v1/me/subscription/trial"), null).andExpect(status().isUnprocessableContent());

        JsonNode quote = body(send(learner, post("/api/v1/billing/quotes"), Map.of("goiMa", "PRO", "chuKy", "THANG"))
                .andExpect(status().isOk()));
        assertThat(quote.get("nangCap").asBoolean()).isFalse();
        assertThat(quote.get("soTien").asLong()).isEqualTo(79000);
        pay(checkout(learner, Map.of("goiMa", "PRO", "chuKy", "THANG")));
        assertThat(plans.goiMa(learner.id())).isEqualTo("PRO");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dang_ky_goi WHERE nguoi_dung_id = ?", Integer.class,
                learner.id())).isEqualTo(2);
        send(learner, get("/api/v1/me/plan"), null).andExpect(jsonPath("$.nguon").value("MUA"));
    }

    @Test
    void tc27_upgradeMidTermChargesOnlyTheDifference() throws Exception {
        Actor learner = actor(false, "test.local");
        pay(checkout(learner, Map.of("goiMa", "PRO", "chuKy", "THANG")));

        JsonNode quote = body(send(learner, post("/api/v1/billing/quotes"), Map.of("goiMa", "PREMIUM", "chuKy", "THANG"))
                .andExpect(status().isOk()));
        assertThat(quote.get("nangCap").asBoolean()).isTrue();
        assertThat(quote.get("giaGoc").asLong()).isEqualTo(129000);
        assertThat(quote.get("khauTru").asLong()).isBetween(70000L, 79000L);
        assertThat(quote.get("soTien").asLong()).isEqualTo(129000 - quote.get("khauTru").asLong());

        JsonNode don = checkout(learner, Map.of("goiMa", "PREMIUM", "chuKy", "THANG"));
        assertThat(don.get("soTien").asLong()).isEqualTo(quote.get("soTien").asLong());
        pay(don);
        assertThat(plans.goiMa(learner.id())).isEqualTo("PREMIUM");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dang_ky_goi WHERE nguoi_dung_id = ? AND trang_thai = 'HIEU_LUC'",
                Integer.class, learner.id())).isEqualTo(1);

        send(learner, post("/api/v1/billing/quotes"), Map.of("goiMa", "PRO", "chuKy", "THANG"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("goiMa"));
        String html = mockMvc.perform(get("/api/v1/billing/transactions/" + don.get("maDon").asString() + "/receipt")
                        .cookie(learner.session()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(html).contains("Trừ phần còn lại của gói cũ", "129.000 ₫");
    }

    @Test
    void tc27_promotionCodeLimitsAndAutoPromotion() throws Exception {
        Actor admin = actor(true, "test.local");
        Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        String code = "SV" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        Map<String, Object> promo = new HashMap<>(Map.of("ma", code, "ten", "Giảm 30% gói Pro", "loaiGiam", "PHAN_TRAM",
                "giaTri", 30, "goiMa", "PRO", "batDauAt", now.minusSeconds(60).toString(),
                "ketThucAt", now.plusSeconds(3600).toString(), "luotMoiNguoi", 1, "chiLanDau", false, "hoatDong", true));
        send(admin, post("/api/v1/admin/promotions"), promo).andExpect(status().isCreated())
                .andExpect(jsonPath("$.ma").value(code))
                .andExpect(jsonPath("$.soLuotDaDung").value(0));
        send(admin, post("/api/v1/admin/promotions"), promo).andExpect(status().isConflict());
        Map<String, Object> wrongPercent = new HashMap<>(promo);
        wrongPercent.put("ma", code + "X");
        wrongPercent.put("giaTri", 150);
        send(admin, post("/api/v1/admin/promotions"), wrongPercent).andExpect(status().isBadRequest());

        Actor learner = actor(false, "test.local");
        JsonNode quote = body(send(learner, post("/api/v1/billing/quotes"),
                Map.of("goiMa", "PRO", "chuKy", "THANG", "maKhuyenMai", code.toLowerCase())).andExpect(status().isOk()));
        assertThat(quote.get("giamGia").asLong()).isEqualTo(23700);
        assertThat(quote.get("soTien").asLong()).isEqualTo(55300);
        assertThat(quote.get("maKhuyenMai").asString()).isEqualTo(code);
        send(learner, post("/api/v1/billing/quotes"), Map.of("goiMa", "PREMIUM", "chuKy", "THANG", "maKhuyenMai", code))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("maKhuyenMai"));
        send(learner, post("/api/v1/billing/quotes"), Map.of("goiMa", "PRO", "chuKy", "THANG", "maKhuyenMai", "KHONGCO"))
                .andExpect(status().isUnprocessableContent());

        pay(checkout(learner, Map.of("goiMa", "PRO", "chuKy", "THANG", "maKhuyenMai", code)));
        assertThat(jdbc.queryForObject("SELECT gia_goc - giam_gia FROM giao_dich_thanh_toan WHERE nguoi_dung_id = ? "
                + "AND trang_thai = 'THANH_CONG'", Long.class, learner.id())).isEqualTo(55300);
        send(learner, post("/api/v1/billing/quotes"), Map.of("goiMa", "PRO", "chuKy", "THANG", "maKhuyenMai", code))
                .andExpect(status().isUnprocessableContent());

        Map<String, Object> auto = new HashMap<>(Map.of("ten", "Giảm 100.000 ₫ Premium năm", "loaiGiam", "SO_TIEN",
                "giaTri", 100000, "goiMa", "PREMIUM", "chuKy", "NAM", "batDauAt", now.minusSeconds(60).toString(),
                "ketThucAt", now.plusSeconds(3600).toString(), "luotMoiNguoi", 1, "chiLanDau", true, "hoatDong", true));
        JsonNode created = body(send(admin, post("/api/v1/admin/promotions"), auto).andExpect(status().isCreated()));
        Actor fresh = actor(false, "test.local");
        send(fresh, post("/api/v1/billing/quotes"), Map.of("goiMa", "PREMIUM", "chuKy", "NAM"))
                .andExpect(jsonPath("$.giamGia").value(100000))
                .andExpect(jsonPath("$.soTien").value(899000))
                .andExpect(jsonPath("$.tenKhuyenMai").value("Giảm 100.000 ₫ Premium năm"));
        send(learner, post("/api/v1/billing/quotes"), Map.of("goiMa", "PREMIUM", "chuKy", "NAM"))
                .andExpect(jsonPath("$.giamGia").value(0));

        auto.put("hoatDong", false);
        auto.put("lyDo", REASON);
        auto.put("version", created.get("version").asLong());
        send(admin, put("/api/v1/admin/promotions/" + created.get("id").asString()), auto).andExpect(status().isOk());
        send(fresh, post("/api/v1/billing/quotes"), Map.of("goiMa", "PREMIUM", "chuKy", "NAM"))
                .andExpect(jsonPath("$.giamGia").value(0));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM nhat_ky_quan_tri WHERE nguoi_thuc_hien_id = ? "
                + "AND hanh_dong IN ('TAO_KHUYEN_MAI', 'SUA_KHUYEN_MAI')", Integer.class, admin.id())).isEqualTo(3);
        send(learner, get("/api/v1/admin/promotions"), null).andExpect(status().isForbidden());
    }

    @Test
    void tc27_studentEmailAutoApprovesAndFreeProIsClaimedOnce() throws Exception {
        Actor student = actor(false, "hcmut.edu.vn");
        send(student, get("/api/v1/me/student-offer"), null)
                .andExpect(jsonPath("$.goiMa").value("PRO"))
                .andExpect(jsonPath("$.phanTramGiam").value(100))
                .andExpect(jsonPath("$.xacMinh").isEmpty())
                .andExpect(jsonPath("$.coTheNhan").value(false));
        send(student, post("/api/v1/me/student-verifications"), Map.of("tenTruong", "ĐH Bách khoa"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.xacMinh.trangThai").value("DA_DUYET"))
                .andExpect(jsonPath("$.xacMinh.phuongThuc").value("EMAIL"))
                .andExpect(jsonPath("$.coTheNhan").value(true));
        send(student, post("/api/v1/me/student-verifications"), Map.of()).andExpect(status().isConflict());

        send(student, post("/api/v1/me/student-offer/claim"), null).andExpect(status().isOk())
                .andExpect(jsonPath("$.coTheNhan").value(false))
                .andExpect(jsonPath("$.xacMinh.daNhanUuDaiAt").isNotEmpty());
        assertThat(plans.goiMa(student.id())).isEqualTo("PRO");
        send(student, get("/api/v1/me/plan"), null).andExpect(jsonPath("$.nguon").value("HSSV"));
        send(student, post("/api/v1/me/student-offer/claim"), null).andExpect(status().isUnprocessableContent());

        Actor outsider = actor(false, "test.local");
        send(outsider, post("/api/v1/me/student-verifications"), Map.of())
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("tepTheId"));
    }

    @Test
    void tc27_studentCardReviewAndAdminEditsDiscount() throws Exception {
        Actor admin = actor(true, "test.local");
        Actor student = actor(false, "test.local");
        Actor other = actor(false, "test.local");
        Long tep = image(student.id());
        send(other, post("/api/v1/me/student-verifications"), Map.of("tepTheId", tep.toString()))
                .andExpect(status().isUnprocessableContent());
        send(student, post("/api/v1/me/student-verifications"), Map.of("tepTheId", tep.toString(), "tenTruong", "THPT A"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.xacMinh.trangThai").value("CHO_DUYET"));

        JsonNode pending = null;
        for (JsonNode item : body(send(admin, get("/api/v1/admin/student-verifications").param("trangThai", "CHO_DUYET"), null)
                .andExpect(status().isOk())).get("items")) {
            if (item.get("nguoiDungId").asString().equals(student.id().toString())) {
                pending = item;
            }
        }
        assertThat(pending).isNotNull();
        assertThat(pending.get("anhTheUrl").asString()).isNotBlank();
        String decision = "/api/v1/admin/student-verifications/" + pending.get("id").asString() + "/decision";
        send(admin, post(decision), Map.of("duyet", true, "lyDo", REASON, "version", pending.get("version").asLong() + 5))
                .andExpect(status().isConflict());
        send(admin, post(decision), Map.of("duyet", true, "lyDo", REASON, "version", pending.get("version").asLong()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_DUYET"));
        send(admin, post(decision), Map.of("duyet", false, "lyDo", REASON, "version", pending.get("version").asLong() + 1))
                .andExpect(status().isUnprocessableContent());

        JsonNode hssv = null;
        for (JsonNode item : body(send(admin, get("/api/v1/admin/offers"), null).andExpect(status().isOk()))) {
            if (item.get("ma").asString().equals("HSSV")) {
                hssv = item;
            }
        }
        assertThat(hssv).isNotNull();
        Map<String, Object> update = new HashMap<>(Map.of("goiMa", "PRO", "phanTramGiam", 50, "soNgay", 180,
                "tenMien", List.of("edu.vn"), "hoatDong", true, "lyDo", REASON, "version", hssv.get("version").asLong()));
        JsonNode updated = body(send(admin, put("/api/v1/admin/offers/HSSV"), update).andExpect(status().isOk()));
        try {
            send(student, post("/api/v1/billing/quotes"), Map.of("goiMa", "PRO", "chuKy", "NAM"))
                    .andExpect(jsonPath("$.uuDaiHssv").value(true))
                    .andExpect(jsonPath("$.giamGia").value(299500))
                    .andExpect(jsonPath("$.soTien").value(299500));
            send(student, post("/api/v1/me/student-offer/claim"), null).andExpect(status().isUnprocessableContent());
        } finally {
            update.put("phanTramGiam", 100);
            update.put("version", updated.get("version").asLong());
            send(admin, put("/api/v1/admin/offers/HSSV"), update).andExpect(status().isOk());
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM nhat_ky_quan_tri WHERE nguoi_thuc_hien_id = ? "
                + "AND hanh_dong IN ('DUYET_HSSV', 'SUA_UU_DAI')", Integer.class, admin.id())).isEqualTo(3);
    }

    @Test
    void tc27_freePlanKeepsZeroPriceAndCannotBeStopped() throws Exception {
        Actor admin = actor(true, "test.local");
        JsonNode free = null;
        for (JsonNode item : body(send(admin, get("/api/v1/admin/plans"), null).andExpect(status().isOk()))) {
            if (item.get("ma").asString().equals("FREE")) {
                free = item;
            }
        }
        assertThat(free).isNotNull();
        Map<String, Object> body = new HashMap<>(Map.of("ten", "Free", "giaThang", 1000, "giaNam", 0, "gioiHanThe", 300,
                "phatAm", true, "hoatDong", true, "lyDo", REASON,
                "version", free.get("version").asLong()));
        send(admin, put("/api/v1/admin/plans/FREE"), body).andExpect(status().isUnprocessableContent());
        body.put("giaThang", 0);
        body.put("hoatDong", false);
        send(admin, put("/api/v1/admin/plans/FREE"), body).andExpect(status().isUnprocessableContent());
        Actor learner = actor(false, "test.local");
        send(learner, post("/api/v1/billing/checkouts"), Map.of("goiMa", "FREE", "chuKy", "THANG"))
                .andExpect(status().isUnprocessableContent());
    }

    private Long image(Long ownerId) {
        String key = "files/test-" + UUID.randomUUID() + ".png";
        jdbc.update("""
                INSERT INTO tep_tin (chu_so_huu_id, object_key, mime_type, kich_thuoc, checksum, loai, hoan_tat_at)
                VALUES (?, ?, 'image/png', 1024, REPEAT('a', 64), 'ANH', UTC_TIMESTAMP(3))
                """, ownerId, key);
        return jdbc.queryForObject("SELECT id FROM tep_tin WHERE object_key = ?", Long.class, key);
    }

    private JsonNode checkout(Actor actor, Map<String, Object> request) throws Exception {
        return body(send(actor, post("/api/v1/billing/checkouts"), request).andExpect(status().isCreated()));
    }

    private void pay(JsonNode checkout) throws Exception {
        MockHttpServletRequestBuilder request = get("/api/v1/billing/vnpay/return");
        Map<String, String> params = new HashMap<>();
        UriComponentsBuilder.fromUriString(checkout.get("paymentUrl").asString()).build().getQueryParams()
                .forEach((key, values) -> params.put(key, URLDecoder.decode(values.getFirst(), StandardCharsets.US_ASCII)));
        params.forEach(request::param);
        mockMvc.perform(request).andExpect(status().isFound());
    }

    private ResultActions send(Actor actor, MockHttpServletRequestBuilder request, Object body) throws Exception {
        request.cookie(actor.session()).with(xsrf());
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(toJson(body));
        }
        return mockMvc.perform(request);
    }

    private JsonNode body(ResultActions result) throws Exception {
        return jsonMapper.readTree(result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private Actor actor(boolean admin, String domain) throws Exception {
        String email = UUID.randomUUID() + "@" + domain;
        NguoiDung user = NguoiDung.register(email, "Offer tester", passwords.encode(PASSWORD),
                "Asia/Ho_Chi_Minh", roles.findByMa(VaiTro.USER).orElseThrow());
        if (admin) {
            user.replaceRoles(Set.of(roles.findByMa(VaiTro.USER).orElseThrow(), roles.findByMa(VaiTro.ADMIN).orElseThrow()));
        }
        user.verifyEmail(Instant.now());
        Long id = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return new Actor(id, email, session);
    }

    private record Actor(Long id, String email, Cookie session) {
    }
}
