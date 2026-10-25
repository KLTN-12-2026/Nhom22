package com.do_an_tot_nghiep.k28.learning;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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
import com.do_an_tot_nghiep.k28.learning.dto.StudyQueueItemResponse;
import com.do_an_tot_nghiep.k28.learning.dto.StudySessionResponse;
import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.repository.PhienHocRepository;
import com.do_an_tot_nghiep.k28.learning.repository.PhienHocTheRepository;
import com.do_an_tot_nghiep.k28.learning.repository.SuDungHocNgayRepository;
import com.do_an_tot_nghiep.k28.learning.repository.TienDoTheRepository;
import com.do_an_tot_nghiep.k28.learning.service.StudySessionService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
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

class FR06StudySessionTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String HCM = "Asia/Ho_Chi_Minh";
    private static final String NOW = "2026-10-19T05:00:00Z";

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

    @Test
    void fr06_queueOrderIsStepsThenReviewsThenNewWithinQuota() throws Exception {
        Learner learner = learner(HCM);
        setNewPerDay(learner, 2);
        long review = card(learner, "review");
        long step = card(learner, "step");
        long later = card(learner, "later");
        long new1 = card(learner, "new1");
        long new2 = card(learner, "new2");
        card(learner, "new3");
        addProgress(learner, review, "EN_VI", "ON_TAP", "2026-10-10T00:00:00Z");
        addProgress(learner, step, "EN_VI", "HOC_LAI", "2026-10-19T04:00:00Z");
        addProgress(learner, later, "EN_VI", "ON_TAP", "2026-10-19T09:00:00Z");

        StudySessionResponse session = createAt(NOW, learner, null, ChieuHoc.EN_VI, 5);

        assertThat(ids(session)).containsExactly(
                String.valueOf(step), String.valueOf(review), String.valueOf(new1), String.valueOf(new2));
        assertThat(session.hangDoi()).extracting(StudyQueueItemResponse::thuTu).containsExactly(1, 2, 3, 4);
        assertThat(session.hangDoi().get(0).tienDo().trangThai().name()).isEqualTo("HOC_LAI");
        assertThat(session.hangDoi().get(2).tienDo().trangThai().name()).isEqualTo("MOI");
        assertThat(session.hangDoi().get(2).tienDo().version()).isZero();
        assertThat(session.hangDoi().get(2).tienDo().hanOnAt()).isNull();
        assertThat(session.hangDoi().get(0).the().id()).isEqualTo(String.valueOf(step));
        assertThat(session.muiGio()).isEqualTo(HCM);
        assertThat(session.quyThoiGian()).isEqualTo(5);
        assertThat(session.hetGioAt()).isEqualTo(session.batDauAt().plusSeconds(300));
        assertThat(session.batDauAt()).isEqualTo(Instant.parse(NOW));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM phien_hoc_the WHERE phien_id = ?",
                Integer.class, Long.valueOf(session.id()))).isEqualTo(4);
    }

    @Test
    void fr06_queueIsCappedByTimeBudgetAndKeepsEarliestDue() throws Exception {
        Learner learner = learner(HCM);
        List<String> expected = new ArrayList<>();
        Instant base = Instant.parse("2026-10-01T00:00:00Z");
        for (int i = 0; i < 20; i++) {
            long id = card(learner, "c" + i);
            addProgress(learner, id, "EN_VI", "ON_TAP", base.plusSeconds(i * 60L).toString());
            if (i < 15) {
                expected.add(String.valueOf(id));
            }
        }

        assertThat(ids(createAt(NOW, learner, null, ChieuHoc.EN_VI, 5))).containsExactlyElementsOf(expected);
        assertThat(createAt(NOW, learner, null, ChieuHoc.EN_VI, 10).hangDoi()).hasSize(20);
    }

    @Test
    void tc09_exhaustedNewQuotaNeverBlocksDueCardsButEmptyQueueIsRejected() throws Exception {
        Learner learner = learner(HCM);
        setNewPerDay(learner, 2);
        insertUsage(learner, "2026-10-19", 2, 0);
        long review = card(learner, "review");
        card(learner, "new1");
        card(learner, "new2");
        addProgress(learner, review, "EN_VI", "ON_TAP", "2026-10-10T00:00:00Z");

        assertThat(ids(createAt(NOW, learner, null, ChieuHoc.EN_VI, 5)))
                .containsExactly(String.valueOf(review));

        Learner onlyNew = learner(HCM);
        setNewPerDay(onlyNew, 2);
        insertUsage(onlyNew, "2026-10-19", 2, 0);
        card(onlyNew, "new1");
        assertThatThrownBy(() -> createAt(NOW, onlyNew, null, ChieuHoc.EN_VI, 5))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.BUSINESS_RULE));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM phien_hoc WHERE nguoi_dung_id = ?",
                Integer.class, onlyNew.id())).isZero();
    }

    @Test
    void tc09_quotaResetsAtLocalMidnight() throws Exception {
        Learner learner = learner(HCM);
        setNewPerDay(learner, 1);
        insertUsage(learner, "2026-10-18", 1, 0);
        long fresh = card(learner, "fresh");

        assertThatThrownBy(() -> createAt("2026-10-18T16:59:59Z", learner, null, ChieuHoc.EN_VI, 5))
                .isInstanceOf(ApiException.class);
        assertThat(ids(createAt("2026-10-18T17:00:00Z", learner, null, ChieuHoc.EN_VI, 5)))
                .containsExactly(String.valueOf(fresh));
    }

    @Test
    void tc09_otherDirectionOfStartedCardJoinsQueueWithoutUsingQuota() throws Exception {
        Learner learner = learner(HCM);
        setNewPerDay(learner, 1);
        insertUsage(learner, "2026-10-19", 1, 0);
        long started = card(learner, "started");
        card(learner, "plain");
        addProgress(learner, started, "EN_VI", "ON_TAP", "2026-10-25T00:00:00Z");

        StudySessionResponse reverse = createAt(NOW, learner, null, ChieuHoc.VI_EN, 5);

        assertThat(ids(reverse)).containsExactly(String.valueOf(started));
        assertThat(reverse.hangDoi().get(0).tienDo().trangThai().name()).isEqualTo("MOI");
        assertThat(reverse.hangDoi().get(0).tienDo().version()).isZero();
    }

    @Test
    void fr06_queueSkipsDeletedSuspendedForeignCardsAndHonorsDeckFilter() throws Exception {
        Learner owner = learner(HCM);
        Learner stranger = learner(HCM);
        String past = "2026-10-10T00:00:00Z";

        long good = card(owner, "good");
        long suspended = card(owner, "suspended");
        long deleted = card(owner, "deleted");
        addProgress(owner, good, "EN_VI", "ON_TAP", past);
        addProgress(owner, suspended, "EN_VI", "TAM_NGUNG", past);
        addProgress(owner, deleted, "EN_VI", "ON_TAP", past);
        jdbc.update("UPDATE the_tu_vung SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", deleted);

        String secondDeck = createDeck(owner.session());
        long inSecond = cardIn(owner.session(), secondDeck, "second");
        addProgress(owner, inSecond, "EN_VI", "ON_TAP", "2026-10-11T00:00:00Z");

        String goneDeck = createDeck(owner.session());
        long inGone = cardIn(owner.session(), goneDeck, "gone");
        addProgress(owner, inGone, "EN_VI", "ON_TAP", past);
        jdbc.update("UPDATE bo_the SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", Long.valueOf(goneDeck));

        addProgress(stranger, good, "EN_VI", "ON_TAP", past);

        assertThat(ids(createAt(NOW, owner, null, ChieuHoc.EN_VI, 5)))
                .containsExactly(String.valueOf(good), String.valueOf(inSecond));
        assertThat(ids(createAt(NOW, owner, secondDeck, ChieuHoc.EN_VI, 5)))
                .containsExactly(String.valueOf(inSecond));
        assertThat(ids(createAt(NOW, owner, owner.deckId(), ChieuHoc.EN_VI, 5)))
                .containsExactly(String.valueOf(good));

        assertThatThrownBy(() -> createAt(NOW, stranger, owner.deckId(), ChieuHoc.EN_VI, 5))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));
        assertThatThrownBy(() -> createAt(NOW, owner, goneDeck, ChieuHoc.EN_VI, 5))
                .isInstanceOfSatisfying(ApiException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.NOT_FOUND));
    }

    @Test
    void fr06_endpointsCreateAndReadSessionWithStringIds() throws Exception {
        mockMvc.perform(post("/api/v1/learning/sessions").with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("chieuHoc", "EN_VI", "quyThoiGian", 5))))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/learning/sessions/1")).andExpect(status().isUnauthorized());

        Learner owner = learner(HCM);
        Learner stranger = learner(HCM);
        long due = card(owner, "due");
        long fresh = card(owner, "fresh");
        addProgress(owner, due, "EN_VI", "ON_TAP", "2026-10-10T00:00:00Z");

        MvcResult created = send(owner.session(), "/api/v1/learning/sessions",
                Map.of("chieuHoc", "EN_VI", "quyThoiGian", 5, "boTheId", owner.deckId()))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").isString())
                .andExpect(jsonPath("$.boTheId").value(owner.deckId()))
                .andExpect(jsonPath("$.chieuHoc").value("EN_VI"))
                .andExpect(jsonPath("$.trangThai").value("DANG_HOC"))
                .andExpect(jsonPath("$.muiGio").value(HCM))
                .andExpect(jsonPath("$.hangDoi.length()").value(2))
                .andExpect(jsonPath("$.hangDoi[0].theId").value(String.valueOf(due)))
                .andExpect(jsonPath("$.hangDoi[0].trangThai").value("CHUA_TRA_LOI"))
                .andExpect(jsonPath("$.hangDoi[0].tienDo.trangThai").value("ON_TAP"))
                .andExpect(jsonPath("$.hangDoi[0].the.id").value(String.valueOf(due)))
                .andExpect(jsonPath("$.hangDoi[0].the.boTheId").value(owner.deckId()))
                .andExpect(jsonPath("$.hangDoi[1].theId").value(String.valueOf(fresh)))
                .andExpect(jsonPath("$.hangDoi[1].tienDo.trangThai").value("MOI"))
                .andExpect(jsonPath("$.hangDoi[1].tienDo.version").value(0))
                .andReturn();
        String sessionId = idOf(created);

        mockMvc.perform(get("/api/v1/learning/sessions/" + sessionId).cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(sessionId))
                .andExpect(jsonPath("$.hangDoi.length()").value(2))
                .andExpect(jsonPath("$.hangDoi[0].theId").value(String.valueOf(due)));
        mockMvc.perform(get("/api/v1/learning/sessions/" + sessionId).cookie(stranger.session()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/learning/sessions/999999999").cookie(owner.session()))
                .andExpect(status().isNotFound());

        jdbc.update("UPDATE the_tu_vung SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", due);
        mockMvc.perform(get("/api/v1/learning/sessions/" + sessionId).cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hangDoi.length()").value(2))
                .andExpect(jsonPath("$.hangDoi[0].the").doesNotExist());
    }

    @Test
    void fr06_endpointRejectsInvalidInputAndEmptyQueue() throws Exception {
        Learner learner = learner(HCM);

        send(learner.session(), "/api/v1/learning/sessions", Map.of("chieuHoc", "EN_VI", "quyThoiGian", 7))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("quyThoiGian"));
        send(learner.session(), "/api/v1/learning/sessions", Map.of("quyThoiGian", 5))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("chieuHoc"));
        send(learner.session(), "/api/v1/learning/sessions",
                Map.of("chieuHoc", "EN_VI", "quyThoiGian", 5, "boTheId", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("boTheId"));
        send(learner.session(), "/api/v1/learning/sessions", Map.of("chieuHoc", "EN_VI", "quyThoiGian", 5))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM phien_hoc WHERE nguoi_dung_id = ?",
                Integer.class, learner.id())).isZero();
    }

    private StudySessionResponse createAt(
            String instant, Learner learner, String deckId, ChieuHoc direction, int minutes) {
        Clock fixed = Clock.fixed(Instant.parse(instant), ZoneOffset.UTC);
        return new StudySessionService(fixed, accountService, settingsService, progress, usage,
                sessions, queue, cardService)
                .create(learner.id(), new CreateSessionRequest(deckId, direction, minutes));
    }

    private List<String> ids(StudySessionResponse session) {
        return session.hangDoi().stream().map(StudyQueueItemResponse::theId).toList();
    }

    private void setNewPerDay(Learner learner, int value) {
        settingsService.learning(learner.id());
        jdbc.update("UPDATE ho_so_hoc_tap SET tu_moi_moi_ngay = ? WHERE nguoi_dung_id = ?", value, learner.id());
    }

    private Learner learner(String zone) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Session tester", passwords.encode(PASSWORD),
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
                "ten", "Session deck " + UUID.randomUUID(),
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
