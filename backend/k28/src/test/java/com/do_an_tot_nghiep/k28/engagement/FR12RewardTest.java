package com.do_an_tot_nghiep.k28.engagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.account.service.SettingsService;
import com.do_an_tot_nghiep.k28.engagement.service.RewardService;
import com.do_an_tot_nghiep.k28.learning.service.StreakCalculator;
import com.do_an_tot_nghiep.k28.learning.service.StreakService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.support.TransactionTemplate;

class FR12RewardTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String HCM = "Asia/Ho_Chi_Minh";

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
    @Autowired
    SettingsService settingsService;
    @Autowired
    RewardService rewardService;
    @Autowired
    StreakService streakService;
    @Autowired
    TransactionTemplate tx;

    @Test
    void tc15_repeatedReviewEventAndRelearningStepAwardOnce() throws Exception {
        Learner learner = learner();
        long card = card(learner, "word");
        String session = createSession(learner);
        String event = "evt-" + UUID.randomUUID();

        review(learner, session, event, card, "QUEN", 0)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.laiTrongPhien").value(true));
        review(learner, session, event, card, "QUEN", 0).andExpect(status().isOk());
        review(learner, session, "evt-" + UUID.randomUUID(), card, "NHO", 1).andExpect(status().isCreated());

        assertThat(count("lich_su_on", learner)).isEqualTo(2);
        assertThat(count("so_diem_thuong", learner)).isEqualTo(1);
        mockMvc.perform(get("/api/v1/rewards/history").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tongDiem").value(1))
                .andExpect(jsonPath("$.diemHomNay").value(1))
                .andExpect(jsonPath("$.diemToiDaNgay").value(100))
                .andExpect(jsonPath("$.lichSu.totalElements").value(1))
                .andExpect(jsonPath("$.lichSu.items[0].id").isString())
                .andExpect(jsonPath("$.lichSu.items[0].loaiSuKien").value("ON_THE"))
                .andExpect(jsonPath("$.lichSu.items[0].diemGoc").value(1))
                .andExpect(jsonPath("$.lichSu.items[0].soDiem").value(1));
    }

    @Test
    void tc15_dailyCapStopsPointsButKeepsLedgerEntry() throws Exception {
        Learner learner = learner();
        long first = card(learner, "first");
        long second = card(learner, "second");
        String session = createSession(learner);
        LocalDate homNay = today();
        jdbc.update("INSERT INTO su_dung_hoc_ngay (nguoi_dung_id, ngay_dia_phuong, diem) VALUES (?, ?, 99)",
                learner.id(), homNay);

        review(learner, session, "evt-" + UUID.randomUUID(), first, "DE", 0).andExpect(status().isCreated());
        review(learner, session, "evt-" + UUID.randomUUID(), second, "DE", 0).andExpect(status().isCreated());

        assertThat(jdbc.queryForObject("SELECT diem FROM su_dung_hoc_ngay WHERE nguoi_dung_id = ? AND ngay_dia_phuong = ?",
                Integer.class, learner.id(), homNay)).isEqualTo(100);
        assertThat(jdbc.queryForList("SELECT so_diem FROM so_diem_thuong WHERE nguoi_dung_id = ? ORDER BY id",
                Integer.class, learner.id())).containsExactly(1, 0);
        assertThat(jdbc.queryForList("SELECT diem_goc FROM so_diem_thuong WHERE nguoi_dung_id = ? ORDER BY id",
                Integer.class, learner.id())).containsExactly(1, 1);
    }

    @Test
    void tc15_practiceRewardIsIdempotentAndRetryEarnsNothing() throws Exception {
        Learner learner = learner();
        LocalDate homNay = today();

        int firstCall = tx.execute(status -> rewardService.practiced(learner.id(), 9001L, 4, false, homNay));
        int replay = tx.execute(status -> rewardService.practiced(learner.id(), 9001L, 4, false, homNay));
        int retry = tx.execute(status -> rewardService.practiced(learner.id(), 9002L, 5, true, homNay));

        assertThat(firstCall).isEqualTo(4);
        assertThat(replay).isZero();
        assertThat(retry).isZero();
        assertThat(count("so_diem_thuong", learner)).isEqualTo(2);
        assertThat(jdbc.queryForObject("SELECT SUM(so_diem) FROM so_diem_thuong WHERE nguoi_dung_id = ?",
                Integer.class, learner.id())).isEqualTo(4);
    }

    @Test
    void tc15_badgesAndWeeklyChallengeFollowRewardedReviews() throws Exception {
        Learner learner = learner();
        setNewPerDay(learner, 10);
        long[] cards = new long[5];
        for (int i = 0; i < cards.length; i++) {
            cards[i] = card(learner, "w" + i);
        }
        LocalDate homNay = today();
        jdbc.update("INSERT INTO su_dung_hoc_ngay (nguoi_dung_id, ngay_dia_phuong, so_luot_hop_le) VALUES (?, ?, 5), (?, ?, 5)",
                learner.id(), homNay.minusDays(1), learner.id(), homNay.minusDays(2));

        mockMvc.perform(get("/api/v1/challenges").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ma").value("TUAN_40_LUOT"))
                .andExpect(jsonPath("$[0].giaTri").value(0))
                .andExpect(jsonPath("$[0].hoanThanhAt").doesNotExist());

        String session = createSession(learner);
        for (long card : cards) {
            review(learner, session, "evt-" + UUID.randomUUID(), card, "DE", 0).andExpect(status().isCreated());
        }

        LocalDate tuan = StreakCalculator.weekStart(homNay);
        mockMvc.perform(get("/api/v1/challenges").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").isString())
                .andExpect(jsonPath("$[0].mucTieu").value(40))
                .andExpect(jsonPath("$[0].giaTri").value(5))
                .andExpect(jsonPath("$[0].tuanBatDau").value(tuan.toString()))
                .andExpect(jsonPath("$[0].tuanKetThuc").value(tuan.plusDays(6).toString()));
        mockMvc.perform(get("/api/v1/badges").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(6))
                .andExpect(jsonPath("$[?(@.ma == 'BUOC_DAU')].daNhan").value(true))
                .andExpect(jsonPath("$[?(@.ma == 'CHUOI_3')].daNhan").value(true))
                .andExpect(jsonPath("$[?(@.ma == 'CHUOI_7')].daNhan").value(false))
                .andExpect(jsonPath("$[?(@.ma == 'ON_100')].daNhan").value(false));
        assertThat(count("nguoi_dung_huy_hieu", learner)).isEqualTo(2);
        mockMvc.perform(get("/api/v1/learning/today").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chuoiNgay").value(3))
                .andExpect(jsonPath("$.daDungNgayNghiTuanNay").value(false));
    }

    @Test
    void tc15_frozenDayIsReadFromStoredLocalDays() throws Exception {
        Learner learner = learner();
        jdbc.update("INSERT INTO su_dung_hoc_ngay (nguoi_dung_id, ngay_dia_phuong, so_luot_hop_le) VALUES "
                        + "(?, '2026-10-21', 5), (?, '2026-10-20', 2), (?, '2026-10-19', 5), (?, '2026-10-18', 6)",
                learner.id(), learner.id(), learner.id(), learner.id());

        StreakCalculator.Result result = streakService.of(learner.id(), LocalDate.parse("2026-10-21"));
        assertThat(result.chuoiNgay()).isEqualTo(3);
        assertThat(result.ngayNghiTuanNay()).isEqualTo(LocalDate.parse("2026-10-20"));

        StreakCalculator.Result twoMissed = streakService.of(learner.id(), LocalDate.parse("2026-10-24"));
        assertThat(twoMissed.chuoiNgay()).isZero();
        assertThat(twoMissed.ngayNghiTuanNay()).isNull();
    }

    @Test
    void fr12_endpointsRequireLoginAndValidatePaging() throws Exception {
        for (String path : new String[]{"/api/v1/rewards/history", "/api/v1/badges", "/api/v1/challenges"}) {
            mockMvc.perform(get(path)).andExpect(status().isUnauthorized());
        }
        Learner learner = learner();
        mockMvc.perform(get("/api/v1/rewards/history").param("size", "0").cookie(learner.session()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'size')]").exists());
        mockMvc.perform(get("/api/v1/rewards/history").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tongDiem").value(0))
                .andExpect(jsonPath("$.lichSu.items.length()").value(0));
    }

    private LocalDate today() {
        return LocalDate.ofInstant(clock.instant(), ZoneId.of(HCM));
    }

    private ResultActions review(
            Learner learner, String session, String event, long card, String rating, long version) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("clientEventId", event);
        body.put("theId", String.valueOf(card));
        body.put("chieuHoc", "EN_VI");
        body.put("danhGia", rating);
        body.put("expectedVersion", version);
        body.put("thoiGianTraLoiMs", 4000);
        return send(learner.session(), "/api/v1/learning/sessions/" + session + "/reviews", body);
    }

    private String createSession(Learner learner) throws Exception {
        MvcResult result = send(learner.session(), "/api/v1/learning/sessions",
                Map.of("chieuHoc", "EN_VI", "quyThoiGian", 5))
                .andExpect(status().isCreated()).andReturn();
        return idOf(result);
    }

    private int count(String table, Learner learner) {
        return jdbc.queryForObject(
                "SELECT COUNT(*) FROM " + table + " WHERE nguoi_dung_id = ?", Integer.class, learner.id());
    }

    private void setNewPerDay(Learner learner, int value) {
        settingsService.learning(learner.id());
        jdbc.update("UPDATE ho_so_hoc_tap SET tu_moi_moi_ngay = ? WHERE nguoi_dung_id = ?", value, learner.id());
    }

    private Learner learner() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Reward tester", passwords.encode(PASSWORD),
                HCM, roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long userId = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        MvcResult deck = send(session, "/api/v1/decks", Map.of(
                "ten", "Reward deck " + UUID.randomUUID(),
                "trinhDo", "CO_BAN",
                "quyenTruyCap", "RIENG_TU")).andExpect(status().isCreated()).andReturn();
        return new Learner(userId, session, idOf(deck));
    }

    private long card(Learner learner, String word) throws Exception {
        MvcResult result = send(learner.session(), "/api/v1/decks/" + learner.deckId() + "/cards", Map.of(
                "tu", word + "-" + UUID.randomUUID(),
                "nghiaVi", "nghĩa")).andExpect(status().isCreated()).andReturn();
        return Long.parseLong(idOf(result));
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
