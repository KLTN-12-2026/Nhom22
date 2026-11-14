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
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.JsonNode;

class FR08RecommendationTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String HCM = "Asia/Ho_Chi_Minh";
    private static final String[] WORDS = {"receipt", "affect", "effect", "reimbursement", "invoice", "deadline"};

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
    void fr08_emptyUserGetsEmptyListAndAnonymousGets401() throws Exception {
        Learner learner = learner();
        mockMvc.perform(get("/api/v1/learning/recommendations").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
        mockMvc.perform(get("/api/v1/learning/recommendations"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void fr08_reasonsCarryEvidenceAndHideOtherUsersData() throws Exception {
        Learner learner = learner();
        List<Long> cards = cards(learner);
        Instant now = clock.instant().truncatedTo(ChronoUnit.MILLIS);

        long forgotten = progress(learner, cards.get(0), "EN_VI");
        for (int i = 0; i < 3; i++) {
            review(learner, forgotten, "QUEN", "ON_TAP", now.minus(Duration.ofHours(i + 1)));
        }

        jdbc.update("INSERT INTO cap_tu_de_nham (nguoi_dung_id, the_1_id, the_2_id, so_lan_nham, lan_cuoi_at) VALUES (?, ?, ?, 3, ?)",
                learner.id(), cards.get(1), cards.get(2), utc(now.minus(Duration.ofHours(2))));

        improve(learner, cards.get(3), now, 5);
        improve(learner, cards.get(4), now, 4);
        improve(learner, cards.get(5), now, 5);
        jdbc.update("UPDATE the_tu_vung SET xoa_at = ? WHERE id = ?", utc(now), cards.get(5));

        JsonNode body = recommendations(learner);
        List<String> codes = new ArrayList<>();
        body.forEach(item -> codes.add(item.get("reasonCode").asText()));
        assertThat(codes).containsExactly("QUEN_NHIEU", "CAP_DE_NHAM", "TIEN_BO");

        JsonNode quen = body.get(0);
        assertThat(quen.get("cardIds").toString()).isEqualTo("[\"" + cards.get(0) + "\"]");
        assertThat(quen.get("message").asText()).isEqualTo("Ôn lại ‘receipt’ và thêm mẹo nhớ: bạn quên 3 lần trong 30 ngày qua");
        assertThat(quen.get("evidence").get("soLanQuen").asInt()).isEqualTo(3);
        assertThat(quen.get("evidence").has("soQuaHan")).isFalse();

        JsonNode pair = body.get(1);
        assertThat(pair.get("cardIds")).hasSize(2);
        assertThat(pair.get("message").asText()).isEqualTo("Phân biệt ‘affect’ và ‘effect’: bạn chọn nhầm 3 lần");
        assertThat(pair.get("evidence").get("soLanNham").asInt()).isEqualTo(3);

        JsonNode tienBo = body.get(2);
        assertThat(tienBo.get("cardIds").toString()).isEqualTo("[\"" + cards.get(3) + "\"]");
        assertThat(tienBo.get("message").asText())
                .isEqualTo("‘reimbursement’: sai 3/5 lượt trước đó, đúng 5/5 lượt trong 7 ngày gần đây");
        JsonNode evidence = tienBo.get("evidence");
        assertThat(evidence.get("soLuotCu").asInt()).isEqualTo(5);
        assertThat(evidence.get("soSaiCu").asInt()).isEqualTo(3);
        assertThat(evidence.get("soLuotMoi").asInt()).isEqualTo(5);
        assertThat(evidence.get("soDungMoi").asInt()).isEqualTo(5);
        assertThat(evidence.get("soNgayMoi").asInt()).isEqualTo(7);

        Learner other = learner();
        assertThat(recommendations(other)).isEmpty();
    }

    @Test
    void tc10_overdueRecommendationMatchesRescuePlanAndKeepsSchedule() throws Exception {
        Learner learner = learner();
        List<Long> cards = cards(learner);
        jdbc.update("INSERT INTO ho_so_hoc_tap (nguoi_dung_id, phut_moi_ngay) VALUES (?, 1) "
                + "ON DUPLICATE KEY UPDATE phut_moi_ngay = 1", learner.id());
        Instant due = clock.instant().minus(Duration.ofDays(3)).truncatedTo(ChronoUnit.MILLIS);
        for (int i = 0; i < 2; i++) {
            for (String chieu : List.of("EN_VI", "VI_EN")) {
                jdbc.update("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai, han_on_at) VALUES (?, ?, ?, 'ON_TAP', ?)",
                        learner.id(), cards.get(i), chieu, utc(due.plusSeconds(i)));
            }
        }

        JsonNode body = recommendations(learner);
        assertThat(body).hasSize(1);
        JsonNode overdue = body.get(0);
        assertThat(overdue.get("reasonCode").asText()).isEqualTo("QUA_HAN_NHIEU");
        assertThat(overdue.get("cardIds").toString())
                .isEqualTo("[\"" + cards.get(0) + "\",\"" + cards.get(1) + "\"]");
        assertThat(overdue.get("evidence").get("soQuaHan").asInt()).isEqualTo(4);
        assertThat(overdue.get("evidence").get("luotMoiNgay").asInt()).isEqualTo(3);
        assertThat(overdue.get("evidence").get("phutMoiNgay").asInt()).isEqualTo(1);
        assertThat(overdue.get("evidence").get("soNgayKeHoach").asInt()).isEqualTo(2);

        mockMvc.perform(get("/api/v1/learning/today").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cuuLichOn.soQuaHan").value(4))
                .andExpect(jsonPath("$.cuuLichOn.soNgay").value(2));

        Integer unchanged = jdbc.queryForObject(
                "SELECT COUNT(*) FROM tien_do_the WHERE nguoi_dung_id = ? AND trang_thai = 'ON_TAP' AND han_on_at IN (?, ?)",
                Integer.class, learner.id(), utc(due), utc(due.plusSeconds(1)));
        assertThat(unchanged).isEqualTo(4);
    }

    private void improve(Learner learner, long theId, Instant now, int recent) {
        long tienDoId = progress(learner, theId, "EN_VI");
        Instant old = now.minus(Duration.ofDays(20));
        for (int i = 0; i < 5; i++) {
            review(learner, tienDoId, i < 3 ? "QUEN" : "NHO", "DANG_HOC", old.plus(Duration.ofHours(i)));
        }
        Instant fresh = now.minus(Duration.ofDays(2));
        for (int i = 0; i < recent; i++) {
            review(learner, tienDoId, "NHO", "ON_TAP", fresh.plus(Duration.ofHours(i)));
        }
    }

    private long progress(Learner learner, long theId, String chieu) {
        jdbc.update("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai, han_on_at) VALUES (?, ?, ?, 'HOC_LAI', ?)",
                learner.id(), theId, chieu, utc(clock.instant()));
        return jdbc.queryForObject("SELECT id FROM tien_do_the WHERE nguoi_dung_id = ? AND the_id = ? AND chieu_hoc = ?",
                Long.class, learner.id(), theId, chieu);
    }

    private void review(Learner learner, long tienDoId, String danhGia, String truoc, Instant at) {
        jdbc.update("INSERT INTO phien_hoc (nguoi_dung_id, chieu_hoc, mui_gio, bat_dau_at, quy_thoi_gian) VALUES (?, 'EN_VI', ?, ?, 10)",
                learner.id(), HCM, utc(at));
        Long phienId = jdbc.queryForObject("SELECT MAX(id) FROM phien_hoc WHERE nguoi_dung_id = ?", Long.class, learner.id());
        jdbc.update("INSERT INTO lich_su_on (nguoi_dung_id, client_event_id, phien_id, tien_do_id, danh_gia, thoi_gian, "
                        + "truoc_json, sau_json, phien_ban_thuat_toan, created_at, updated_at) "
                        + "VALUES (?, ?, ?, ?, ?, 1000, ?, '{\"trangThai\": \"ON_TAP\"}', 'SM2-VN-2', ?, ?)",
                learner.id(), UUID.randomUUID().toString(), phienId, tienDoId, danhGia,
                "{\"trangThai\": \"" + truoc + "\"}", utc(at), utc(at));
    }

    private static LocalDateTime utc(Instant at) {
        return LocalDateTime.ofInstant(at, ZoneOffset.UTC);
    }

    private JsonNode recommendations(Learner learner) throws Exception {
        return body(mockMvc.perform(get("/api/v1/learning/recommendations").cookie(learner.session()))
                .andExpect(status().isOk()));
    }

    private List<Long> cards(Learner learner) throws Exception {
        List<Long> ids = new ArrayList<>();
        for (String word : WORDS) {
            ids.add(Long.parseLong(body(send(learner.session(), "/api/v1/decks/" + learner.deckId() + "/cards",
                    Map.of("tu", word, "nghiaVi", "nghĩa " + word)).andExpect(status().isCreated())).get("id").asText()));
        }
        return ids;
    }

    private Learner learner() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Recommendation tester", passwords.encode(PASSWORD),
                HCM, roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long userId = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        String deckId = body(send(session, "/api/v1/decks", Map.of(
                "ten", "Recommendation deck " + UUID.randomUUID(),
                "trinhDo", "CO_BAN",
                "quyenTruyCap", "RIENG_TU")).andExpect(status().isCreated())).get("id").asText();
        return new Learner(userId, session, deckId);
    }

    private ResultActions send(Cookie session, String path, Object body) throws Exception {
        return mockMvc.perform(post(path).cookie(session).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private JsonNode body(ResultActions actions) throws Exception {
        return jsonMapper.readTree(actions.andReturn().getResponse().getContentAsString());
    }

    private record Learner(Long id, Cookie session, String deckId) {
    }
}
