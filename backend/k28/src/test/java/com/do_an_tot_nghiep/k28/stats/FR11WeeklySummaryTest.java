package com.do_an_tot_nghiep.k28.stats;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
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
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR11WeeklySummaryTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final ZoneId HCM = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired
    NguoiDungRepository users;

    @Autowired
    VaiTroRepository roles;

    @Autowired
    PasswordEncoder passwords;

    @Autowired
    JdbcTemplate jdbc;

    private record Learner(Long id, Cookie session, String deckId) {
    }

    @Test
    void fr11_weeklySummaryUsesLocalWeekHardWordsSkillsAndPassedWords() throws Exception {
        Learner learner = learner();
        Learner other = learner();
        LocalDate thisMonday = LocalDate.now(HCM).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        LocalDate lastMonday = thisMonday.minusWeeks(1);
        long passed = card(learner, "receipt");
        long hard = card(learner, "appointment");
        long fresh = card(learner, "budget");
        long passedProgress = progress(learner, passed);
        long hardProgress = progress(learner, hard);
        long freshProgress = progress(learner, fresh);

        Instant old = at(lastMonday.minusDays(10), 9);
        long oldSession = session(learner, old);
        for (int i = 0; i < 5; i++) {
            review(learner, oldSession, passedProgress, i < 3 ? "QUEN" : "NHO", old.plusSeconds(60L * i));
        }
        Instant tuesday = at(lastMonday.plusDays(1), 9);
        long tuesdaySession = session(learner, tuesday);
        for (int i = 0; i < 5; i++) {
            review(learner, tuesdaySession, passedProgress, "NHO", tuesday.plusSeconds(60L * i));
        }
        Instant wednesday = at(lastMonday.plusDays(2), 9);
        long wednesdaySession = session(learner, wednesday);
        for (int i = 0; i < 4; i++) {
            review(learner, wednesdaySession, hardProgress, i < 3 ? "QUEN" : "NHO", wednesday.plusSeconds(60L * i));
        }
        review(learner, wednesdaySession, freshProgress, "NHO", wednesday.plusSeconds(600));
        review(learner, wednesdaySession, freshProgress, "NHO", wednesday.plusSeconds(660));
        Instant afterWeek = thisMonday.atStartOfDay(HCM).toInstant().plusSeconds(1);
        review(learner, session(learner, afterWeek), passedProgress, "QUEN", afterWeek);

        long weekBefore = attempt(learner, practice(learner), 2, 5, at(lastMonday.minusDays(5), 9));
        for (int i = 0; i < 5; i++) {
            answer(weekBefore, i + 1, null, i < 2);
        }
        long thursday = attempt(learner, practice(learner), 5, 6, at(lastMonday.plusDays(3), 9));
        for (int i = 0; i < 5; i++) {
            answer(thursday, i + 1, fresh, true);
        }
        answer(thursday, 6, hard, false);

        JsonNode body = summary(learner, lastMonday.plusDays(3).toString());
        assertThat(body.get("muiGio").asString()).isEqualTo("Asia/Ho_Chi_Minh");
        assertThat(body.get("tuNgay").asString()).isEqualTo(lastMonday.toString());
        assertThat(body.get("denNgay").asString()).isEqualTo(lastMonday.plusDays(6).toString());
        assertThat(body.get("tuanHienTai").asBoolean()).isFalse();
        assertThat(body.get("soTuDaHoc").asInt()).isEqualTo(3);
        assertThat(body.get("soTuMoi").asInt()).isEqualTo(2);
        assertThat(body.get("soLuotOn").asInt()).isEqualTo(11);
        assertThat(body.get("soCauLuyen").asInt()).isEqualTo(6);
        assertThat(body.get("soNgayCoHoc").asInt()).isEqualTo(3);

        JsonNode viet = null;
        for (JsonNode skill : body.get("kyNang")) {
            if (skill.get("kyNang").asString().equals("VIET")) {
                viet = skill;
            } else {
                assertThat(skill.get("tienBo").asBoolean()).isFalse();
            }
        }
        assertThat(viet).isNotNull();
        assertThat(viet.get("soQuanSat").asInt()).isEqualTo(6);
        assertThat(viet.get("tyLeDung").asInt()).isEqualTo(83);
        assertThat(viet.get("soQuanSatTuanTruoc").asInt()).isEqualTo(5);
        assertThat(viet.get("tyLeDungTuanTruoc").asInt()).isEqualTo(40);
        assertThat(viet.get("tienBo").asBoolean()).isTrue();

        assertThat(body.get("tuKho").size()).isEqualTo(1);
        assertThat(body.get("tuKho").get(0).get("theId").asString()).isEqualTo(String.valueOf(hard));
        assertThat(body.get("tuKho").get(0).get("soLanSai").asInt()).isEqualTo(4);
        assertThat(body.get("tuKho").get(0).get("soLuot").asInt()).isEqualTo(5);

        assertThat(body.get("tuDaVuotQua").size()).isEqualTo(1);
        assertThat(body.get("tuDaVuotQua").get(0).get("reasonCode").asString()).isEqualTo("TIEN_BO");
        assertThat(body.get("tuDaVuotQua").get(0).get("cardIds").get(0).asString()).isEqualTo(String.valueOf(passed));

        JsonNode goal = body.get("mucTieuTuanSau");
        assertThat(goal.get("soNgayHoc").asInt()).isEqualTo(4);
        assertThat(goal.get("theIds").get(0).asString()).isEqualTo(String.valueOf(hard));
        assertThat(goal.get("vanBan").asString()).contains("appointment");
        assertThat(body.get("tomTat").asString())
                .contains("3 từ (2 từ mới)").contains("11 lượt").contains("viết").contains("vượt qua 1 từ");

        JsonNode foreign = summary(other, lastMonday.toString());
        assertThat(foreign.get("soLuotOn").asInt()).isZero();
        assertThat(foreign.get("tuKho").size()).isZero();
        assertThat(foreign.get("tuDaVuotQua").size()).isZero();
        assertThat(foreign.get("tomTat").asString()).endsWith("chưa có lượt học nào.");
    }

    @Test
    void fr11_weeklySummaryDefaultsToCurrentWeekAndRejectsBadInput() throws Exception {
        Learner learner = learner();
        LocalDate today = LocalDate.now(HCM);
        JsonNode current = summary(learner, null);
        assertThat(current.get("tuanHienTai").asBoolean()).isTrue();
        assertThat(current.get("tuNgay").asString())
                .isEqualTo(today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toString());
        assertThat(current.get("kyNang").size()).isEqualTo(5);

        mockMvc.perform(get("/api/v1/statistics/weekly-summary").cookie(learner.session())
                        .param("ngay", today.plusWeeks(1).with(DayOfWeek.MONDAY).toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("ngay"));
        mockMvc.perform(get("/api/v1/statistics/weekly-summary").cookie(learner.session()).param("ngay", "2026-02-30"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/statistics/weekly-summary").cookie(learner.session()).param("ngay", "16/11/2026"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/statistics/weekly-summary"))
                .andExpect(status().isUnauthorized());
    }

    private JsonNode summary(Learner learner, String ngay) throws Exception {
        var request = get("/api/v1/statistics/weekly-summary").cookie(learner.session());
        if (ngay != null) {
            request.param("ngay", ngay);
        }
        MvcResult result = mockMvc.perform(request).andExpect(status().isOk()).andReturn();
        return jsonMapper.readTree(result.getResponse().getContentAsString());
    }

    private static Instant at(LocalDate day, int hour) {
        return day.atTime(hour, 0).atZone(HCM).toInstant();
    }

    private long session(Learner learner, Instant startedAt) {
        return insert("INSERT INTO phien_hoc (nguoi_dung_id, chieu_hoc, mui_gio, bat_dau_at, ket_thuc_at, "
                        + "trang_thai, quy_thoi_gian) VALUES (?, 'EN_VI', ?, ?, ?, 'KET_THUC', 10)",
                learner.id(), HCM.getId(), utc(startedAt), utc(startedAt));
    }

    private void review(Learner learner, long sessionId, long progressId, String rating, Instant at) {
        jdbc.update("INSERT INTO lich_su_on (nguoi_dung_id, client_event_id, phien_id, tien_do_id, danh_gia, "
                        + "thoi_gian, truoc_json, sau_json, phien_ban_thuat_toan, created_at) "
                        + "VALUES (?, ?, ?, ?, ?, 4000, '{}', '{}', 'SM2-VN-2', ?)",
                learner.id(), UUID.randomUUID().toString(), sessionId, progressId, rating, utc(at));
    }

    private long progress(Learner learner, long cardId) {
        return insert("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai, han_on_at) "
                + "VALUES (?, ?, 'EN_VI', 'ON_TAP', ?)", learner.id(), cardId, utc(Instant.parse("2027-12-01T00:00:00Z")));
    }

    private long practice(Learner learner) {
        return insert("INSERT INTO bai_luyen (nguoi_dung_id, loai_bai, bo_the_id, nguon, so_cau_yeu_cau, "
                + "la_luyen_lai) VALUES (?, 'TONG_HOP', ?, 'BO_THE', 5, false)", learner.id(), Long.valueOf(learner.deckId()));
    }

    private long attempt(Learner learner, long practiceId, int correct, int total, Instant at) {
        long attemptId = insert("INSERT INTO lan_lam_bai (nguoi_dung_id, bai_id, submit_key, so_cau_dung, tong_so_cau, "
                        + "diem, thoi_gian, nop_at) VALUES (?, ?, ?, ?, ?, ?, 60000, ?)",
                learner.id(), practiceId, "k-" + UUID.randomUUID(), correct, total, correct * 100 / total, utc(at));
        return attemptId;
    }

    private void answer(long attemptId, int order, Long cardId, boolean correct) {
        Long practiceId = jdbc.queryForObject("SELECT bai_id FROM lan_lam_bai WHERE id = ?", Long.class, attemptId);
        long questionId = insert("INSERT INTO cau_hoi_bai_luyen (bai_id, thu_tu, loai_cau, the_id, de_bai_json, "
                        + "dap_an_json, giai_thich_json) VALUES (?, ?, 'NHAP_TU_THEO_NGHIA', ?, '{}', '{}', '[]')",
                practiceId, order, cardId);
        jdbc.update("INSERT INTO tra_loi_bai_luyen (lan_lam_id, cau_hoi_id, dung, ket_qua_json) "
                + "VALUES (?, ?, ?, '{}')", attemptId, questionId, correct);
    }

    private static LocalDateTime utc(Instant instant) {
        return LocalDateTime.ofInstant(instant, ZoneOffset.UTC);
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
        NguoiDung user = NguoiDung.register(email, "Weekly tester", passwords.encode(PASSWORD),
                HCM.getId(), roles.findByMa("USER").orElseThrow());
        user.verifyEmail(Instant.now());
        Long userId = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        String deckId = jsonMapper.readTree(mockMvc.perform(post("/api/v1/decks").cookie(session).with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("ten", "Weekly deck " + UUID.randomUUID(), "trinhDo", "CO_BAN"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asString();
        return new Learner(userId, session, deckId);
    }

    private long card(Learner learner, String word) throws Exception {
        return Long.parseLong(jsonMapper.readTree(mockMvc.perform(post("/api/v1/decks/" + learner.deckId() + "/cards")
                        .cookie(learner.session()).with(xsrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("tu", word, "nghiaVi", "nghĩa"))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asString());
    }
}
