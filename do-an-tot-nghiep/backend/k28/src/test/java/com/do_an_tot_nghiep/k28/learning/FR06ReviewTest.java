package com.do_an_tot_nghiep.k28.learning;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.account.service.SettingsService;
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

class FR06ReviewTest extends AbstractIntegrationTest {

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
    void tc05_twoDirectionsAreIndependentAndShareOneNewCardSlot() throws Exception {
        Learner learner = learner();
        long card = card(learner, "word");

        String enVi = createSession(learner, "EN_VI");
        review(learner, enVi, "evt-" + uuid(), card, "EN_VI", "NHO", 0)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.theId").value(String.valueOf(card)))
                .andExpect(jsonPath("$.truoc.trangThai").value("MOI"))
                .andExpect(jsonPath("$.truoc.version").value(0))
                .andExpect(jsonPath("$.tienDo.trangThai").value("DANG_HOC"))
                .andExpect(jsonPath("$.tienDo.buocHoc").value(1))
                .andExpect(jsonPath("$.tienDo.version").value(1))
                .andExpect(jsonPath("$.laiTrongPhien").value(false));

        String viEn = createSession(learner, "VI_EN");
        review(learner, viEn, "evt-" + uuid(), card, "VI_EN", "DE", 0)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tienDo.trangThai").value("ON_TAP"))
                .andExpect(jsonPath("$.tienDo.khoangOnNgay").value(4))
                .andExpect(jsonPath("$.tienDo.chuoiThanhCong").value(1));

        assertThat(progressStatus(learner, card, "EN_VI")).isEqualTo("DANG_HOC");
        assertThat(progressStatus(learner, card, "VI_EN")).isEqualTo("ON_TAP");
        assertThat(usageSum(learner, "so_the_moi")).isEqualTo(1);
        assertThat(usageSum(learner, "so_luot_hop_le")).isEqualTo(2);
        assertThat(count("lich_su_on", learner)).isEqualTo(2);
    }

    @Test
    void tc08_duplicateEventReturnsStoredResultWithoutRecounting() throws Exception {
        Learner learner = learner();
        long card = card(learner, "word");
        String session = createSession(learner, "EN_VI");
        String event = "evt-" + uuid();

        review(learner, session, event, card, "EN_VI", "DE", 0)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tienDo.version").value(1));
        review(learner, session, event, card, "EN_VI", "DE", 0)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientEventId").value(event))
                .andExpect(jsonPath("$.truoc.trangThai").value("MOI"))
                .andExpect(jsonPath("$.tienDo.trangThai").value("ON_TAP"))
                .andExpect(jsonPath("$.tienDo.version").value(1));
        review(learner, session, event, card, "EN_VI", "QUEN", 0)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));

        assertThat(count("lich_su_on", learner)).isEqualTo(1);
        assertThat(usageSum(learner, "so_luot_hop_le")).isEqualTo(1);
        assertThat(usageSum(learner, "so_the_moi")).isEqualTo(1);
        assertThat(progressVersion(learner, card, "EN_VI")).isEqualTo(1L);
    }

    @Test
    void tc08_secondTabWithStaleVersionGetsConflict() throws Exception {
        Learner learner = learner();
        long card = card(learner, "word");
        String tabA = createSession(learner, "EN_VI");
        String tabB = createSession(learner, "EN_VI");

        review(learner, tabA, "evt-" + uuid(), card, "EN_VI", "NHO", 0)
                .andExpect(status().isCreated());
        review(learner, tabB, "evt-" + uuid(), card, "EN_VI", "DE", 0)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VERSION_CONFLICT"));

        assertThat(count("lich_su_on", learner)).isEqualTo(1);
        assertThat(progressStatus(learner, card, "EN_VI")).isEqualTo("DANG_HOC");

        review(learner, tabB, "evt-" + uuid(), card, "EN_VI", "NHO", 1)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.truoc.version").value(1))
                .andExpect(jsonPath("$.tienDo.trangThai").value("ON_TAP"))
                .andExpect(jsonPath("$.tienDo.khoangOnNgay").value(1))
                .andExpect(jsonPath("$.tienDo.version").value(2));
    }

    @Test
    void fr06_forgottenCardGoesToEndOfQueueAndKeepsUniqueOrder() throws Exception {
        Learner learner = learner();
        setNewPerDay(learner, 10);
        long first = card(learner, "first");
        long second = card(learner, "second");
        String session = createSession(learner, "EN_VI");

        review(learner, session, "evt-" + uuid(), first, "EN_VI", "QUEN", 0)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tienDo.trangThai").value("DANG_HOC"))
                .andExpect(jsonPath("$.laiTrongPhien").value(true));

        mockMvc.perform(get("/api/v1/learning/sessions/" + session).cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hangDoi[?(@.theId == '" + first + "')].thuTu").value(3))
                .andExpect(jsonPath("$.hangDoi[?(@.theId == '" + first + "')].trangThai")
                        .value("CHUA_TRA_LOI"));

        review(learner, session, "evt-" + uuid(), second, "EN_VI", "DE", 0)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.laiTrongPhien").value(false));
        mockMvc.perform(get("/api/v1/learning/sessions/" + session).cookie(learner.session()))
                .andExpect(jsonPath("$.hangDoi[?(@.theId == '" + second + "')].trangThai")
                        .value("DA_TRA_LOI"));

        review(learner, session, "evt-" + uuid(), first, "EN_VI", "NHO", 1)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.tienDo.version").value(2));
    }

    @Test
    void tc09_newCardQuotaIsCheckedAtWriteTimeAndOnlyOncePerPhysicalCard() throws Exception {
        Learner learner = learner();
        setNewPerDay(learner, 2);
        long a = card(learner, "a");
        long b = card(learner, "b");
        String session = createSession(learner, "EN_VI");
        setNewPerDay(learner, 1);

        review(learner, session, "evt-" + uuid(), a, "EN_VI", "DE", 0)
                .andExpect(status().isCreated());
        review(learner, session, "evt-" + uuid(), b, "EN_VI", "DE", 0)
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));

        assertThat(usageSum(learner, "so_the_moi")).isEqualTo(1);
        assertThat(usageSum(learner, "so_luot_hop_le")).isEqualTo(1);
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM tien_do_the WHERE nguoi_dung_id = ? AND the_id = ?",
                Integer.class, learner.id(), b)).isZero();
        assertThat(count("lich_su_on", learner)).isEqualTo(1);
    }

    @Test
    void tc09_usageDayFollowsSessionTimeZone() throws Exception {
        Learner learner = learner();
        long card = card(learner, "word");
        String session = createSession(learner, "EN_VI");
        jdbc.update("UPDATE phien_hoc SET mui_gio = ? WHERE id = ?",
                "Pacific/Kiritimati", Long.valueOf(session));

        review(learner, session, "evt-" + uuid(), card, "EN_VI", "DE", 0)
                .andExpect(status().isCreated());

        LocalDate expected = LocalDate.ofInstant(clock.instant(), ZoneId.of("Pacific/Kiritimati"));
        assertThat(jdbc.queryForObject(
                "SELECT COUNT(*) FROM su_dung_hoc_ngay WHERE nguoi_dung_id = ? "
                        + "AND ngay_dia_phuong = ? AND so_luot_hop_le = 1",
                Integer.class, learner.id(), expected)).isEqualTo(1);
    }

    @Test
    void fr06_rejectsForeignSessionWrongDirectionAndCardOutsideQueue() throws Exception {
        Learner owner = learner();
        Learner stranger = learner();
        long inQueue = card(owner, "in");
        String session = createSession(owner, "EN_VI");
        long outside = card(owner, "outside");

        review(stranger, session, "evt-" + uuid(), inQueue, "EN_VI", "NHO", 0)
                .andExpect(status().isNotFound());
        review(owner, "999999999", "evt-" + uuid(), inQueue, "EN_VI", "NHO", 0)
                .andExpect(status().isNotFound());
        review(owner, session, "evt-" + uuid(), inQueue, "VI_EN", "NHO", 0)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("chieuHoc"));
        review(owner, session, "evt-" + uuid(), outside, "EN_VI", "NHO", 0)
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));

        assertThat(count("lich_su_on", owner)).isZero();
        assertThat(count("lich_su_on", stranger)).isZero();
    }

    @Test
    void fr06_rejectsAnsweredCardEndedSessionDeletedAndSuspendedCards() throws Exception {
        Learner learner = learner();
        setNewPerDay(learner, 10);
        long answered = card(learner, "answered");
        long deleted = card(learner, "deleted");
        long suspended = card(learner, "suspended");
        String session = createSession(learner, "EN_VI");

        review(learner, session, "evt-" + uuid(), answered, "EN_VI", "DE", 0)
                .andExpect(status().isCreated());
        review(learner, session, "evt-" + uuid(), answered, "EN_VI", "DE", 1)
                .andExpect(status().isUnprocessableContent());

        jdbc.update("UPDATE the_tu_vung SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", deleted);
        review(learner, session, "evt-" + uuid(), deleted, "EN_VI", "NHO", 0)
                .andExpect(status().isUnprocessableContent());

        jdbc.update("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai) "
                + "VALUES (?, ?, 'EN_VI', 'TAM_NGUNG')", learner.id(), suspended);
        review(learner, session, "evt-" + uuid(), suspended, "EN_VI", "NHO", 0)
                .andExpect(status().isUnprocessableContent());

        jdbc.update("UPDATE phien_hoc SET trang_thai = 'KET_THUC', "
                + "ket_thuc_at = DATE_ADD(bat_dau_at, INTERVAL 1 SECOND) WHERE id = ?", Long.valueOf(session));
        review(learner, session, "evt-" + uuid(), suspended, "EN_VI", "NHO", 0)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));

        assertThat(count("lich_su_on", learner)).isEqualTo(1);
    }

    @Test
    void fr06_validatesBodyAndRequiresLogin() throws Exception {
        Learner learner = learner();
        long card = card(learner, "word");
        String session = createSession(learner, "EN_VI");

        mockMvc.perform(post("/api/v1/learning/sessions/" + session + "/reviews").with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(body("evt-1", card, "EN_VI", "NHO", 0, 1000))))
                .andExpect(status().isUnauthorized());

        Map<String, Object> bad = body("bad id!", card, "EN_VI", "NHO", 0, 1000);
        bad.put("danhGia", null);
        bad.put("expectedVersion", -1);
        submit(learner, session, bad)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'clientEventId')]").exists())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'danhGia')]").exists())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'expectedVersion')]").exists());

        review(learner, session, "evt-" + uuid(), card, "EN_VI", "NHO", 0, 9_999_999)
                .andExpect(status().isCreated());
        assertThat(jdbc.queryForObject(
                "SELECT thoi_gian FROM lich_su_on WHERE nguoi_dung_id = ?",
                Integer.class, learner.id())).isEqualTo(120000);
    }

    private ResultActions review(
            Learner learner, String session, String event, long card,
            String direction, String rating, long version) throws Exception {
        return review(learner, session, event, card, direction, rating, version, 4200);
    }

    private ResultActions review(
            Learner learner, String session, String event, long card,
            String direction, String rating, long version, long ms) throws Exception {
        return submit(learner, session, body(event, card, direction, rating, version, ms));
    }

    private ResultActions submit(Learner learner, String session, Map<String, Object> body) throws Exception {
        return mockMvc.perform(post("/api/v1/learning/sessions/" + session + "/reviews")
                .cookie(learner.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private Map<String, Object> body(
            String event, long card, String direction, String rating, long version, long ms) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("clientEventId", event);
        body.put("theId", String.valueOf(card));
        body.put("chieuHoc", direction);
        body.put("danhGia", rating);
        body.put("expectedVersion", version);
        body.put("thoiGianTraLoiMs", ms);
        return body;
    }

    private String createSession(Learner learner, String direction) throws Exception {
        MvcResult result = send(learner.session(), "/api/v1/learning/sessions",
                Map.of("chieuHoc", direction, "quyThoiGian", 5))
                .andExpect(status().isCreated()).andReturn();
        return idOf(result);
    }

    private String progressStatus(Learner learner, long card, String direction) {
        return jdbc.queryForObject(
                "SELECT trang_thai FROM tien_do_the WHERE nguoi_dung_id = ? AND the_id = ? AND chieu_hoc = ?",
                String.class, learner.id(), card, direction);
    }

    private Long progressVersion(Learner learner, long card, String direction) {
        return jdbc.queryForObject(
                "SELECT version FROM tien_do_the WHERE nguoi_dung_id = ? AND the_id = ? AND chieu_hoc = ?",
                Long.class, learner.id(), card, direction);
    }

    private int usageSum(Learner learner, String column) {
        return jdbc.queryForObject(
                "SELECT COALESCE(SUM(" + column + "), 0) FROM su_dung_hoc_ngay WHERE nguoi_dung_id = ?",
                Integer.class, learner.id());
    }

    private int count(String table, Learner learner) {
        return jdbc.queryForObject(
                "SELECT COUNT(*) FROM " + table + " WHERE nguoi_dung_id = ?",
                Integer.class, learner.id());
    }

    private void setNewPerDay(Learner learner, int value) {
        settingsService.learning(learner.id());
        jdbc.update("UPDATE ho_so_hoc_tap SET tu_moi_moi_ngay = ? WHERE nguoi_dung_id = ?", value, learner.id());
    }

    private String uuid() {
        return UUID.randomUUID().toString();
    }

    private Learner learner() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Review tester", passwords.encode(PASSWORD),
                HCM, roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long userId = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        MvcResult deck = send(session, "/api/v1/decks", Map.of(
                "ten", "Review deck " + UUID.randomUUID(),
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
