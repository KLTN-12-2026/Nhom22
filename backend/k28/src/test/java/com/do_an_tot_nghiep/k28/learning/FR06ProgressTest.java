package com.do_an_tot_nghiep.k28.learning;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.account.service.SettingsService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
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

class FR06ProgressTest extends AbstractIntegrationTest {

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

    @Test
    void fr06_deckProgressGroupsByLocalDayPerDirection() throws Exception {
        Learner learner = learner();
        ZoneId zone = ZoneId.of(HCM);
        LocalDate today = LocalDate.ofInstant(clock.instant(), zone);
        Instant startOfDay = today.atStartOfDay(zone).toInstant();
        Instant endOfDay = today.plusDays(1).atStartOfDay(zone).toInstant();

        card(learner, "fresh");
        long overdue = card(learner, "overdue");
        long dueToday = card(learner, "duetoday");
        long later = card(learner, "later");
        long suspended = card(learner, "suspended");
        long deleted = card(learner, "deleted");

        addReview(learner, overdue, "EN_VI", startOfDay.minus(Duration.ofHours(1)));
        addReview(learner, dueToday, "EN_VI", endOfDay.minus(Duration.ofMinutes(1)));
        addReview(learner, later, "EN_VI", endOfDay.plus(Duration.ofDays(1)));
        addReview(learner, deleted, "EN_VI", startOfDay.minus(Duration.ofDays(2)));
        suspend(learner, suspended, true).andExpect(status().isOk());
        jdbc.update("UPDATE the_tu_vung SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", deleted);

        progress(learner, learner.deckId(), "")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.boTheId").value(learner.deckId()))
                .andExpect(jsonPath("$.muiGio").value(HCM))
                .andExpect(jsonPath("$.tongSoThe").value(5))
                .andExpect(jsonPath("$.tongHop.MOI").value(5))
                .andExpect(jsonPath("$.tongHop.DANG_HOC").value(1))
                .andExpect(jsonPath("$.tongHop.DEN_HAN").value(1))
                .andExpect(jsonPath("$.tongHop.QUA_HAN").value(1))
                .andExpect(jsonPath("$.tongHop.TAM_NGUNG").value(2))
                .andExpect(jsonPath("$.totalElements").value(5))
                .andExpect(jsonPath("$.items[?(@.theId == '" + deleted + "')]").isEmpty())
                .andExpect(jsonPath("$.items[?(@.theId == '" + suspended + "')].tamNgung").value(true));

        progress(learner, learner.deckId(), "nhom=QUA_HAN")
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].theId").value(String.valueOf(overdue)))
                .andExpect(jsonPath("$.items[0].tamNgung").value(false))
                .andExpect(jsonPath("$.items[0].chieu.EN_VI.nhom").value("QUA_HAN"))
                .andExpect(jsonPath("$.items[0].chieu.EN_VI.trangThai").value("ON_TAP"))
                .andExpect(jsonPath("$.items[0].chieu.VI_EN.nhom").value("MOI"))
                .andExpect(jsonPath("$.items[0].chieu.VI_EN.version").value(0));
        progress(learner, learner.deckId(), "nhom=DEN_HAN")
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].theId").value(String.valueOf(dueToday)));
        progress(learner, learner.deckId(), "nhom=DANG_HOC")
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].theId").value(String.valueOf(later)));
        progress(learner, learner.deckId(), "nhom=MOI")
                .andExpect(jsonPath("$.totalElements").value(4));
        progress(learner, learner.deckId(), "q=duetoday")
                .andExpect(jsonPath("$.totalElements").value(1));
        progress(learner, learner.deckId(), "size=2")
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.totalPages").value(3));
    }

    @Test
    void fr06_deckProgressRejectsForeignDeletedDeckAndBadQuery() throws Exception {
        Learner owner = learner();
        Learner stranger = learner();

        progress(stranger, owner.deckId(), "").andExpect(status().isNotFound());
        progress(owner, owner.deckId(), "nhom=XX")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("nhom"));
        progress(owner, owner.deckId(), "size=101").andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/decks/" + owner.deckId() + "/progress"))
                .andExpect(status().isUnauthorized());

        jdbc.update("UPDATE bo_the SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", Long.valueOf(owner.deckId()));
        progress(owner, owner.deckId(), "").andExpect(status().isNotFound());
    }

    @Test
    void fr06_suspendCoversBothDirectionsAndKeepsCardOutOfQueues() throws Exception {
        Learner learner = learner();
        setNewPerDay(learner, 10);
        long paused = card(learner, "paused");
        long active = card(learner, "active");

        suspend(learner, paused, true)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.theId").value(String.valueOf(paused)))
                .andExpect(jsonPath("$.tamNgung").value(true))
                .andExpect(jsonPath("$.chieu.EN_VI.trangThai").value("TAM_NGUNG"))
                .andExpect(jsonPath("$.chieu.VI_EN.trangThai").value("TAM_NGUNG"))
                .andExpect(jsonPath("$.chieu.EN_VI.version").value(0));
        suspend(learner, paused, true)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chieu.EN_VI.version").value(0))
                .andExpect(jsonPath("$.chieu.VI_EN.version").value(0));

        for (String direction : new String[]{"EN_VI", "VI_EN"}) {
            mockMvc.perform(post("/api/v1/learning/sessions").cookie(learner.session()).with(xsrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(toJson(Map.of("chieuHoc", direction, "quyThoiGian", 5))))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.hangDoi.length()").value(1))
                    .andExpect(jsonPath("$.hangDoi[0].theId").value(String.valueOf(active)));
        }
        mockMvc.perform(get("/api/v1/learning/today").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soTheMoiDaHoc").value(0));

        suspend(learner, paused, false)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tamNgung").value(false))
                .andExpect(jsonPath("$.chieu.EN_VI.trangThai").value("MOI"))
                .andExpect(jsonPath("$.chieu.VI_EN.trangThai").value("MOI"))
                .andExpect(jsonPath("$.chieu.EN_VI.version").value(1));
        suspend(learner, paused, false)
                .andExpect(jsonPath("$.chieu.EN_VI.version").value(1));
    }

    @Test
    void fr06_resumeRestoresStatusAndKeepsDueDate() throws Exception {
        Learner learner = learner();
        setNewPerDay(learner, 10);
        long reviewed = card(learner, "reviewed");
        long relearning = card(learner, "relearning");
        String session = createSession(learner, "EN_VI");
        review(learner, session, reviewed, "EN_VI", "DE", 0).andExpect(status().isCreated());
        LocalDateTime relearnDue = LocalDateTime.ofInstant(
                clock.instant().plus(Duration.ofMinutes(10)), ZoneOffset.UTC);
        jdbc.update("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai, "
                        + "so_lan_quen, han_on_at) VALUES (?, ?, 'EN_VI', 'HOC_LAI', 1, ?)",
                learner.id(), relearning, relearnDue);
        String dueBefore = dueAt(learner, reviewed, "EN_VI");

        suspend(learner, reviewed, true)
                .andExpect(jsonPath("$.chieu.EN_VI.trangThai").value("TAM_NGUNG"))
                .andExpect(jsonPath("$.chieu.EN_VI.version").value(2))
                .andExpect(jsonPath("$.chieu.VI_EN.version").value(0));
        suspend(learner, reviewed, false)
                .andExpect(jsonPath("$.chieu.EN_VI.trangThai").value("ON_TAP"))
                .andExpect(jsonPath("$.chieu.EN_VI.khoangOnNgay").value(4))
                .andExpect(jsonPath("$.chieu.EN_VI.version").value(3))
                .andExpect(jsonPath("$.chieu.VI_EN.trangThai").value("MOI"));
        assertThat(dueAt(learner, reviewed, "EN_VI")).isEqualTo(dueBefore);

        suspend(learner, relearning, true).andExpect(status().isOk());
        suspend(learner, relearning, false)
                .andExpect(jsonPath("$.chieu.EN_VI.trangThai").value("HOC_LAI"))
                .andExpect(jsonPath("$.chieu.EN_VI.soLanQuen").value(1));
    }

    @Test
    void fr06_resetReturnsCardToNewKeepsHistoryAndInvalidatesOpenSessions() throws Exception {
        Learner learner = learner();
        setNewPerDay(learner, 10);
        long word = card(learner, "word");
        String tabA = createSession(learner, "EN_VI");
        String tabB = createSession(learner, "EN_VI");
        review(learner, tabA, word, "EN_VI", "DE", 0).andExpect(status().isCreated());

        reset(learner, word, Map.of())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("xacNhan"));
        reset(learner, word, Map.of("xacNhan", false))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("xacNhan"));

        reset(learner, word, Map.of("xacNhan", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tamNgung").value(false))
                .andExpect(jsonPath("$.chieu.EN_VI.trangThai").value("MOI"))
                .andExpect(jsonPath("$.chieu.EN_VI.khoangOnNgay").value(0))
                .andExpect(jsonPath("$.chieu.EN_VI.version").value(2))
                .andExpect(jsonPath("$.chieu.VI_EN.version").value(0));
        reset(learner, word, Map.of("xacNhan", true))
                .andExpect(jsonPath("$.chieu.EN_VI.version").value(2));

        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM lich_su_on WHERE nguoi_dung_id = ?",
                Integer.class, learner.id())).isEqualTo(1);

        review(learner, tabB, word, "EN_VI", "NHO", 1)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VERSION_CONFLICT"));
        review(learner, tabB, word, "EN_VI", "NHO", 2)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.truoc.trangThai").value("MOI"));

        suspend(learner, word, true).andExpect(status().isOk());
        reset(learner, word, Map.of("xacNhan", true))
                .andExpect(jsonPath("$.tamNgung").value(false))
                .andExpect(jsonPath("$.chieu.EN_VI.trangThai").value("MOI"))
                .andExpect(jsonPath("$.chieu.VI_EN.trangThai").value("MOI"));
    }

    @Test
    void fr06_suspendAndResetOnlyForOwnActiveCards() throws Exception {
        Learner owner = learner();
        Learner stranger = learner();
        long word = card(owner, "word");
        long removed = card(owner, "removed");
        jdbc.update("UPDATE the_tu_vung SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", removed);

        suspend(stranger, word, true).andExpect(status().isNotFound());
        reset(stranger, word, Map.of("xacNhan", true)).andExpect(status().isNotFound());
        suspend(owner, removed, true).andExpect(status().isNotFound());
        reset(owner, removed, Map.of("xacNhan", true)).andExpect(status().isNotFound());
        suspend(owner, 999_999_999L, true).andExpect(status().isNotFound());
        mockMvc.perform(put("/api/v1/cards/" + word + "/progress/suspend").with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("tamNgung", true))))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/v1/cards/" + word + "/progress/suspend")
                        .cookie(owner.session()).with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("tamNgung"));

        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM tien_do_the WHERE nguoi_dung_id IN (?, ?)",
                Integer.class, owner.id(), stranger.id())).isZero();
    }

    private ResultActions progress(Learner learner, String deckId, String query) throws Exception {
        return mockMvc.perform(get("/api/v1/decks/" + deckId + "/progress?" + query)
                .cookie(learner.session()));
    }

    private ResultActions suspend(Learner learner, long card, boolean value) throws Exception {
        return mockMvc.perform(put("/api/v1/cards/" + card + "/progress/suspend")
                .cookie(learner.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("tamNgung", value))));
    }

    private ResultActions reset(Learner learner, long card, Map<String, Object> body) throws Exception {
        return mockMvc.perform(post("/api/v1/cards/" + card + "/progress/reset")
                .cookie(learner.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private ResultActions review(
            Learner learner, String session, long card, String direction,
            String rating, long version) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("clientEventId", "evt-" + UUID.randomUUID());
        body.put("theId", String.valueOf(card));
        body.put("chieuHoc", direction);
        body.put("danhGia", rating);
        body.put("expectedVersion", version);
        body.put("thoiGianTraLoiMs", 4200);
        return mockMvc.perform(post("/api/v1/learning/sessions/" + session + "/reviews")
                .cookie(learner.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private void addReview(Learner learner, long card, String direction, Instant dueAt) {
        jdbc.update("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai, "
                        + "khoang_on_ngay, chuoi_thanh_cong, han_on_at) VALUES (?, ?, ?, 'ON_TAP', 3, 1, ?)",
                learner.id(), card, direction, LocalDateTime.ofInstant(dueAt, ZoneOffset.UTC));
    }

    private String dueAt(Learner learner, long card, String direction) {
        return jdbc.queryForObject(
                "SELECT CAST(han_on_at AS CHAR) FROM tien_do_the "
                        + "WHERE nguoi_dung_id = ? AND the_id = ? AND chieu_hoc = ?",
                String.class, learner.id(), card, direction);
    }

    private String createSession(Learner learner, String direction) throws Exception {
        MvcResult result = send(learner.session(), "/api/v1/learning/sessions",
                Map.of("chieuHoc", direction, "quyThoiGian", 5))
                .andExpect(status().isCreated()).andReturn();
        return idOf(result);
    }

    private void setNewPerDay(Learner learner, int value) {
        settingsService.learning(learner.id());
        jdbc.update("UPDATE ho_so_hoc_tap SET tu_moi_moi_ngay = ? WHERE nguoi_dung_id = ?", value, learner.id());
    }

    private Learner learner() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Progress tester", passwords.encode(PASSWORD),
                HCM, roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long userId = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        MvcResult deck = send(session, "/api/v1/decks", Map.of(
                "ten", "Progress deck " + UUID.randomUUID(),
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
