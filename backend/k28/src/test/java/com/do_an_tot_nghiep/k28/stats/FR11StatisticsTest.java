package com.do_an_tot_nghiep.k28.stats;

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
import com.do_an_tot_nghiep.k28.learning.dto.TodayQuery;
import com.do_an_tot_nghiep.k28.learning.repository.PhienHocRepository;
import com.do_an_tot_nghiep.k28.learning.repository.PhienHocTheRepository;
import com.do_an_tot_nghiep.k28.learning.repository.SuDungHocNgayRepository;
import com.do_an_tot_nghiep.k28.learning.repository.TienDoTheRepository;
import com.do_an_tot_nghiep.k28.learning.service.LearningPlanService;
import com.do_an_tot_nghiep.k28.learning.service.StudyTimeService;
import com.do_an_tot_nghiep.k28.stats.dto.OverviewQuery;
import com.do_an_tot_nghiep.k28.stats.dto.StatisticsOverviewResponse;
import com.do_an_tot_nghiep.k28.stats.dto.TheoNgayResponse;
import com.do_an_tot_nghiep.k28.stats.repository.StatisticsRepository;
import com.do_an_tot_nghiep.k28.stats.service.StatisticsService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
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

class FR11StatisticsTest extends AbstractIntegrationTest {

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
    StudyTimeService studyTime;
    @Autowired
    LearningPlanService learningPlanService;
    @Autowired
    StatisticsRepository statistics;

    @Test
    void tc09_overviewSplitsLocalDaysCountsCardsOnceAndMatchesToday() throws Exception {
        Learner learner = learner();
        Learner stranger = learner();
        long a = card(learner, learner.deckId(), "a");
        long b = card(learner, learner.deckId(), "b");
        long session = session(learner, "2026-10-18T16:00:00Z");
        long aEnVi = addProgress(learner, a, "EN_VI");
        long aViEn = addProgress(learner, a, "VI_EN");
        long bEnVi = addProgress(learner, b, "EN_VI");
        review(learner, session, aEnVi, "NHO", 120000, "2026-10-18T16:59:59Z");
        review(learner, session, aViEn, "QUEN", 61000, "2026-10-18T17:00:00Z");
        review(learner, session, aEnVi, "NHO", 60000, "2026-10-19T04:00:00Z");
        review(learner, session, bEnVi, "DE", 30000, "2026-10-19T04:10:00Z");
        attempt(learner, practice(learner, learner.deckId(), false), 4, 5, 600000, "2026-10-19T04:30:00Z");
        long foreign = addProgress(stranger, card(stranger, stranger.deckId(), "x"), "EN_VI");
        review(stranger, session(stranger, "2026-10-19T03:00:00Z"), foreign, "NHO", 50000, "2026-10-19T03:05:00Z");
        jdbc.update("INSERT INTO su_dung_hoc_ngay (nguoi_dung_id, ngay_dia_phuong, so_the_moi, so_luot_hop_le) "
                + "VALUES (?, ?, 0, 5), (?, ?, 0, 5)", learner.id(), LocalDate.parse("2026-10-18"),
                learner.id(), LocalDate.parse("2026-10-19"));

        StatisticsOverviewResponse overview = overviewAt(learner, "2026-10-13", "2026-10-19", null);

        assertThat(overview.muiGio()).isEqualTo(HCM);
        assertThat(overview.theoNgay()).extracting(TheoNgayResponse::ngay)
                .containsExactly(LocalDate.parse("2026-10-13"), LocalDate.parse("2026-10-14"),
                        LocalDate.parse("2026-10-15"), LocalDate.parse("2026-10-16"),
                        LocalDate.parse("2026-10-17"), LocalDate.parse("2026-10-18"),
                        LocalDate.parse("2026-10-19"));
        assertThat(overview.theoNgay()).extracting(TheoNgayResponse::soLuotOn).containsExactly(0, 0, 0, 0, 0, 1, 3);
        assertThat(overview.theoNgay()).extracting(TheoNgayResponse::soCauLuyen).containsExactly(0, 0, 0, 0, 0, 0, 5);
        assertThat(overview.theoNgay()).extracting(TheoNgayResponse::thoiGian)
                .containsExactly(0L, 0L, 0L, 0L, 0L, 120000L, 751000L);
        assertThat(overview.theoNgay()).extracting(TheoNgayResponse::soPhut).containsExactly(0, 0, 0, 0, 0, 2, 12);
        assertThat(overview.soTuDaHoc()).isEqualTo(2);
        assertThat(overview.soLuotOn()).isEqualTo(4);
        assertThat(overview.tyLeNho()).isEqualTo(75);
        assertThat(overview.baiLuyen().soBai()).isEqualTo(1);
        assertThat(overview.baiLuyen().soCauDung()).isEqualTo(4);
        assertThat(overview.baiLuyen().tongSoCau()).isEqualTo(5);
        assertThat(overview.baiLuyen().tyLeDung()).isEqualTo(80);
        assertThat(overview.tongPhut()).isEqualTo(14);
        assertThat(overview.soNgayCoHoc()).isEqualTo(2);

        TodayPlanResponse plan = planAt(learner);
        TheoNgayResponse homNay = overview.theoNgay().get(6);
        assertThat(homNay.thoiGian()).isEqualTo(plan.daHocHomNay().thoiGian());
        assertThat(homNay.soPhut()).isEqualTo(plan.daHocHomNay().soPhut());
        assertThat(overview.phutMoiNgay()).isEqualTo(plan.phutMoiNgay());
        assertThat(overview.chuoiNgay()).isEqualTo(plan.chuoiNgay()).isEqualTo(2);
        assertThat(overview.soNgayDatMucTieu()).isEqualTo(Math.toIntExact(overview.theoNgay().stream()
                .filter(day -> day.thoiGian() >= plan.phutMoiNgay() * 60_000L)
                .count()));

        StatisticsOverviewResponse other = overviewAt(stranger, "2026-10-19", "2026-10-19", null);
        assertThat(other.soLuotOn()).isEqualTo(1);
        assertThat(other.theoNgay().get(0).thoiGian()).isEqualTo(50000);
    }

    @Test
    void tc09_overviewUsesCurrentZoneAfterChange() throws Exception {
        Learner learner = learner();
        long a = card(learner, learner.deckId(), "zone");
        long progressId = addProgress(learner, a, "EN_VI");
        long session = session(learner, "2026-10-18T16:00:00Z");
        review(learner, session, progressId, "NHO", 60000, "2026-10-18T16:59:59Z");
        review(learner, session, progressId, "NHO", 60000, "2026-10-18T17:00:00Z");

        assertThat(overviewAt(learner, "2026-10-18", "2026-10-19", null).theoNgay())
                .extracting(TheoNgayResponse::soLuotOn).containsExactly(1, 1);

        jdbc.update("UPDATE nguoi_dung SET mui_gio = 'UTC' WHERE id = ?", learner.id());
        StatisticsOverviewResponse utc = overviewAt(learner, "2026-10-18", "2026-10-19", null);
        assertThat(utc.muiGio()).isEqualTo("UTC");
        assertThat(utc.theoNgay()).extracting(TheoNgayResponse::soLuotOn).containsExactly(2, 0);
        assertThat(utc.theoNgay()).extracting(TheoNgayResponse::thoiGian).containsExactly(120000L, 0L);
    }

    @Test
    void fr11_overviewDeckFilterSeparatesDecksAndPractices() throws Exception {
        Learner learner = learner();
        String otherDeck = createDeck(learner.session());
        long session = session(learner, "2026-10-19T00:00:00Z");
        long mine = addProgress(learner, card(learner, learner.deckId(), "mine"), "EN_VI");
        long other = addProgress(learner, card(learner, otherDeck, "other"), "EN_VI");
        review(learner, session, mine, "NHO", 60000, "2026-10-19T01:00:00Z");
        review(learner, session, other, "QUEN", 60000, "2026-10-19T01:05:00Z");
        attempt(learner, practice(learner, learner.deckId(), true), 2, 2, 60000, "2026-10-19T02:00:00Z");
        attempt(learner, practice(learner, null, false), 1, 3, 60000, "2026-10-19T02:30:00Z");

        StatisticsOverviewResponse deck = overviewAt(learner, "2026-10-19", "2026-10-19", learner.deckId());
        assertThat(deck.boTheId()).isEqualTo(learner.deckId());
        assertThat(deck.soLuotOn()).isEqualTo(1);
        assertThat(deck.tyLeNho()).isEqualTo(100);
        assertThat(deck.baiLuyen().soBai()).isEqualTo(1);
        assertThat(deck.baiLuyen().tongSoCau()).isEqualTo(2);
        assertThat(deck.theoNgay().get(0).thoiGian()).isEqualTo(120000);

        StatisticsOverviewResponse all = overviewAt(learner, "2026-10-19", "2026-10-19", null);
        assertThat(all.soLuotOn()).isEqualTo(2);
        assertThat(all.tyLeNho()).isEqualTo(50);
        assertThat(all.baiLuyen().soBai()).isEqualTo(2);
        assertThat(all.baiLuyen().tyLeDung()).isEqualTo(60);
        assertThat(all.theoNgay().get(0).thoiGian()).isEqualTo(240000);

        jdbc.update("UPDATE the_tu_vung SET xoa_at = ? WHERE bo_the_id = ?", utc(NOW), Long.valueOf(otherDeck));
        assertThat(overviewAt(learner, "2026-10-19", "2026-10-19", null).soLuotOn()).isEqualTo(2);
    }

    @Test
    void fr11_overviewDefaultsAndRejectsBadRangesAndForeignDecks() throws Exception {
        Learner learner = learner();
        Learner stranger = learner();
        String deleted = createDeck(learner.session());
        jdbc.update("UPDATE bo_the SET xoa_at = ? WHERE id = ?", utc(NOW), Long.valueOf(deleted));
        LocalDate today = LocalDate.ofInstant(clock.instant(), ZoneId.of(HCM));

        mockMvc.perform(get("/api/v1/statistics/overview").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.denNgay").value(today.toString()))
                .andExpect(jsonPath("$.tuNgay").value(today.minusDays(6).toString()))
                .andExpect(jsonPath("$.boTheId").doesNotExist())
                .andExpect(jsonPath("$.tyLeNho").doesNotExist())
                .andExpect(jsonPath("$.baiLuyen.tyLeDung").doesNotExist())
                .andExpect(jsonPath("$.theoNgay.length()").value(7))
                .andExpect(jsonPath("$.theoNgay[6].ngay").value(today.toString()))
                .andExpect(jsonPath("$.theoNgay[6].soLuotOn").value(0))
                .andExpect(jsonPath("$.theoNgay[6].thoiGian").value(0))
                .andExpect(jsonPath("$.theoNgay[6].soPhut").value(0));

        mockMvc.perform(get("/api/v1/statistics/overview").cookie(learner.session())
                        .param("tuNgay", today.minusDays(89).toString()).param("denNgay", today.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.theoNgay.length()").value(90));
        expectBadRequest(learner, "tuNgay", today.minusDays(90).toString(), "denNgay", today.toString());
        expectBadRequest(learner, "tuNgay", today.toString(), "denNgay", today.minusDays(1).toString());
        expectBadRequest(learner, "tuNgay", today.toString(), "denNgay", today.plusDays(1).toString());
        expectBadRequest(learner, "tuNgay", "2026-02-30", "denNgay", today.toString());
        expectBadRequest(learner, "tuNgay", "19/10/2026", "denNgay", today.toString());
        mockMvc.perform(get("/api/v1/statistics/overview").cookie(learner.session()).param("boTheId", "abc"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/v1/statistics/overview").cookie(learner.session())
                        .param("boTheId", stranger.deckId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        mockMvc.perform(get("/api/v1/statistics/overview").cookie(learner.session()).param("boTheId", deleted))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/statistics/skills").cookie(learner.session())
                        .param("boTheId", stranger.deckId()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/statistics/overview")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/statistics/skills")).andExpect(status().isUnauthorized());
    }

    @Test
    void fr11_skillsWeightRecentAnswersAndSplitFirstFromRetry() throws Exception {
        Learner learner = learner();
        Learner stranger = learner();
        long a = card(learner, learner.deckId(), "a");
        String otherDeck = createDeck(learner.session());
        long other = card(learner, otherDeck, "other");

        long first = practice(learner, learner.deckId(), false);
        long firstAttempt = attempt(learner, first, 0, 3, 60000, "2026-10-18T01:00:00Z");
        for (int i = 1; i <= 3; i++) {
            answer(firstAttempt, first, i, "CHON_NGHIA", a, false);
        }
        long retry = practice(learner, learner.deckId(), true);
        long retryAttempt = attempt(learner, retry, 3, 3, 60000, "2026-10-19T01:00:00Z");
        answer(retryAttempt, retry, 1, "CHON_TU", a, true);
        answer(retryAttempt, retry, 2, "CHON_NGHIA", a, true);
        answer(retryAttempt, retry, 3, "GHEP_TU", null, true);

        long writing = practice(learner, learner.deckId(), false);
        long writingAttempt = attempt(learner, writing, 3, 4, 60000, "2026-10-19T02:00:00Z");
        for (int i = 1; i <= 4; i++) {
            answer(writingAttempt, writing, i, "NHAP_TU_THEO_NGHIA", a, i != 2);
        }

        long pairs = practice(learner, learner.deckId(), false);
        long pairsAttempt = attempt(learner, pairs, 20, 25, 60000, "2026-10-19T03:00:00Z");
        for (int i = 1; i <= 25; i++) {
            answer(pairsAttempt, pairs, i, "PHAN_BIET_CAP", a, i > 5);
        }

        long context = practice(learner, otherDeck, false);
        answer(attempt(learner, context, 1, 1, 60000, "2026-10-19T04:00:00Z"), context, 1, "DIEN_CHO_TRONG",
                other, true);
        long foreign = practice(stranger, stranger.deckId(), false);
        answer(attempt(stranger, foreign, 1, 1, 60000, "2026-10-19T04:00:00Z"), foreign, 1, "NGHE_VIET",
                card(stranger, stranger.deckId(), "x"), true);

        mockMvc.perform(get("/api/v1/statistics/skills").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(5))
                .andExpect(jsonPath("$[0].kyNang").value("NHAN_NGHIA"))
                .andExpect(jsonPath("$[0].soQuanSat").value(6))
                .andExpect(jsonPath("$[0].soLuotTinh").value(6))
                .andExpect(jsonPath("$[0].duDuLieu").value(true))
                .andExpect(jsonPath("$[0].mucLamChu").value(54))
                .andExpect(jsonPath("$[0].tyLeDungLanDau").value(0))
                .andExpect(jsonPath("$[0].tyLeDungSauLuyenLai").value(100))
                .andExpect(jsonPath("$[0].soQuanSatToiThieu").value(5))
                .andExpect(jsonPath("$[0].nguon").value("BAI_LUYEN"))
                .andExpect(jsonPath("$[1].kyNang").value("VIET"))
                .andExpect(jsonPath("$[1].soQuanSat").value(4))
                .andExpect(jsonPath("$[1].duDuLieu").value(false))
                .andExpect(jsonPath("$[1].mucLamChu").doesNotExist())
                .andExpect(jsonPath("$[1].tyLeDungLanDau").value(75))
                .andExpect(jsonPath("$[1].tyLeDungSauLuyenLai").doesNotExist())
                .andExpect(jsonPath("$[2].kyNang").value("NGHE"))
                .andExpect(jsonPath("$[2].soQuanSat").value(0))
                .andExpect(jsonPath("$[2].tyLeDungLanDau").doesNotExist())
                .andExpect(jsonPath("$[3].kyNang").value("NGU_CANH"))
                .andExpect(jsonPath("$[3].soQuanSat").value(1))
                .andExpect(jsonPath("$[4].kyNang").value("CAP_NHAM"))
                .andExpect(jsonPath("$[4].soQuanSat").value(25))
                .andExpect(jsonPath("$[4].soLuotTinh").value(20))
                .andExpect(jsonPath("$[4].mucLamChu").value(100))
                .andExpect(jsonPath("$[4].tyLeDungLanDau").value(80));

        mockMvc.perform(get("/api/v1/statistics/skills").cookie(learner.session())
                        .param("boTheId", learner.deckId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].soQuanSat").value(6))
                .andExpect(jsonPath("$[3].soQuanSat").value(0));
        mockMvc.perform(get("/api/v1/statistics/skills").cookie(learner.session()).param("boTheId", otherDeck))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].soQuanSat").value(0))
                .andExpect(jsonPath("$[3].soQuanSat").value(1));
        mockMvc.perform(get("/api/v1/statistics/skills").cookie(stranger.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[2].soQuanSat").value(1))
                .andExpect(jsonPath("$[0].soQuanSat").value(0));
    }

    private void expectBadRequest(Learner learner, String k1, String v1, String k2, String v2) throws Exception {
        mockMvc.perform(get("/api/v1/statistics/overview").cookie(learner.session()).param(k1, v1).param(k2, v2))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").exists());
    }

    private StatisticsOverviewResponse overviewAt(Learner learner, String tuNgay, String denNgay, String deckId) {
        return new StatisticsService(fixedClock(), accountService, settingsService, learningPlanService,
                studyTime, statistics).overview(learner.id(), new OverviewQuery(tuNgay, denNgay, deckId));
    }

    private TodayPlanResponse planAt(Learner learner) {
        return new LearningPlanService(fixedClock(), accountService, settingsService, progress, usage,
                sessions, queue, studyTime).today(learner.id(), new TodayQuery(null, null));
    }

    private Clock fixedClock() {
        return Clock.fixed(Instant.parse(NOW), ZoneOffset.UTC);
    }

    private long session(Learner learner, String startedAt) {
        return insert("INSERT INTO phien_hoc (nguoi_dung_id, chieu_hoc, mui_gio, bat_dau_at, ket_thuc_at, "
                        + "trang_thai, quy_thoi_gian) VALUES (?, 'EN_VI', ?, ?, ?, 'KET_THUC', 10)",
                learner.id(), HCM, utc(startedAt), utc(startedAt));
    }

    private void review(Learner learner, long sessionId, long progressId, String rating, int millis, String at) {
        jdbc.update("INSERT INTO lich_su_on (nguoi_dung_id, client_event_id, phien_id, tien_do_id, danh_gia, "
                        + "thoi_gian, truoc_json, sau_json, phien_ban_thuat_toan, created_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?, '{}', '{}', 'SM2-VN-2', ?)",
                learner.id(), UUID.randomUUID().toString(), sessionId, progressId, rating, millis, utc(at));
    }

    private long addProgress(Learner learner, long cardId, String direction) {
        return insert("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai, han_on_at) "
                + "VALUES (?, ?, ?, 'ON_TAP', ?)", learner.id(), cardId, direction, utc("2026-12-01T00:00:00Z"));
    }

    private long practice(Learner learner, String deckId, boolean retry) {
        return insert("INSERT INTO bai_luyen (nguoi_dung_id, loai_bai, bo_the_id, nguon, so_cau_yeu_cau, "
                        + "la_luyen_lai) VALUES (?, 'TONG_HOP', ?, ?, 5, ?)",
                learner.id(), deckId == null ? null : Long.valueOf(deckId), deckId == null ? "SO_TAY" : "BO_THE",
                retry);
    }

    private long attempt(Learner learner, long practiceId, int correct, int total, int millis, String at) {
        return insert("INSERT INTO lan_lam_bai (nguoi_dung_id, bai_id, submit_key, so_cau_dung, tong_so_cau, "
                        + "diem, thoi_gian, nop_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                learner.id(), practiceId, "k-" + UUID.randomUUID(), correct, total, correct * 100 / total, millis,
                utc(at));
    }

    private void answer(long attemptId, long practiceId, int order, String type, Long cardId, boolean correct) {
        long questionId = insert("INSERT INTO cau_hoi_bai_luyen (bai_id, thu_tu, loai_cau, the_id, de_bai_json, "
                        + "dap_an_json, giai_thich_json) VALUES (?, ?, ?, ?, '{}', '{}', '[]')",
                practiceId, order, type, cardId);
        jdbc.update("INSERT INTO tra_loi_bai_luyen (lan_lam_id, cau_hoi_id, dung, ket_qua_json) "
                + "VALUES (?, ?, ?, '{}')", attemptId, questionId, correct);
    }

    private LocalDateTime utc(String instant) {
        return LocalDateTime.ofInstant(Instant.parse(instant), ZoneOffset.UTC);
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

    private Learner learner() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Statistics tester", passwords.encode(PASSWORD),
                HCM, roles.findByMa("USER").orElseThrow());
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
                "ten", "Statistics deck " + UUID.randomUUID(),
                "trinhDo", "CO_BAN",
                "quyenTruyCap", "RIENG_TU")).andExpect(status().isCreated()).andReturn();
        return idOf(result);
    }

    private long card(Learner learner, String deckId, String word) throws Exception {
        MvcResult result = send(learner.session(), "/api/v1/decks/" + deckId + "/cards", Map.of(
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
