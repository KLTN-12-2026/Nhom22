package com.do_an_tot_nghiep.k28.billing;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.common.job.JobWorker;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
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
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = "app.billing.enforce=true")
class FR15FreeLimitsTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String HCM = "Asia/Ho_Chi_Minh";
    private static final String[][] WORDS = {
            {"receipt", "biên lai"},
            {"invoice", "hóa đơn"},
            {"deadline", "hạn chót"},
            {"schedule", "lịch trình"},
            {"budget", "ngân sách"}
    };

    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired JdbcTemplate jdbc;
    @Autowired JobWorker worker;
    @Autowired Clock clock;

    @Test
    void tc29_freePracticeQuotaKeepsRetryAndReviewOpen() throws Exception {
        Actor free = actor(false, null);
        cards(free);
        send(free, post("/api/v1/practice/sessions"), Map.of("loaiBai", "NHAP_TU_THEO_NGHIA", "soCau", 7))
                .andExpect(status().isBadRequest());
        List<String> ids = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            ids.add(body(practice(free).andExpect(status().isCreated())).get("id").asString());
        }
        practice(free)
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"))
                .andExpect(jsonPath("$.details.loai").value("LUYEN_TAP"))
                .andExpect(jsonPath("$.details.gioiHan").value(5));
        JsonNode quota = body(send(free, get("/api/v1/me/service-quota")).andExpect(status().isOk()));
        JsonNode luyenTap = item(quota.get("hanMuc"), "LUYEN_TAP");
        assertThat(luyenTap.get("gioiHan").asInt()).isEqualTo(5);
        assertThat(luyenTap.get("conLai").asInt()).isZero();

        String lanLamId = body(submitWrong(free, ids.get(0), null).andExpect(status().isCreated()))
                .get("lanLamId").asString();
        send(free, post("/api/v1/practice/mistakes/retry"), Map.of("lanLamId", lanLamId))
                .andExpect(status().isCreated());
        send(free, post("/api/v1/learning/sessions"), Map.of("chieuHoc", "EN_VI", "quyThoiGian", 5))
                .andExpect(status().isCreated());

        Actor pro = actor(false, "PRO");
        cards(pro);
        for (int i = 0; i < 6; i++) {
            practice(pro).andExpect(status().isCreated());
        }
    }

    @Test
    void tc29_aiExplainsOnlySubmittedWrongAnswersOnce() throws Exception {
        Actor free = actor(false, null);
        Actor other = actor(false, null);
        cards(free);
        String id = body(practice(free).andExpect(status().isCreated())).get("id").asString();
        List<String> questions = questions(id);
        explain(free, id, questions.get(0))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));

        String dung = questions.get(0);
        JsonNode result = body(submitWrong(free, id, dung).andExpect(status().isCreated()));
        assertThat(result.get("ketQua").get(0).get("dung").asBoolean()).isTrue();
        assertThat(result.get("ketQua").get(1).get("giaiThichAi").isNull()).isTrue();

        explain(free, id, dung).andExpect(status().isUnprocessableContent());
        explain(other, id, questions.get(1)).andExpect(status().isNotFound());
        String requestId = body(explain(free, id, questions.get(1)).andExpect(status().isAccepted()))
                .get("requestId").asString();
        explain(free, id, questions.get(1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.requestId").value(requestId));
        assertThat(aiUsed(free)).isEqualTo(1);

        String payload = jdbc.queryForObject("""
                SELECT payload_json FROM tac_vu_nen WHERE JSON_EXTRACT(payload_json, '$.yeuCauId') = ?
                """, String.class, Long.valueOf(requestId));
        assertThat(payload).contains("NHAP_TU_THEO_NGHIA").contains("noiDung");
        for (int i = 0; i < 10 && worker.runOnce("test-worker") > 0; i++) {
        }
        send(free, get("/api/v1/ai/requests/" + requestId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.loai").value("GIAI_THICH_LOI"))
                .andExpect(jsonPath("$.trangThai").value("HOAN_TAT"))
                .andExpect(jsonPath("$.ketQua.giaiThich").isNotEmpty());
        send(free, get("/api/v1/practice/sessions/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ketQua.ketQua[1].giaiThichAi.requestId").value(requestId))
                .andExpect(jsonPath("$.ketQua.ketQua[1].giaiThichAi.trangThai").value("HOAN_TAT"));

        explain(free, id, questions.get(2)).andExpect(status().isAccepted());
        explain(free, id, questions.get(3)).andExpect(status().isAccepted());
        explain(free, id, questions.get(4))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.details.loai").value("AI"));
        assertThat(aiUsed(free)).isEqualTo(3);
    }

    @Test
    void tc29_advancedStatisticsNeedPlanFlag() throws Exception {
        Actor free = actor(false, null);
        LocalDate today = LocalDate.now(clock.withZone(ZoneId.of(HCM)));
        String month = "/api/v1/statistics/overview?tuNgay=" + today.minusDays(29) + "&denNgay=" + today;
        send(free, get("/api/v1/statistics/overview")).andExpect(status().isOk());
        send(free, get("/api/v1/statistics/overview?tuNgay=" + today.minusDays(6) + "&denNgay=" + today))
                .andExpect(status().isOk());
        send(free, get(month))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.details.quyenLoi").value("THONG_KE_NANG_CAO"))
                .andExpect(jsonPath("$.details.goiCanNangCap").value("PRO"));
        send(free, get("/api/v1/statistics/overview?boTheId=" + free.deckId()))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.details.quyenLoi").value("THONG_KE_NANG_CAO"));
        send(free, get("/api/v1/statistics/skills?boTheId=" + free.deckId()))
                .andExpect(status().isUnprocessableContent());
        send(free, get("/api/v1/statistics/skills")).andExpect(status().isOk());
        send(free, get("/api/v1/statistics/weekly-summary?ngay=" + today.minusWeeks(3)))
                .andExpect(status().isOk());

        Actor pro = actor(false, "PRO");
        send(pro, get(month)).andExpect(status().isOk());
        send(pro, get("/api/v1/statistics/skills?boTheId=" + pro.deckId())).andExpect(status().isOk());
        Actor admin = actor(true, null);
        send(admin, get(month)).andExpect(status().isOk());

        send(free, get("/api/v1/billing/plans"))
                .andExpect(jsonPath("$[?(@.ma == 'FREE')].thongKeNangCao").value(false))
                .andExpect(jsonPath("$[?(@.ma == 'FREE')].hanMucLuyenTap").value(5))
                .andExpect(jsonPath("$[?(@.ma == 'PRO')].thongKeNangCao").value(true));

        JsonNode plan = item(body(send(admin, get("/api/v1/admin/plans")).andExpect(status().isOk())), "FREE", "ma");
        try {
            JsonNode updated = body(send(admin, put("/api/v1/admin/plans/FREE"), planBody(plan, true,
                    plan.get("version").asLong())).andExpect(status().isOk()));
            assertThat(updated.get("thongKeNangCao").asBoolean()).isTrue();
            assertThat(updated.get("phatAm").asBoolean()).isEqualTo(plan.get("phatAm").asBoolean());
            send(free, get(month)).andExpect(status().isOk());
            plan = updated;
        } finally {
            send(admin, put("/api/v1/admin/plans/FREE"), planBody(plan, false, plan.get("version").asLong()))
                    .andExpect(status().isOk());
        }
        send(free, get(month)).andExpect(status().isUnprocessableContent());
    }

    private Map<String, Object> planBody(JsonNode plan, boolean thongKe, long version) {
        Map<String, Object> body = new HashMap<>();
        body.put("ten", plan.get("ten").asString());
        body.put("giaThang", 0);
        body.put("giaNam", 0);
        body.put("gioiHanThe", plan.get("gioiHanThe").isNull() ? null : plan.get("gioiHanThe").asInt());
        body.put("phatAm", plan.get("phatAm").asBoolean());
        body.put("thongKeNangCao", thongKe);
        body.put("hoatDong", true);
        body.put("lyDo", "Kiểm thử cờ thống kê nâng cao");
        body.put("version", version);
        return body;
    }

    private int aiUsed(Actor actor) {
        Integer used = jdbc.queryForObject("""
                SELECT COALESCE(SUM(so_dung + so_giu), 0) FROM su_dung_dich_vu WHERE nguoi_dung_id = ? AND loai = 'AI'
                """, Integer.class, actor.id());
        return used == null ? 0 : used;
    }

    private ResultActions practice(Actor actor) throws Exception {
        return send(actor, post("/api/v1/practice/sessions"), Map.of("loaiBai", "NHAP_TU_THEO_NGHIA", "soCau", 5));
    }

    private ResultActions explain(Actor actor, String id, String questionId) throws Exception {
        return send(actor, post("/api/v1/practice/sessions/" + id + "/questions/" + questionId + "/ai-explanation"));
    }

    private ResultActions submitWrong(Actor actor, String id, String correctQuestionId) throws Exception {
        jdbc.update("UPDATE bai_luyen SET created_at = TIMESTAMPADD(SECOND, -600, created_at) WHERE id = ?",
                Long.valueOf(id));
        List<Map<String, Object>> traLoi = new ArrayList<>();
        jdbc.query("SELECT id, dap_an_json FROM cau_hoi_bai_luyen WHERE bai_id = ? ORDER BY thu_tu", rs -> {
            String questionId = rs.getString("id");
            String noiDung = questionId.equals(correctQuestionId)
                    ? jsonMapper.readTree(rs.getString("dap_an_json")).get("noiDung").asString()
                    : "zzzz";
            traLoi.add(Map.of("cauHoiId", questionId, "noiDung", noiDung));
        }, Long.valueOf(id));
        return send(actor, post("/api/v1/practice/sessions/" + id + "/submissions"), Map.of(
                "submitKey", "k-" + UUID.randomUUID(), "thoiGian", 60000, "traLoi", traLoi));
    }

    private List<String> questions(String id) {
        return jdbc.queryForList("SELECT CAST(id AS CHAR) FROM cau_hoi_bai_luyen WHERE bai_id = ? ORDER BY thu_tu",
                String.class, Long.valueOf(id));
    }

    private void cards(Actor actor) throws Exception {
        for (String[] word : WORDS) {
            send(actor, post("/api/v1/decks/" + actor.deckId() + "/cards"), Map.of("tu", word[0], "nghiaVi", word[1]))
                    .andExpect(status().isCreated());
        }
    }

    private static JsonNode item(JsonNode items, String loai) {
        return item(items, loai, "loai");
    }

    private static JsonNode item(JsonNode items, String value, String field) {
        for (JsonNode item : items) {
            if (value.equals(item.get(field).asString())) {
                return item;
            }
        }
        throw new AssertionError("Missing " + field + " " + value);
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
        NguoiDung user = NguoiDung.register(email, "Free limit tester", passwords.encode(PASSWORD),
                HCM, roles.findByMa(VaiTro.USER).orElseThrow());
        if (admin) {
            user.replaceRoles(Set.of(roles.findByMa(VaiTro.USER).orElseThrow(), roles.findByMa(VaiTro.ADMIN).orElseThrow()));
        }
        user.verifyEmail(clock.instant());
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
        String deckId = jsonMapper.readTree(mockMvc.perform(post("/api/v1/decks").cookie(session).with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("ten", "Bộ " + UUID.randomUUID(), "trinhDo", "CO_BAN"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8))
                .get("id").asString();
        return new Actor(id, session, deckId);
    }

    private record Actor(Long id, Cookie session, String deckId) {
    }
}
