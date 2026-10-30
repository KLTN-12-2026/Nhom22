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

class FR06FinishHistoryTest extends AbstractIntegrationTest {

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
    void fr06_finishClosesSessionAndRepeatReturnsSameSummary() throws Exception {
        Learner learner = learner();
        setNewPerDay(learner, 10);
        long forgot = card(learner, "forgot");
        long easy = card(learner, "easy");
        long skipped = card(learner, "skipped");
        String session = createSession(learner, "EN_VI");

        review(learner, session, forgot, "EN_VI", "QUEN", 0).andExpect(status().isCreated());
        review(learner, session, easy, "EN_VI", "DE", 0).andExpect(status().isCreated());
        review(learner, session, forgot, "EN_VI", "NHO", 1).andExpect(status().isCreated());

        String first = finish(learner, session)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phienId").value(session))
                .andExpect(jsonPath("$.trangThai").value("KET_THUC"))
                .andExpect(jsonPath("$.ketThucAt").isNotEmpty())
                .andExpect(jsonPath("$.soLuot").value(3))
                .andExpect(jsonPath("$.soThe").value(2))
                .andExpect(jsonPath("$.soTheMoi").value(2))
                .andExpect(jsonPath("$.soChuaTraLoi").value(1))
                .andExpect(jsonPath("$.thoiGian").value(12600))
                .andExpect(jsonPath("$.theoDanhGia.QUEN").value(1))
                .andExpect(jsonPath("$.theoDanhGia.KHO").value(0))
                .andExpect(jsonPath("$.theoDanhGia.NHO").value(1))
                .andExpect(jsonPath("$.theoDanhGia.DE").value(1))
                .andExpect(jsonPath("$.tuCanLuyen.length()").value(1))
                .andExpect(jsonPath("$.tuCanLuyen[0].theId").value(String.valueOf(forgot)))
                .andExpect(jsonPath("$.tuCanLuyen[0].danhGia[0]").value("QUEN"))
                .andExpect(jsonPath("$.tuCanLuyen[0].danhGia[1]").value("NHO"))
                .andExpect(jsonPath("$.lichTiepTheo.length()").value(2))
                .andExpect(jsonPath("$.lichTiepTheo[0].theId").value(String.valueOf(forgot)))
                .andExpect(jsonPath("$.lichTiepTheo[0].trangThai").value("DANG_HOC"))
                .andExpect(jsonPath("$.lichTiepTheo[1].trangThai").value("ON_TAP"))
                .andReturn().getResponse().getContentAsString();

        String second = finish(learner, session)
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(second).isEqualTo(first);
        assertThat(jdbc.queryForObject(
                "SELECT trang_thai FROM phien_hoc WHERE id = ?",
                String.class, Long.valueOf(session))).isEqualTo("KET_THUC");

        review(learner, session, skipped, "EN_VI", "NHO", 0)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));

        history(learner, "phienId=" + session)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3));
    }

    @Test
    void fr06_finishOnlyForOwnerAndRequiresLogin() throws Exception {
        Learner owner = learner();
        Learner stranger = learner();
        card(owner, "word");
        String session = createSession(owner, "EN_VI");

        finish(stranger, session).andExpect(status().isNotFound());
        finish(owner, "999999999").andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/learning/sessions/" + session + "/finish").with(xsrf()))
                .andExpect(status().isUnauthorized());

        assertThat(jdbc.queryForObject(
                "SELECT trang_thai FROM phien_hoc WHERE id = ?",
                String.class, Long.valueOf(session))).isEqualTo("DANG_HOC");
    }

    @Test
    void fr06_historyFiltersPagesAndKeepsDeletedCards() throws Exception {
        Learner learner = learner();
        setNewPerDay(learner, 10);
        long both = card(learner, "both");
        long single = card(learner, "single");
        String enVi = createSession(learner, "EN_VI");
        String viEn = createSession(learner, "VI_EN");

        review(learner, enVi, both, "EN_VI", "DE", 0).andExpect(status().isCreated());
        review(learner, enVi, single, "EN_VI", "QUEN", 0).andExpect(status().isCreated());
        review(learner, viEn, both, "VI_EN", "NHO", 0).andExpect(status().isCreated());

        history(learner, "size=2")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.items[0].theId").value(String.valueOf(both)))
                .andExpect(jsonPath("$.items[0].chieuHoc").value("VI_EN"))
                .andExpect(jsonPath("$.items[0].phienId").value(viEn))
                .andExpect(jsonPath("$.items[0].boTheId").value(learner.deckId()))
                .andExpect(jsonPath("$.items[0].thoiGian").value(4200))
                .andExpect(jsonPath("$.items[0].truoc.trangThai").value("MOI"))
                .andExpect(jsonPath("$.items[0].truoc.version").value(0))
                .andExpect(jsonPath("$.items[0].sau.trangThai").value("DANG_HOC"))
                .andExpect(jsonPath("$.items[0].sau.version").value(1))
                .andExpect(jsonPath("$.items[0].phienBanThuatToan").value("SM2-VN-1"));

        history(learner, "chieuHoc=VI_EN").andExpect(jsonPath("$.totalElements").value(1));
        history(learner, "theId=" + single).andExpect(jsonPath("$.totalElements").value(1));
        history(learner, "phienId=" + enVi).andExpect(jsonPath("$.totalElements").value(2));
        history(learner, "boTheId=" + learner.deckId()).andExpect(jsonPath("$.totalElements").value(3));

        LocalDate today = LocalDate.ofInstant(clock.instant(), ZoneId.of(HCM));
        history(learner, "tuNgay=" + today + "&denNgay=" + today)
                .andExpect(jsonPath("$.totalElements").value(3));
        history(learner, "tuNgay=" + today.plusDays(1))
                .andExpect(jsonPath("$.totalElements").value(0));
        history(learner, "denNgay=" + today.minusDays(1))
                .andExpect(jsonPath("$.totalElements").value(0));

        jdbc.update("UPDATE the_tu_vung SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", single);
        history(learner, "theId=" + single).andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    void fr06_historyIsPrivateAndValidatesQuery() throws Exception {
        Learner owner = learner();
        Learner stranger = learner();
        long word = card(owner, "word");
        String session = createSession(owner, "EN_VI");
        review(owner, session, word, "EN_VI", "DE", 0).andExpect(status().isCreated());

        history(stranger, "phienId=" + session).andExpect(jsonPath("$.totalElements").value(0));
        history(stranger, "boTheId=" + owner.deckId()).andExpect(jsonPath("$.totalElements").value(0));
        history(stranger, "").andExpect(jsonPath("$.totalElements").value(0));

        history(owner, "chieuHoc=XX")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("chieuHoc"));
        history(owner, "tuNgay=2026-02-30")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("tuNgay"));
        history(owner, "tuNgay=2026-10-28&denNgay=2026-10-01")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("denNgay"));
        history(owner, "size=101").andExpect(status().isBadRequest());
        history(owner, "phienId=abc").andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/learning/history")).andExpect(status().isUnauthorized());
    }

    private ResultActions finish(Learner learner, String session) throws Exception {
        return mockMvc.perform(post("/api/v1/learning/sessions/" + session + "/finish")
                .cookie(learner.session()).with(xsrf()));
    }

    private ResultActions history(Learner learner, String query) throws Exception {
        return mockMvc.perform(get("/api/v1/learning/history?" + query).cookie(learner.session()));
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
        NguoiDung user = NguoiDung.register(email, "Finish tester", passwords.encode(PASSWORD),
                HCM, roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long userId = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        MvcResult deck = send(session, "/api/v1/decks", Map.of(
                "ten", "Finish deck " + UUID.randomUUID(),
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
