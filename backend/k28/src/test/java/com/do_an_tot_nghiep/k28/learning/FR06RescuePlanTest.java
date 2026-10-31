package com.do_an_tot_nghiep.k28.learning;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.account.service.AccountService;
import com.do_an_tot_nghiep.k28.account.service.SettingsService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.service.CardService;
import com.do_an_tot_nghiep.k28.learning.dto.CreateSessionRequest;
import com.do_an_tot_nghiep.k28.learning.dto.CuuLichOnResponse;
import com.do_an_tot_nghiep.k28.learning.dto.KeHoachNgayResponse;
import com.do_an_tot_nghiep.k28.learning.dto.StudyQueueItemResponse;
import com.do_an_tot_nghiep.k28.learning.dto.StudySessionResponse;
import com.do_an_tot_nghiep.k28.learning.dto.TodayPlanResponse;
import com.do_an_tot_nghiep.k28.learning.dto.TodayQuery;
import com.do_an_tot_nghiep.k28.learning.entity.enums.CheDoPhien;
import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.repository.LichSuOnRepository;
import com.do_an_tot_nghiep.k28.learning.repository.PhienHocRepository;
import com.do_an_tot_nghiep.k28.learning.repository.PhienHocTheRepository;
import com.do_an_tot_nghiep.k28.learning.repository.SuDungHocNgayRepository;
import com.do_an_tot_nghiep.k28.learning.repository.TienDoTheRepository;
import com.do_an_tot_nghiep.k28.learning.service.LearningPlanService;
import com.do_an_tot_nghiep.k28.learning.service.StudySessionService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.HashMap;
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

class FR06RescuePlanTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String HCM = "Asia/Ho_Chi_Minh";
    private static final String NOW = "2026-10-19T05:00:00Z";
    private static final String OVERDUE = "2026-10-10T00:00:00Z";
    private static final String DUE_TODAY = "2026-10-19T03:00:00Z";

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
    @Autowired
    PhienHocRepository sessions;
    @Autowired
    PhienHocTheRepository queue;
    @Autowired
    CardService cardService;
    @Autowired
    LichSuOnRepository history;

    @Test
    void tc10_rescuePlanSplitsWorkloadByMinutesPerDay() throws Exception {
        Learner learner = learner(HCM);
        setMinutesPerDay(learner, 1);
        for (int i = 0; i < 5; i++) {
            addProgress(learner, card(learner, "late" + i), "EN_VI", "ON_TAP", OVERDUE, 0);
        }
        addProgress(learner, card(learner, "today1"), "EN_VI", "ON_TAP", DUE_TODAY, 0);
        addProgress(learner, card(learner, "today2"), "EN_VI", "ON_TAP", DUE_TODAY, 0);
        card(learner, "new1");
        card(learner, "new2");

        TodayPlanResponse plan = planAt(NOW, learner, null, null);
        assertThat(plan.soQuaHan()).isEqualTo(5);
        assertThat(plan.soDenHan()).isEqualTo(2);
        assertThat(plan.soMoiConLai()).isZero();
        assertThat(plan.uocTinhPhut()).isEqualTo(3);
        CuuLichOnResponse rescue = plan.cuuLichOn();
        assertThat(rescue).isNotNull();
        assertThat(rescue.soTheCanOn()).isEqualTo(7);
        assertThat(rescue.soQuaHan()).isEqualTo(5);
        assertThat(rescue.phutMoiNgay()).isEqualTo(1);
        assertThat(rescue.luotMoiNgay()).isEqualTo(3);
        assertThat(rescue.soNgay()).isEqualTo(3);
        assertThat(rescue.tamDungTuMoi()).isTrue();
        assertThat(rescue.keHoach()).extracting(KeHoachNgayResponse::ngay).containsExactly(
                LocalDate.parse("2026-10-19"), LocalDate.parse("2026-10-20"), LocalDate.parse("2026-10-21"));
        assertThat(rescue.keHoach()).extracting(KeHoachNgayResponse::soThe).containsExactly(3, 3, 1);
        assertThat(rescue.keHoach()).extracting(KeHoachNgayResponse::phut).containsExactly(1, 1, 1);

        CuuLichOnResponse twoMinutes = planAt(NOW, learner, "2", null).cuuLichOn();
        assertThat(twoMinutes.phutMoiNgay()).isEqualTo(2);
        assertThat(twoMinutes.luotMoiNgay()).isEqualTo(6);
        assertThat(twoMinutes.soNgay()).isEqualTo(2);
        assertThat(twoMinutes.keHoach()).extracting(KeHoachNgayResponse::soThe).containsExactly(6, 1);
        assertThat(twoMinutes.keHoach()).extracting(KeHoachNgayResponse::phut).containsExactly(2, 1);

        TodayPlanResponse keepNew = planAt(NOW, learner, null, "true");
        assertThat(keepNew.cuuLichOn().tamDungTuMoi()).isFalse();
        assertThat(keepNew.soMoiConLai()).isEqualTo(2);
        assertThat(keepNew.uocTinhPhut()).isEqualTo(3);
    }

    @Test
    void tc10_thresholdUsesSettingMinutesAndOnlyOverdueRows() throws Exception {
        Learner learner = learner(HCM);
        setMinutesPerDay(learner, 1);
        for (int i = 0; i < 3; i++) {
            addProgress(learner, card(learner, "late" + i), "EN_VI", "ON_TAP", OVERDUE, 0);
        }
        for (int i = 0; i < 4; i++) {
            addProgress(learner, card(learner, "today" + i), "EN_VI", "ON_TAP", DUE_TODAY, 0);
        }
        card(learner, "new1");

        TodayPlanResponse atThreshold = planAt(NOW, learner, null, null);
        assertThat(atThreshold.soQuaHan()).isEqualTo(3);
        assertThat(atThreshold.cuuLichOn()).isNull();
        assertThat(atThreshold.soMoiConLai()).isEqualTo(1);

        long both = card(learner, "both");
        addProgress(learner, both, "EN_VI", "ON_TAP", OVERDUE, 0);
        addProgress(learner, both, "VI_EN", "TAM_NGUNG", null, 0);

        TodayPlanResponse over = planAt(NOW, learner, null, null);
        assertThat(over.soQuaHan()).isEqualTo(4);
        assertThat(over.cuuLichOn()).isNotNull();
        assertThat(over.cuuLichOn().soTheCanOn()).isEqualTo(8);

        CuuLichOnResponse wide = planAt(NOW, learner, "30", null).cuuLichOn();
        assertThat(wide).isNotNull();
        assertThat(wide.luotMoiNgay()).isEqualTo(90);
        assertThat(wide.soNgay()).isEqualTo(1);
        assertThat(wide.keHoach()).extracting(KeHoachNgayResponse::soThe).containsExactly(8);
        assertThat(wide.keHoach()).extracting(KeHoachNgayResponse::phut).containsExactly(3);
    }

    @Test
    void tc10_rescueSessionPrioritizesForgottenSkipsNewAndKeepsDueDates() throws Exception {
        Learner learner = learner(HCM);
        long step = card(learner, "step");
        long r0 = card(learner, "r0");
        long r3old = card(learner, "r3old");
        long r3new = card(learner, "r3new");
        long r1 = card(learner, "r1");
        long later = card(learner, "later");
        long other = card(learner, "other");
        long new1 = card(learner, "new1");
        addProgress(learner, step, "EN_VI", "HOC_LAI", "2026-10-19T04:00:00Z", 1);
        addProgress(learner, r0, "EN_VI", "ON_TAP", "2026-10-05T00:00:00Z", 0);
        addProgress(learner, r3old, "EN_VI", "ON_TAP", "2026-10-12T00:00:00Z", 3);
        addProgress(learner, r3new, "EN_VI", "ON_TAP", "2026-10-15T00:00:00Z", 3);
        addProgress(learner, r1, "EN_VI", "ON_TAP", "2026-10-01T00:00:00Z", 1);
        addProgress(learner, later, "EN_VI", "ON_TAP", "2026-10-19T09:00:00Z", 5);
        addProgress(learner, other, "VI_EN", "ON_TAP", "2026-11-30T00:00:00Z", 0);
        List<Map<String, Object>> before = snapshot(learner);
        TodayPlanResponse planBefore = planAt(NOW, learner, null, null);
        assertThat(planBefore.cuuLichOn()).isNull();

        StudySessionResponse rescue = createAt(NOW, learner, null, CheDoPhien.CUU_LICH);
        assertThat(rescue.cheDo()).isEqualTo(CheDoPhien.CUU_LICH);
        assertThat(ids(rescue)).containsExactly(
                String.valueOf(step), String.valueOf(r3old), String.valueOf(r3new),
                String.valueOf(r1), String.valueOf(r0));
        assertThat(ids(rescue)).doesNotContain(String.valueOf(new1), String.valueOf(other), String.valueOf(later));
        assertThat(jdbc.queryForObject("SELECT che_do FROM phien_hoc WHERE id = ?",
                String.class, Long.valueOf(rescue.id()))).isEqualTo("CUU_LICH");

        StudySessionResponse normal = createAt(NOW, learner, null, null);
        assertThat(normal.cheDo()).isEqualTo(CheDoPhien.THUONG);
        assertThat(ids(normal)).containsExactly(
                String.valueOf(step), String.valueOf(r1), String.valueOf(r0),
                String.valueOf(r3old), String.valueOf(r3new), String.valueOf(new1), String.valueOf(other));

        assertThat(snapshot(learner)).isEqualTo(before);
        TodayPlanResponse planAfter = planAt(NOW, learner, null, null);
        assertThat(planAfter.soQuaHan()).isEqualTo(planBefore.soQuaHan());
        assertThat(planAfter.soDenHan()).isEqualTo(planBefore.soDenHan());
    }

    @Test
    void tc10_rescueSessionWithoutDueCardsIsRejected() throws Exception {
        Learner learner = learner(HCM);
        card(learner, "new1");
        long other = card(learner, "other");
        addProgress(learner, other, "VI_EN", "ON_TAP", "2026-11-30T00:00:00Z", 0);

        assertThatThrownBy(() -> createAt(NOW, learner, null, CheDoPhien.CUU_LICH))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.BUSINESS_RULE));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM phien_hoc WHERE nguoi_dung_id = ?",
                Integer.class, learner.id())).isZero();
    }

    @Test
    void fr06_endpointsValidateQueryAndModeAndHideForeignSessions() throws Exception {
        Learner owner = learner(HCM);
        Learner stranger = learner(HCM);
        addProgress(owner, card(owner, "late"), "EN_VI", "ON_TAP", "2026-01-01T00:00:00Z", 2);

        for (String phut : List.of("0", "241", "abc", "10.5")) {
            mockMvc.perform(get("/api/v1/learning/today").param("phut", phut).cookie(owner.session()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.fieldErrors[0].field").value("phut"));
        }
        mockMvc.perform(get("/api/v1/learning/today").param("giuTuMoi", "co").cookie(owner.session()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("giuTuMoi"));
        mockMvc.perform(get("/api/v1/learning/today")
                        .param("phut", "240").param("giuTuMoi", "true").cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soQuaHan").value(1))
                .andExpect(jsonPath("$.cuuLichOn").doesNotExist());

        send(owner.session(), "/api/v1/learning/sessions",
                Map.of("chieuHoc", "EN_VI", "quyThoiGian", 5, "cheDo", "NHANH"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("cheDo"));

        MvcResult created = send(owner.session(), "/api/v1/learning/sessions",
                Map.of("chieuHoc", "EN_VI", "quyThoiGian", 5, "cheDo", "CUU_LICH"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isString())
                .andExpect(jsonPath("$.cheDo").value("CUU_LICH"))
                .andExpect(jsonPath("$.hangDoi.length()").value(1))
                .andReturn();
        String sessionId = idOf(created);

        mockMvc.perform(get("/api/v1/learning/sessions/" + sessionId).cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cheDo").value("CUU_LICH"));
        mockMvc.perform(get("/api/v1/learning/sessions/" + sessionId).cookie(stranger.session()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));

        Map<String, Object> foreignDeck = new HashMap<>();
        foreignDeck.put("boTheId", owner.deckId());
        foreignDeck.put("chieuHoc", "EN_VI");
        foreignDeck.put("quyThoiGian", 5);
        foreignDeck.put("cheDo", "CUU_LICH");
        send(stranger.session(), "/api/v1/learning/sessions", foreignDeck)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));

        send(owner.session(), "/api/v1/learning/sessions", Map.of("chieuHoc", "EN_VI", "quyThoiGian", 5))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.cheDo").value("THUONG"));

        mockMvc.perform(get("/api/v1/learning/today").cookie(stranger.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soQuaHan").value(0))
                .andExpect(jsonPath("$.cuuLichOn").doesNotExist());
    }

    private TodayPlanResponse planAt(String instant, Learner learner, String phut, String giuTuMoi) {
        Clock fixed = Clock.fixed(Instant.parse(instant), ZoneOffset.UTC);
        return new LearningPlanService(fixed, accountService, settingsService, progress, usage,
                sessions, queue, history)
                .today(learner.id(), new TodayQuery(phut, giuTuMoi));
    }

    private StudySessionResponse createAt(String instant, Learner learner, String deckId, CheDoPhien mode) {
        Clock fixed = Clock.fixed(Instant.parse(instant), ZoneOffset.UTC);
        return new StudySessionService(fixed, accountService, settingsService, progress, usage,
                sessions, queue, cardService, history, jsonMapper)
                .create(learner.id(), new CreateSessionRequest(
                        deckId, ChieuHoc.EN_VI, 5, mode == null ? null : mode.name()));
    }

    private List<String> ids(StudySessionResponse session) {
        return session.hangDoi().stream().map(StudyQueueItemResponse::theId).toList();
    }

    private List<Map<String, Object>> snapshot(Learner learner) {
        return jdbc.queryForList("SELECT id, the_id, chieu_hoc, trang_thai, han_on_at, so_lan_quen, version "
                + "FROM tien_do_the WHERE nguoi_dung_id = ? ORDER BY id", learner.id());
    }

    private void setMinutesPerDay(Learner learner, int minutes) {
        settingsService.learning(learner.id());
        jdbc.update("UPDATE ho_so_hoc_tap SET phut_moi_ngay = ? WHERE nguoi_dung_id = ?", minutes, learner.id());
    }

    private Learner learner(String zone) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Rescue tester", passwords.encode(PASSWORD),
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
                "ten", "Rescue deck " + UUID.randomUUID(),
                "trinhDo", "CO_BAN",
                "quyenTruyCap", "RIENG_TU")).andExpect(status().isCreated()).andReturn();
        return idOf(result);
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

    private void addProgress(
            Learner learner, long cardId, String direction, String status, String dueAt, int forgotten) {
        LocalDateTime due = dueAt == null ? null : LocalDateTime.ofInstant(Instant.parse(dueAt), ZoneOffset.UTC);
        jdbc.update("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai, han_on_at, so_lan_quen) "
                + "VALUES (?, ?, ?, ?, ?, ?)", learner.id(), cardId, direction, status, due, forgotten);
    }

    private record Learner(Long id, Cookie session, String deckId) {
    }
}
