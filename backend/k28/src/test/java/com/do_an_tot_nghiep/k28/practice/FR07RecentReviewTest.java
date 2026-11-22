package com.do_an_tot_nghiep.k28.practice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.JsonNode;

class FR07RecentReviewTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String HCM = "Asia/Ho_Chi_Minh";
    private static final String[][] WORDS = {
            {"receipt", "biên lai"},
            {"invoice", "hóa đơn"},
            {"deadline", "hạn chót"},
            {"schedule", "lịch trình"},
            {"budget", "ngân sách"},
            {"agenda", "chương trình họp"}
    };

    @Autowired
    NguoiDungRepository users;
    @Autowired
    VaiTroRepository roles;
    @Autowired
    PasswordEncoder passwords;
    @Autowired
    Clock clock;
    @Autowired
    JdbcTemplate jdbc;

    @Test
    void fr07_recentSourceDefaultsToForgotHardEasyAndKeepsLatestRating() throws Exception {
        Learner learner = learner();
        List<Long> cards = cards(learner, 6);
        Instant now = clock.instant();
        rate(learner, cards.get(0), "DE", now.minus(Duration.ofDays(3)));
        rate(learner, cards.get(0), "QUEN", now.minus(Duration.ofHours(2)));
        rate(learner, cards.get(1), "KHO", now.minus(Duration.ofHours(5)));
        rate(learner, cards.get(2), "DE", now.minus(Duration.ofHours(1)));
        rate(learner, cards.get(3), "NHO", now.minus(Duration.ofHours(1)));
        rate(learner, cards.get(4), "QUEN", now.minus(Duration.ofDays(8)));

        JsonNode recent = body(mockMvc.perform(get("/api/v1/practice/recent-cards").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soNgay").value(7))
                .andExpect(jsonPath("$.tuNgay").isString())
                .andExpect(jsonPath("$.danhGia.length()").value(3))
                .andExpect(jsonPath("$.danhGia[0]").value("QUEN"))
                .andExpect(jsonPath("$.danhGia[1]").value("KHO"))
                .andExpect(jsonPath("$.danhGia[2]").value("DE"))
                .andExpect(jsonPath("$.theoDanhGia.QUEN").value(1))
                .andExpect(jsonPath("$.theoDanhGia.KHO").value(1))
                .andExpect(jsonPath("$.theoDanhGia.NHO").value(1))
                .andExpect(jsonPath("$.theoDanhGia.DE").value(1))
                .andExpect(jsonPath("$.tongSo").value(3)));
        List<String> words = new ArrayList<>();
        recent.get("the").forEach(item -> words.add(item.get("tu").asText()));
        assertThat(words).containsExactly("receipt", "invoice", "deadline");
        assertThat(recent.get("the").get(0).get("danhGia").asText()).isEqualTo("QUEN");
        assertThat(recent.get("the").get(0).get("theId").asText()).isEqualTo(String.valueOf(cards.get(0)));

        JsonNode practice = body(create(learner, Map.of("loaiBai", "NHAP_TU_THEO_NGHIA", "nguon", "VUA_HOC", "soCau", 10))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nguon").value("VUA_HOC"))
                .andExpect(jsonPath("$.boTheId").doesNotExist())
                .andExpect(jsonPath("$.boTheTen").value("Từ vừa học cần ôn")));
        assertThat(practice.get("soCau").asInt()).isEqualTo(3);
        assertThat(practiceWords(practice)).containsExactlyInAnyOrder("receipt", "invoice", "deadline");

        mockMvc.perform(get("/api/v1/practice/history").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void fr07_recentSourceFiltersByRating() throws Exception {
        Learner learner = learner();
        List<Long> cards = cards(learner, 5);
        Instant now = clock.instant();
        rate(learner, cards.get(0), "QUEN", now.minus(Duration.ofHours(1)));
        rate(learner, cards.get(1), "KHO", now.minus(Duration.ofHours(1)));
        rate(learner, cards.get(2), "DE", now.minus(Duration.ofHours(1)));
        rate(learner, cards.get(3), "NHO", now.minus(Duration.ofHours(1)));

        JsonNode forgot = body(create(learner, Map.of(
                "loaiBai", "NHAP_TU_THEO_NGHIA", "nguon", "VUA_HOC", "soCau", 5, "danhGia", List.of("QUEN")))
                .andExpect(status().isCreated()));
        assertThat(practiceWords(forgot)).containsExactly("receipt");

        JsonNode remembered = body(create(learner, Map.of(
                "loaiBai", "NHAP_TU_THEO_NGHIA", "nguon", "VUA_HOC", "soCau", 5, "danhGia", List.of("NHO", "KHO")))
                .andExpect(status().isCreated()));
        assertThat(practiceWords(remembered)).containsExactlyInAnyOrder("invoice", "schedule");

        mockMvc.perform(get("/api/v1/practice/recent-cards?danhGia=NHO&danhGia=DE").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.danhGia.length()").value(2))
                .andExpect(jsonPath("$.tongSo").value(2))
                .andExpect(jsonPath("$.the[0].tu").value("schedule"))
                .andExpect(jsonPath("$.the[1].tu").value("deadline"));

        jdbc.update("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai) VALUES (?, ?, 'VI_EN', 'TAM_NGUNG')",
                learner.id(), cards.get(0));
        create(learner, Map.of("loaiBai", "NHAP_TU_THEO_NGHIA", "nguon", "VUA_HOC", "soCau", 5, "danhGia", List.of("QUEN")))
                .andExpect(status().isUnprocessableContent());
    }

    @Test
    void fr07_recentSourceEmptyAndValidation() throws Exception {
        Learner learner = learner();
        Learner other = learner();
        List<Long> cards = cards(learner, 4);
        rate(other, cards(other, 1).get(0), "QUEN", clock.instant().minus(Duration.ofHours(1)));

        mockMvc.perform(get("/api/v1/practice/recent-cards").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tongSo").value(0))
                .andExpect(jsonPath("$.the.length()").value(0))
                .andExpect(jsonPath("$.theoDanhGia.QUEN").value(0));
        create(learner, Map.of("loaiBai", "CHON_NGHIA", "nguon", "VUA_HOC", "soCau", 5))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"))
                .andExpect(jsonPath("$.message").value("Chưa có từ nào vừa học trong 7 ngày qua khớp mức đã chọn."));

        expectField(learner, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5, "nguon", "VUA_HOC",
                "danhGia", List.of("ABC")), "danhGia");
        expectField(learner, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5, "danhGia", List.of("QUEN")), "danhGia");
        expectField(learner, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5, "nguon", "VUA_HOC",
                "boTheId", learner.deckId()), "boTheId");
        expectField(learner, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5, "nguon", "VUA_HOC",
                "theIds", List.of(String.valueOf(cards.get(0)))), "theIds");
        mockMvc.perform(get("/api/v1/practice/recent-cards?danhGia=SAI").cookie(learner.session()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        mockMvc.perform(get("/api/v1/practice/recent-cards"))
                .andExpect(status().isUnauthorized());
    }

    private List<String> practiceWords(JsonNode practice) {
        List<String> words = new ArrayList<>();
        for (JsonNode question : practice.get("cauHoi")) {
            String meaning = question.get("deBai").get("nghiaVi").asText();
            for (String[] row : WORDS) {
                if (row[1].equals(meaning)) {
                    words.add(row[0]);
                }
            }
        }
        return words;
    }

    private void rate(Learner learner, long theId, String danhGia, Instant at) {
        Integer exists = jdbc.queryForObject(
                "SELECT COUNT(*) FROM tien_do_the WHERE nguoi_dung_id = ? AND the_id = ? AND chieu_hoc = 'EN_VI'",
                Integer.class, learner.id(), theId);
        if (exists == 0) {
            jdbc.update("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai, han_on_at) VALUES (?, ?, 'EN_VI', 'HOC_LAI', ?)",
                    learner.id(), theId, utc(at));
        }
        Long tienDoId = jdbc.queryForObject(
                "SELECT id FROM tien_do_the WHERE nguoi_dung_id = ? AND the_id = ? AND chieu_hoc = 'EN_VI'",
                Long.class, learner.id(), theId);
        jdbc.update("INSERT INTO phien_hoc (nguoi_dung_id, chieu_hoc, mui_gio, bat_dau_at, quy_thoi_gian) VALUES (?, 'EN_VI', ?, ?, 10)",
                learner.id(), HCM, utc(at));
        Long phienId = jdbc.queryForObject("SELECT MAX(id) FROM phien_hoc WHERE nguoi_dung_id = ?", Long.class, learner.id());
        jdbc.update("INSERT INTO lich_su_on (nguoi_dung_id, client_event_id, phien_id, tien_do_id, danh_gia, thoi_gian, "
                        + "truoc_json, sau_json, phien_ban_thuat_toan, created_at, updated_at) "
                        + "VALUES (?, ?, ?, ?, ?, 1000, '{\"trangThai\": \"MOI\"}', '{\"trangThai\": \"HOC_LAI\"}', 'SM2-VN-2', ?, ?)",
                learner.id(), UUID.randomUUID().toString(), phienId, tienDoId, danhGia, utc(at), utc(at));
    }

    private static LocalDateTime utc(Instant at) {
        return LocalDateTime.ofInstant(at, ZoneOffset.UTC);
    }

    private void expectField(Learner learner, Map<String, Object> body, String field) throws Exception {
        create(learner, body)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[?(@.field =~ /" + field + ".*/)]").exists());
    }

    private ResultActions create(Learner learner, Map<String, Object> body) throws Exception {
        return send(learner.session(), "/api/v1/practice/sessions", body);
    }

    private JsonNode body(ResultActions actions) throws Exception {
        return jsonMapper.readTree(actions.andReturn().getResponse().getContentAsString());
    }

    private List<Long> cards(Learner learner, int count) throws Exception {
        List<Long> ids = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            MvcResult result = send(learner.session(), "/api/v1/decks/" + learner.deckId() + "/cards",
                    Map.of("tu", WORDS[i][0], "nghiaVi", WORDS[i][1]))
                    .andExpect(status().isCreated()).andReturn();
            ids.add(Long.parseLong(idOf(result)));
        }
        return ids;
    }

    private Learner learner() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Recent tester", passwords.encode(PASSWORD),
                HCM, roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long userId = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        MvcResult deck = send(session, "/api/v1/decks", Map.of(
                "ten", "Recent deck " + UUID.randomUUID(),
                "trinhDo", "CO_BAN",
                "quyenTruyCap", "RIENG_TU")).andExpect(status().isCreated()).andReturn();
        return new Learner(userId, session, idOf(deck));
    }

    private ResultActions send(Cookie session, String path, Object body) throws Exception {
        return mockMvc.perform(post(path).cookie(session).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private String idOf(MvcResult result) throws Exception {
        return jsonMapper.readTree(result.getResponse().getContentAsString()).get("id").asText();
    }

    private record Learner(Long id, Cookie session, String deckId) {
    }
}
