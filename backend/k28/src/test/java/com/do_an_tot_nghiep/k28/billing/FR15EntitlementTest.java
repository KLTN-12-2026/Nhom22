package com.do_an_tot_nghiep.k28.billing;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR15EntitlementTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";

    @Autowired JdbcTemplate jdbc;
    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;

    @BeforeEach
    void testPlan() {
        jdbc.update("""
                INSERT IGNORE INTO goi_dich_vu (ma, ten, gia_thang, gia_nam, gioi_han_the, phat_am, bo_mau_cao_cap, hoat_dong)
                VALUES ('THU', 'Thử', 1000, 10000, 2, FALSE, FALSE, FALSE)
                """);
    }

    @Test
    void tc22_cardLimitAndPronunciationFlagFollowPlan() throws Exception {
        Actor learner = actor(false, "THU");
        String deck = body(send(learner, post("/api/v1/decks"), Map.of("ten", "Bộ giới hạn", "trinhDo", "CO_BAN"))
                .andExpect(status().isCreated())).get("id").asString();

        String card = body(send(learner, post("/api/v1/decks/" + deck + "/cards"), Map.of("tu", "invoice", "nghiaVi", "hóa đơn"))
                .andExpect(status().isCreated())).get("id").asString();
        send(learner, post("/api/v1/decks/" + deck + "/cards"), Map.of("tu", "receipt", "nghiaVi", "biên nhận"))
                .andExpect(status().isCreated());
        send(learner, post("/api/v1/decks/" + deck + "/cards"), Map.of("tu", "refund", "nghiaVi", "hoàn tiền"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"))
                .andExpect(jsonPath("$.details.quyenLoi").value("GIOI_HAN_THE"))
                .andExpect(jsonPath("$.details.goiCanNangCap").value("PRO"))
                .andExpect(jsonPath("$.details.gioiHanThe").value(2))
                .andExpect(jsonPath("$.details.soTheHienCo").value(2));
        assertThat(cards(deck)).isEqualTo(2);

        mockMvc.perform(multipart("/api/v1/pronunciation/assessments")
                        .file(new MockMultipartFile("file", "ghi-am.wav", "audio/wav", wav()))
                        .param("theId", card).cookie(learner.session()).with(xsrf()))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.details.quyenLoi").value("PHAT_AM"))
                .andExpect(jsonPath("$.details.goiCanNangCap").value("PRO"));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM su_dung_dich_vu WHERE nguoi_dung_id = ?",
                Integer.class, learner.id())).isZero();

        Actor pro = actor(false, "PRO");
        String proDeck = body(send(pro, post("/api/v1/decks"), Map.of("ten", "Bộ Pro", "trinhDo", "CO_BAN"))
                .andExpect(status().isCreated())).get("id").asString();
        for (String tu : new String[]{"invoice", "receipt", "refund"}) {
            send(pro, post("/api/v1/decks/" + proDeck + "/cards"), Map.of("tu", tu, "nghiaVi", "nghĩa"))
                    .andExpect(status().isCreated());
        }
    }

    @Test
    void currentPlanShowsTierAndAdminIsPremiumWithoutPurchase() throws Exception {
        Actor pro = actor(false, "PRO");
        send(pro, get("/api/v1/me/plan"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.goiMa").value("PRO"))
                .andExpect(jsonPath("$.tenGoi").value("Pro"))
                .andExpect(jsonPath("$.quanTri").value(false))
                .andExpect(jsonPath("$.hetHanAt").isNotEmpty())
                .andExpect(jsonPath("$.soNgayConLai").value(30));

        Actor admin = actor(true, null);
        send(admin, get("/api/v1/me/plan"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.goiMa").value("PREMIUM"))
                .andExpect(jsonPath("$.tenGoi").value("Premium"))
                .andExpect(jsonPath("$.quanTri").value(true))
                .andExpect(jsonPath("$.hetHanAt").isEmpty());
        send(admin, post("/api/v1/billing/checkouts"), Map.of("goiMa", "PRO", "chuKy", "THANG"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.message").value("Tài khoản quản trị đã có đầy đủ quyền lợi Premium, không cần mua gói"));

        mockMvc.perform(get("/api/v1/me/plan")).andExpect(status().isUnauthorized());
    }

    @Test
    void tc22_premiumSampleDeckOnlyCopiesWithPremium() throws Exception {
        Actor admin = actor(true, null);
        String id = body(send(admin, post("/api/v1/admin/decks"), Map.of(
                "ten", "Bộ cao cấp " + UUID.randomUUID(), "trinhDo", "CO_BAN", "mucTieu", "TOEIC", "caoCap", true))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.caoCap").value(true))).get("id").asString();
        try {
            premiumSample(admin, id);
        } finally {
            jdbc.update("UPDATE bo_the SET xoa_at = UTC_TIMESTAMP(3) WHERE id = ?", Long.valueOf(id));
        }
    }

    private void premiumSample(Actor admin, String id) throws Exception {
        send(admin, post("/api/v1/admin/decks/" + id + "/cards"), Map.of("tu", "invoice", "nghiaVi", "hóa đơn"))
                .andExpect(status().isCreated());
        send(admin, patch("/api/v1/admin/decks/" + id), Map.of("quyenTruyCap", "CONG_KHAI", "version", 0))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/library/decks/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.boThe.caoCap").value(true));

        Actor pro = actor(false, "PRO");
        copy(pro, id)
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.details.quyenLoi").value("BO_MAU_CAO_CAP"))
                .andExpect(jsonPath("$.details.goiCanNangCap").value("PREMIUM"));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM bo_the WHERE chu_so_huu_id = ?", Integer.class, pro.id()))
                .isZero();

        Actor premium = actor(false, "PREMIUM");
        String copyId = body(copy(premium, id).andExpect(status().isCreated())
                .andExpect(jsonPath("$.soThe").value(1))).get("id").asString();
        assertThat(jdbc.queryForObject("SELECT cao_cap FROM bo_the WHERE id = ?", Boolean.class, Long.valueOf(copyId)))
                .isFalse();

        send(admin, patch("/api/v1/admin/decks/" + id), Map.of("caoCap", false, "version", 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.caoCap").value(false));
        copy(pro, id).andExpect(status().isCreated());
    }

    private ResultActions copy(Actor actor, String deckId) throws Exception {
        return mockMvc.perform(post("/api/v1/decks/" + deckId + "/copy").cookie(actor.session()).with(xsrf())
                .header("Idempotency-Key", UUID.randomUUID().toString()));
    }

    private Integer cards(String deckId) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM the_tu_vung WHERE bo_the_id = ? AND xoa_at IS NULL",
                Integer.class, Long.valueOf(deckId));
    }

    private ResultActions send(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.cookie(actor.session()).with(xsrf()));
    }

    private ResultActions send(Actor actor, MockHttpServletRequestBuilder request, Object body) throws Exception {
        return mockMvc.perform(request.cookie(actor.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private JsonNode body(ResultActions result) throws Exception {
        return jsonMapper.readTree(result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private Actor actor(boolean admin, String goiMa) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Entitlement tester", passwords.encode(PASSWORD),
                "Asia/Ho_Chi_Minh", roles.findByMa(VaiTro.USER).orElseThrow());
        if (admin) {
            user.replaceRoles(Set.of(roles.findByMa(VaiTro.USER).orElseThrow(), roles.findByMa(VaiTro.ADMIN).orElseThrow()));
        }
        user.verifyEmail(Instant.now());
        Long id = users.saveAndFlush(user).getId();
        if (goiMa != null) {
            jdbc.update("""
                    INSERT INTO dang_ky_goi (nguoi_dung_id, goi_ma, bat_dau_at, het_han_at, trang_thai)
                    VALUES (?, ?, UTC_TIMESTAMP(3) - INTERVAL 1 DAY, UTC_TIMESTAMP(3) + INTERVAL 30 DAY, 'HIEU_LUC')
                    """, id, goiMa);
        }
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return new Actor(id, session);
    }

    private static byte[] wav() {
        int sampleRate = 16000;
        int dataBytes = sampleRate * 2;
        ByteBuffer buffer = ByteBuffer.allocate(44 + dataBytes).order(ByteOrder.LITTLE_ENDIAN);
        buffer.put("RIFF".getBytes()).putInt(36 + dataBytes).put("WAVE".getBytes());
        buffer.put("fmt ".getBytes()).putInt(16).putShort((short) 1).putShort((short) 1)
                .putInt(sampleRate).putInt(sampleRate * 2).putShort((short) 2).putShort((short) 16);
        buffer.put("data".getBytes()).putInt(dataBytes);
        for (int i = 0; buffer.remaining() >= 2; i++) {
            buffer.putShort((short) (Math.sin(i / 10.0) * 4000));
        }
        return buffer.array();
    }

    private record Actor(Long id, Cookie session) {
    }
}
