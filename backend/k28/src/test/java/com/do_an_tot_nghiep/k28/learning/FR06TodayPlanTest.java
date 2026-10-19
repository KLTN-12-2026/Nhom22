package com.do_an_tot_nghiep.k28.learning;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.account.service.SettingsService;
import com.do_an_tot_nghiep.k28.learning.dto.TodayPlanResponse;
import com.do_an_tot_nghiep.k28.learning.repository.SuDungHocNgayRepository;
import com.do_an_tot_nghiep.k28.learning.repository.TienDoTheRepository;
import com.do_an_tot_nghiep.k28.learning.service.LearningPlanService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
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

class FR06TodayPlanTest extends AbstractIntegrationTest {

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
    AccountService accountService;
    @Autowired
    SettingsService settingsService;
    @Autowired
    TienDoTheRepository progress;
    @Autowired
    SuDungHocNgayRepository usage;

    @Test
    void tc09_dayBoundariesFollowUserTimeZone() throws Exception {
        Learner vn = learner(HCM);
        Learner utc = learner("UTC");
        for (Learner learner : List.of(vn, utc)) {
            addProgress(learner, card(learner, "a"), "EN_VI", "ON_TAP", "2026-10-18T16:59:59.999Z");
            addProgress(learner, card(learner, "b"), "EN_VI", "ON_TAP", "2026-10-18T17:00:00Z");
            addProgress(learner, card(learner, "c"), "EN_VI", "ON_TAP", "2026-10-19T16:59:59.999Z");
            addProgress(learner, card(learner, "d"), "EN_VI", "ON_TAP", "2026-10-19T17:00:00Z");
        }
        String now = "2026-10-18T17:30:00Z";

        TodayPlanResponse vnPlan = planAt(now, vn);
        assertThat(vnPlan.ngay()).isEqualTo(LocalDate.parse("2026-10-19"));
        assertThat(vnPlan.soQuaHan()).isEqualTo(1);
        assertThat(vnPlan.soDenHan()).isEqualTo(2);
        assertThat(vnPlan.uocTinhPhut()).isEqualTo(1);

        TodayPlanResponse utcPlan = planAt(now, utc);
        assertThat(utcPlan.ngay()).isEqualTo(LocalDate.parse("2026-10-18"));
        assertThat(utcPlan.soQuaHan()).isZero();
        assertThat(utcPlan.soDenHan()).isEqualTo(2);
    }

    @Test
    void tc09_newCardUsageResetsAtLocalMidnight() throws Exception {
        Learner learner = learner(HCM);
        insertUsage(learner, "2026-10-18", 9, 3);
        insertUsage(learner, "2026-10-19", 2, 6);

        TodayPlanResponse before = planAt("2026-10-18T16:59:59Z", learner);
        assertThat(before.ngay()).isEqualTo(LocalDate.parse("2026-10-18"));
        assertThat(before.soTheMoiDaHoc()).isEqualTo(9);

        TodayPlanResponse after = planAt("2026-10-18T17:00:00Z", learner);
        assertThat(after.ngay()).isEqualTo(LocalDate.parse("2026-10-19"));
        assertThat(after.soTheMoiDaHoc()).isEqualTo(2);
    }

    @Test
    void tc09_newCardQuotaCountsPhysicalCardsAndNeverBlocksReviews() throws Exception {
        Learner learner = learner(HCM);
        long both = card(learner, "both");
        addProgress(learner, both, "EN_VI", "MOI", null);
        addProgress(learner, both, "VI_EN", "MOI", null);
        card(learner, "plain1");
        card(learner, "plain2");
        addProgress(learner, card(learner, "overdue"), "EN_VI", "ON_TAP", "2026-10-10T00:00:00Z");
        String now = "2026-10-19T05:00:00Z";

        TodayPlanResponse unlimited = planAt(now, learner);
        assertThat(unlimited.tongSoThe()).isEqualTo(4);
        assertThat(unlimited.soMoiConLai()).isEqualTo(3);
        assertThat(unlimited.uocTinhPhut()).isEqualTo(2);

        settingsService.learning(learner.id());
        jdbc.update("UPDATE ho_so_hoc_tap SET tu_moi_moi_ngay = ? WHERE nguoi_dung_id = ?", 2, learner.id());
        assertThat(planAt(now, learner).soMoiConLai()).isEqualTo(2);

        insertUsage(learner, "2026-10-19", 2, 2);
        TodayPlanResponse exhausted = planAt(now, learner);
        assertThat(exhausted.soMoiConLai()).isZero();
        assertThat(exhausted.soQuaHan()).isEqualTo(1);

        jdbc.update("UPDATE su_dung_hoc_ngay SET so_the_moi = ? WHERE nguoi_dung_id = ?", 15, learner.id());
        assertThat(planAt(now, learner).soMoiConLai()).isZero();
    }

    @Test
    void fr06_countsOnlyActiveOwnedCardsInReviewStates() throws Exception {
        Learner owner = learner(HCM);
        Learner stranger = learner(HCM);
        String past = "2026-10-10T00:00:00Z";
        String sameDay = "2026-10-19T03:00:00Z";

        long k1 = card(owner, "k1");
        long k2 = card(owner, "k2");
        long k3 = card(owner, "k3");
        long k4 = card(owner, "k4");
        long k5 = card(owner, "k5");
        card(owner, "k7");
        addProgress(owner, k1, "EN_VI", "DANG_HOC", past);
        addProgress(owner, k1, "VI_EN", "ON_TAP", past);
        addProgress(owner, k2, "EN_VI", "HOC_LAI", sameDay);
        addProgress(owner, k3, "EN_VI", "TAM_NGUNG", past);
        addProgress(owner, k4, "EN_VI", "MOI", null);
        addProgress(owner, k5, "EN_VI", "ON_TAP", past);
        jdbc.update("UPDATE the_tu_vung SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", k5);

        String deletedDeck = createDeck(owner.session());
        long k6 = cardIn(owner.session(), deletedDeck, "k6");
        addProgress(owner, k6, "EN_VI", "ON_TAP", past);
        jdbc.update("UPDATE bo_the SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", Long.valueOf(deletedDeck));

        addProgress(stranger, k1, "EN_VI", "ON_TAP", past);

        TodayPlanResponse plan = planAt("2026-10-19T05:00:00Z", owner);
        assertThat(plan.soQuaHan()).isEqualTo(2);
        assertThat(plan.soDenHan()).isEqualTo(1);
        assertThat(plan.tongSoThe()).isEqualTo(5);
        assertThat(plan.soMoiConLai()).isEqualTo(2);
        assertThat(plan.boThe()).hasSize(1);
        assertThat(plan.boThe().get(0).boTheId()).isEqualTo(owner.deckId());
        assertThat(plan.boThe().get(0).soCanOn()).isEqualTo(3);
        assertThat(plan.boThe().get(0).soMoi()).isEqualTo(2);

        TodayPlanResponse foreign = planAt("2026-10-19T05:00:00Z", stranger);
        assertThat(foreign.soQuaHan()).isZero();
        assertThat(foreign.soDenHan()).isZero();
        assertThat(foreign.tongSoThe()).isZero();
        assertThat(foreign.boThe()).hasSize(1);
    }

    @Test
    void fr06_streakCountsConsecutiveQualifyingLocalDays() throws Exception {
        Learner learner = learner(HCM);
        insertUsage(learner, "2026-10-19", 0, 5);
        insertUsage(learner, "2026-10-18", 0, 6);
        insertUsage(learner, "2026-10-17", 0, 5);
        insertUsage(learner, "2026-10-16", 0, 4);
        insertUsage(learner, "2026-10-15", 0, 9);

        TodayPlanResponse plan = planAt("2026-10-19T05:00:00Z", learner);
        assertThat(plan.chuoiNgay()).isEqualTo(3);
        assertThat(plan.homNayDaTinhChuoi()).isTrue();
        assertThat(plan.luotToiThieuChuoi()).isEqualTo(5);
        assertThat(plan.daHocHomNay().soLuot()).isEqualTo(5);
        assertThat(plan.daHocHomNay().soPhut()).isEqualTo(2);

        jdbc.update("UPDATE su_dung_hoc_ngay SET so_luot_hop_le = ? WHERE nguoi_dung_id = ? AND ngay_dia_phuong = ?",
                4, learner.id(), LocalDate.parse("2026-10-19"));
        TodayPlanResponse notYet = planAt("2026-10-19T05:00:00Z", learner);
        assertThat(notYet.chuoiNgay()).isEqualTo(2);
        assertThat(notYet.homNayDaTinhChuoi()).isFalse();

        assertThat(planAt("2026-10-21T05:00:00Z", learner).chuoiNgay()).isZero();
    }

    @Test
    void fr02_endpointNeedsLoginAndReturnsStringIds() throws Exception {
        mockMvc.perform(get("/api/v1/learning/today")).andExpect(status().isUnauthorized());

        Learner learner = learner(HCM);
        mockMvc.perform(get("/api/v1/learning/today").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ngay").isString())
                .andExpect(jsonPath("$.giayMoiLuot").value(20))
                .andExpect(jsonPath("$.luotToiThieuChuoi").value(5))
                .andExpect(jsonPath("$.tongSoThe").value(0))
                .andExpect(jsonPath("$.boThe.length()").value(1))
                .andExpect(jsonPath("$.boThe[0].boTheId").value(learner.deckId()))
                .andExpect(jsonPath("$.boThe[0].soMoi").value(0))
                .andExpect(jsonPath("$.cuuLichOn").doesNotExist());
    }

    private TodayPlanResponse planAt(String instant, Learner learner) {
        Clock fixed = Clock.fixed(Instant.parse(instant), ZoneOffset.UTC);
        return new LearningPlanService(fixed, accountService, settingsService, progress, usage)
                .today(learner.id());
    }

    private Learner learner(String zone) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Plan tester", passwords.encode(PASSWORD),
                zone, roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long userId = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return new Learner(userId, session, createDeck(session));
    }

    private String createDeck(Cookie session) throws Exception {
        MvcResult result = send(session, "/api/v1/decks", Map.of(
                "ten", "Plan deck " + UUID.randomUUID(),
                "trinhDo", "CO_BAN",
                "quyenTruyCap", "RIENG_TU")).andExpect(status().isCreated()).andReturn();
        return idOf(result);
    }

    private long card(Learner learner, String word) throws Exception {
        return cardIn(learner.session(), learner.deckId(), word);
    }

    private long cardIn(Cookie session, String deckId, String word) throws Exception {
        MvcResult result = send(session, "/api/v1/decks/" + deckId + "/cards", Map.of(
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

    private void addProgress(Learner learner, long cardId, String direction, String status, String dueAt) {
        LocalDateTime due = dueAt == null ? null : LocalDateTime.ofInstant(Instant.parse(dueAt), ZoneOffset.UTC);
        jdbc.update("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai, han_on_at) "
                + "VALUES (?, ?, ?, ?, ?)", learner.id(), cardId, direction, status, due);
    }

    private void insertUsage(Learner learner, String day, int newCards, int validReviews) {
        jdbc.update("INSERT INTO su_dung_hoc_ngay (nguoi_dung_id, ngay_dia_phuong, so_the_moi, so_luot_hop_le) "
                + "VALUES (?, ?, ?, ?)", learner.id(), LocalDate.parse(day), newCards, validReviews);
    }

    private record Learner(Long id, Cookie session, String deckId) {
    }
}