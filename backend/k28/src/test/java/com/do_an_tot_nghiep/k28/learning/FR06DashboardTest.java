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
import com.do_an_tot_nghiep.k28.learning.dto.DuBaoNgayResponse;
import com.do_an_tot_nghiep.k28.learning.dto.PhienDangDoResponse;
import com.do_an_tot_nghiep.k28.learning.dto.TodayPlanResponse;
import com.do_an_tot_nghiep.k28.learning.dto.TodayQuery;
import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.repository.LichSuOnRepository;
import com.do_an_tot_nghiep.k28.learning.repository.PhienHocRepository;
import com.do_an_tot_nghiep.k28.learning.repository.PhienHocTheRepository;
import com.do_an_tot_nghiep.k28.learning.repository.SuDungHocNgayRepository;
import com.do_an_tot_nghiep.k28.learning.repository.TienDoTheRepository;
import com.do_an_tot_nghiep.k28.learning.service.LearningPlanService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

class FR06DashboardTest extends AbstractIntegrationTest {

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
    LichSuOnRepository history;

    @Test
    void fr06_openSessionIsLatestDangHocStartedTodayAndCountsAnswers() throws Exception {
        Learner owner = learner(HCM);
        Learner stranger = learner(HCM);
        long a = card(owner, "a");
        long b = card(owner, "b");
        long c = card(owner, "c");

        assertThat(planAt(NOW, owner).phienDangDo()).isNull();

        long yesterday = session(owner, null, "DANG_HOC", "2026-10-18T16:59:59Z", null);
        row(yesterday, a, 1, "CHUA_TRA_LOI");
        long finished = session(owner, null, "KET_THUC", "2026-10-19T04:00:00Z", "2026-10-19T04:05:00Z");
        row(finished, a, 1, "DA_TRA_LOI");
        assertThat(planAt(NOW, owner).phienDangDo()).isNull();

        long earlier = session(owner, null, "DANG_HOC", "2026-10-18T17:00:00Z", null);
        row(earlier, a, 1, "DA_TRA_LOI");
        PhienDangDoResponse first = planAt(NOW, owner).phienDangDo();
        assertThat(first.id()).isEqualTo(String.valueOf(earlier));
        assertThat(first.boTheId()).isNull();
        assertThat(first.boTheTen()).isEqualTo("Tất cả bộ của tôi");
        assertThat(first.soDaTraLoi()).isEqualTo(1);
        assertThat(first.soChuaTraLoi()).isZero();

        long latest = session(owner, Long.valueOf(owner.deckId()), "DANG_HOC", "2026-10-19T03:00:00Z", null);
        row(latest, a, 1, "DA_TRA_LOI");
        row(latest, b, 2, "CHUA_TRA_LOI");
        row(latest, c, 3, "CHUA_TRA_LOI");
        long foreign = session(stranger, null, "DANG_HOC", "2026-10-19T04:30:00Z", null);
        row(foreign, card(stranger, "x"), 1, "CHUA_TRA_LOI");

        PhienDangDoResponse open = planAt(NOW, owner).phienDangDo();
        assertThat(open.id()).isEqualTo(String.valueOf(latest));
        assertThat(open.boTheId()).isEqualTo(owner.deckId());
        assertThat(open.boTheTen()).startsWith("Dashboard deck ");
        assertThat(open.chieuHoc()).isEqualTo(ChieuHoc.EN_VI);
        assertThat(open.quyThoiGian()).isEqualTo(10);
        assertThat(open.batDauAt()).isEqualTo(Instant.parse("2026-10-19T03:00:00Z"));
        assertThat(open.hetGioAt()).isEqualTo(Instant.parse("2026-10-19T03:10:00Z"));
        assertThat(open.soDaTraLoi()).isEqualTo(1);
        assertThat(open.soChuaTraLoi()).isEqualTo(2);

        assertThat(planAt(NOW, stranger).phienDangDo().id()).isEqualTo(String.valueOf(foreign));
        assertThat(planAt("2026-10-19T17:00:00Z", owner).phienDangDo()).isNull();
    }

    @Test
    void tc09_forecastHasSevenLocalDaysAndSkipsInactiveRows() throws Exception {
        Learner learner = learner(HCM);
        Learner stranger = learner(HCM);
        long both = card(learner, "both");
        addProgress(learner, card(learner, "today"), "EN_VI", "ON_TAP", "2026-10-19T16:59:59Z");
        addProgress(learner, both, "EN_VI", "DANG_HOC", "2026-10-19T17:00:00Z");
        addProgress(learner, both, "VI_EN", "HOC_LAI", "2026-10-21T00:00:00Z");
        addProgress(learner, card(learner, "edge"), "EN_VI", "ON_TAP", "2026-10-20T16:59:59Z");
        addProgress(learner, card(learner, "last"), "EN_VI", "ON_TAP", "2026-10-26T16:59:59Z");
        addProgress(learner, card(learner, "outside"), "EN_VI", "ON_TAP", "2026-10-26T17:00:00Z");
        addProgress(learner, card(learner, "paused"), "EN_VI", "TAM_NGUNG", "2026-10-22T00:00:00Z");
        long deleted = card(learner, "deleted");
        addProgress(learner, deleted, "EN_VI", "ON_TAP", "2026-10-22T00:00:00Z");
        jdbc.update("UPDATE the_tu_vung SET xoa_at = ? WHERE id = ?", utc(NOW), deleted);
        addProgress(stranger, card(stranger, "foreign"), "EN_VI", "ON_TAP", "2026-10-22T00:00:00Z");

        TodayPlanResponse plan = planAt(NOW, learner);
        assertThat(plan.soDenHan()).isEqualTo(1);
        assertThat(plan.duBaoOn()).extracting(DuBaoNgayResponse::ngay).containsExactly(
                LocalDate.parse("2026-10-20"), LocalDate.parse("2026-10-21"), LocalDate.parse("2026-10-22"),
                LocalDate.parse("2026-10-23"), LocalDate.parse("2026-10-24"), LocalDate.parse("2026-10-25"),
                LocalDate.parse("2026-10-26"));
        assertThat(plan.duBaoOn()).extracting(DuBaoNgayResponse::soCanOn).containsExactly(2, 1, 0, 0, 0, 0, 1);

        assertThat(planAt(NOW, stranger).duBaoOn()).extracting(DuBaoNgayResponse::soCanOn)
                .containsExactly(0, 0, 1, 0, 0, 0, 0);
    }

    @Test
    void fr06_studyTimeSumsTodayHistoryAndFloorsMinutes() throws Exception {
        Learner learner = learner(HCM);
        Learner stranger = learner(HCM);
        long progressId = addProgress(learner, card(learner, "time"), "EN_VI", "ON_TAP", "2026-11-01T00:00:00Z");
        long sessionId = session(learner, null, "KET_THUC", "2026-10-18T16:00:00Z", "2026-10-19T17:30:00Z");
        review(learner, sessionId, progressId, 120000, "2026-10-18T16:59:59Z");
        review(learner, sessionId, progressId, 60000, "2026-10-18T17:00:00Z");
        review(learner, sessionId, progressId, 59999, "2026-10-19T04:00:00Z");
        review(learner, sessionId, progressId, 30000, "2026-10-19T16:59:59Z");
        review(learner, sessionId, progressId, 90000, "2026-10-19T17:00:00Z");
        long foreignProgress = addProgress(stranger, card(stranger, "foreign"), "EN_VI", "ON_TAP",
                "2026-11-01T00:00:00Z");
        long foreignSession = session(stranger, null, "KET_THUC", "2026-10-19T03:00:00Z", "2026-10-19T03:10:00Z");
        review(stranger, foreignSession, foreignProgress, 45000, "2026-10-19T03:05:00Z");
        jdbc.update("INSERT INTO su_dung_hoc_ngay (nguoi_dung_id, ngay_dia_phuong, so_the_moi, so_luot_hop_le) "
                + "VALUES (?, ?, 0, 3)", learner.id(), LocalDate.parse("2026-10-19"));

        TodayPlanResponse plan = planAt(NOW, learner);
        assertThat(plan.daHocHomNay().soLuot()).isEqualTo(3);
        assertThat(plan.daHocHomNay().thoiGian()).isEqualTo(149999);
        assertThat(plan.daHocHomNay().soPhut()).isEqualTo(2);
        TodayPlanResponse foreign = planAt(NOW, stranger);
        assertThat(foreign.daHocHomNay().thoiGian()).isEqualTo(45000);
        assertThat(foreign.daHocHomNay().soPhut()).isZero();

        mockMvc.perform(get("/api/v1/learning/today").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.daHocHomNay.thoiGian").isNumber())
                .andExpect(jsonPath("$.daHocHomNay.soPhut").isNumber())
                .andExpect(jsonPath("$.duBaoOn.length()").value(7))
                .andExpect(jsonPath("$.duBaoOn[0].ngay").isString())
                .andExpect(jsonPath("$.phienDangDo").doesNotExist());
    }

    private TodayPlanResponse planAt(String instant, Learner learner) {
        Clock fixed = Clock.fixed(Instant.parse(instant), ZoneOffset.UTC);
        return new LearningPlanService(fixed, accountService, settingsService, progress, usage,
                sessions, queue, history)
                .today(learner.id(), new TodayQuery(null, null));
    }

    private long session(Learner learner, Long deckId, String status, String startedAt, String endedAt) {
        return insert("INSERT INTO phien_hoc (nguoi_dung_id, bo_the_id, chieu_hoc, mui_gio, bat_dau_at, "
                        + "ket_thuc_at, trang_thai, quy_thoi_gian) VALUES (?, ?, 'EN_VI', ?, ?, ?, ?, 10)",
                learner.id(), deckId, HCM, utc(startedAt), utc(endedAt), status);
    }

    private void row(long sessionId, long cardId, int order, String status) {
        jdbc.update("INSERT INTO phien_hoc_the (phien_id, the_id, chieu_hoc, thu_tu, trang_thai) "
                + "VALUES (?, ?, 'EN_VI', ?, ?)", sessionId, cardId, order, status);
    }

    private void review(Learner learner, long sessionId, long progressId, int millis, String at) {
        jdbc.update("INSERT INTO lich_su_on (nguoi_dung_id, client_event_id, phien_id, tien_do_id, danh_gia, "
                        + "thoi_gian, truoc_json, sau_json, phien_ban_thuat_toan, created_at) "
                        + "VALUES (?, ?, ?, ?, 'NHO', ?, '{}', '{}', 'SM2-VN-1', ?)",
                learner.id(), UUID.randomUUID().toString(), sessionId, progressId, millis, utc(at));
    }

    private long addProgress(Learner learner, long cardId, String direction, String status, String dueAt) {
        return insert("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai, han_on_at) "
                + "VALUES (?, ?, ?, ?, ?)", learner.id(), cardId, direction, status, utc(dueAt));
    }

    private LocalDateTime utc(String instant) {
        return instant == null ? null : LocalDateTime.ofInstant(Instant.parse(instant), ZoneOffset.UTC);
    }

    private long insert(String sql, Object... args) {
        KeyHolder key = new GeneratedKeyHolder();
        jdbc.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            for (int i = 0; i < args.length; i++) {
                statement.setObject(i + 1, args[i]);
            }
            return statement;
        }, key);
        return key.getKey().longValue();
    }

    private Learner learner(String zone) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Dashboard tester", passwords.encode(PASSWORD),
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
                "ten", "Dashboard deck " + UUID.randomUUID(),
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

    private record Learner(Long id, Cookie session, String deckId) {
    }
}
