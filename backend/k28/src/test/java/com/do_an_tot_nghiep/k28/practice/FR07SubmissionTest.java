package com.do_an_tot_nghiep.k28.practice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.learning.service.StudyTimeService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.JsonNode;

class FR07SubmissionTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String HCM = "Asia/Ho_Chi_Minh";
    private static final String[][] WORDS = {
            {"receipt", "biên lai", "Please keep the receipt for your records."},
            {"invoice", "hóa đơn", "The invoice was sent yesterday."},
            {"deadline", "hạn chót", "We missed the deadline again."},
            {"schedule", "lịch trình", "Check the schedule before the meeting."},
            {"budget", "ngân sách", "Our budgets are tight this year."}
    };

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
    StudyTimeService studyTime;

    @Test
    void tc11_gradesBySnapshotRecordsMistakesAndReplaysByKey() throws Exception {
        Learner learner = learner();
        cards(learner, 5);
        String id = idOf(create(learner, Map.of("loaiBai", "NHAP_TU_THEO_NGHIA", "soCau", 5))
                .andExpect(status().isCreated()));
        List<Key> keys = keys(id);
        assertThat(keys).hasSize(5);
        String first = keys.get(0).dapAn().get("noiDung").asText();
        jdbc.update("UPDATE the_tu_vung SET tu = 'changed' WHERE id = ?", keys.get(0).theId());
        backdate(id, 600);

        String submitKey = "k-" + UUID.randomUUID();
        JsonNode result = body(submit(learner, id, Map.of(
                "submitKey", submitKey,
                "thoiGian", 90000,
                "traLoi", List.of(
                        Map.of("cauHoiId", keys.get(0).id(), "noiDung", "  " + first.toUpperCase() + " "),
                        Map.of("cauHoiId", keys.get(1).id(), "noiDung", word(keys.get(1)).substring(1)),
                        Map.of("cauHoiId", keys.get(3).id(), "noiDung", "zzzz"),
                        Map.of("cauHoiId", keys.get(4).id(), "noiDung", word(keys.get(4))))))
                .andExpect(status().isCreated()));

        assertThat(result.get("lanLamId").asText()).isNotBlank();
        assertThat(result.get("baiLuyenId").asText()).isEqualTo(id);
        assertThat(result.get("soCauDung").asInt()).isEqualTo(2);
        assertThat(result.get("tongSoCau").asInt()).isEqualTo(5);
        assertThat(result.get("diem").asInt()).isEqualTo(40);
        assertThat(result.get("thoiGian").asInt()).isEqualTo(90000);
        assertThat(result.get("laLuyenLai").asBoolean()).isFalse();
        assertThat(result.get("theoKyNang").size()).isEqualTo(1);
        assertThat(result.get("theoKyNang").get(0).get("kyNang").asText()).isEqualTo("VIET");
        assertThat(result.get("theoKyNang").get(0).get("dung").asInt()).isEqualTo(2);
        assertThat(result.get("theoKyNang").get(0).get("tong").asInt()).isEqualTo(5);

        JsonNode items = result.get("ketQua");
        assertThat(items.get(0).get("dung").asBoolean()).isTrue();
        assertThat(items.get(0).get("nhomLoi").isNull()).isTrue();
        assertThat(items.get(0).get("traLoi").get("noiDung").asText()).isEqualTo(first.toUpperCase());
        assertThat(items.get(0).get("dapAn").get("noiDung").asText()).isEqualTo(first);
        assertThat(items.get(0).get("giaiThich").get("tu").asText()).isEqualTo(first);
        assertThat(items.get(1).get("nhomLoi").asText()).isEqualTo("CHINH_TA");
        assertThat(items.get(2).get("traLoi").isNull()).isTrue();
        assertThat(items.get(2).get("nhomLoi").asText()).isEqualTo("NGHIA");
        assertThat(items.get(3).get("nhomLoi").asText()).isEqualTo("NGHIA");
        assertThat(items.get(4).get("dung").asBoolean()).isTrue();
        assertThat(result.toString()).doesNotContain("changed");

        String lanLamId = result.get("lanLamId").asText();
        assertThat(jdbc.queryForList("SELECT nhom_loi FROM loi_hoc_tap WHERE nguoi_dung_id = ? AND su_kien_id = ? "
                        + "AND nguon_su_kien = 'BAI_LUYEN' ORDER BY nhom_loi", String.class, learner.id(), Long.valueOf(lanLamId)))
                .containsExactly("CHINH_TA", "NGHIA", "NGHIA");

        submit(learner, id, Map.of("submitKey", submitKey, "thoiGian", 1, "traLoi", List.of()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lanLamId").value(lanLamId))
                .andExpect(jsonPath("$.diem").value(40));
        submit(learner, id, Map.of("submitKey", "k-" + UUID.randomUUID(), "thoiGian", 1, "traLoi", List.of()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM lan_lam_bai WHERE bai_id = ?", Integer.class, Long.valueOf(id)))
                .isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM loi_hoc_tap WHERE nguoi_dung_id = ?", Integer.class, learner.id()))
                .isEqualTo(3);

        mockMvc.perform(get("/api/v1/practice/sessions/" + id).cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.daNop").value(true))
                .andExpect(jsonPath("$.lanLamId").value(lanLamId))
                .andExpect(jsonPath("$.laLuyenLai").value(false))
                .andExpect(jsonPath("$.cauHoi.length()").value(5))
                .andExpect(jsonPath("$.ketQua.lanLamId").value(lanLamId))
                .andExpect(jsonPath("$.ketQua.ketQua[1].nhomLoi").value("CHINH_TA"));

        LocalDate today = LocalDate.now(clock.withZone(ZoneId.of(HCM)));
        assertThat(studyTime.day(learner.id(), today, ZoneId.of(HCM)).thoiGian()).isEqualTo(90000);
    }

    @Test
    void fr07_wrongChoiceStoresConfusedPairAndEnablesPairPractice() throws Exception {
        Learner learner = learner();
        cards(learner, 5);
        String id = idOf(create(learner, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5))
                .andExpect(status().isCreated()));
        Key first = keys(id).get(0);
        String right = first.dapAn().get("luaChonId").asText();
        JsonNode wrong = otherChoice(first);

        JsonNode result = body(submit(learner, id, Map.of(
                "submitKey", "k-" + UUID.randomUUID(),
                "thoiGian", 1000,
                "traLoi", List.of(Map.of("cauHoiId", first.id(), "luaChonId", wrong.get("id").asText()))))
                .andExpect(status().isCreated()));
        assertThat(result.get("soCauDung").asInt()).isZero();
        assertThat(result.get("diem").asInt()).isZero();
        JsonNode item = result.get("ketQua").get(0);
        assertThat(item.get("nhomLoi").asText()).isEqualTo("NGHIA");
        assertThat(item.get("traLoi").get("luaChonId").asText()).isEqualTo(wrong.get("id").asText());
        assertThat(item.get("dapAn").get("luaChonId").asText()).isEqualTo(right);
        assertThat(item.get("dapAn").has("luaChon")).isFalse();

        long other = Long.parseLong(wrong.get("theId").asText());
        assertThat(timesConfused(learner, first.theId(), other)).isEqualTo(1);

        String pairId = idOf(create(learner, Map.of("loaiBai", "PHAN_BIET_CAP", "soCau", 5))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.soCau").value(2)));
        Key question = keys(pairId).get(0);
        JsonNode pairWrong = otherChoice(question);
        JsonNode pairResult = body(submit(learner, pairId, Map.of(
                "submitKey", "k-" + UUID.randomUUID(),
                "thoiGian", 1000,
                "traLoi", List.of(Map.of("cauHoiId", question.id(), "luaChonId", pairWrong.get("id").asText()))))
                .andExpect(status().isCreated()));
        assertThat(pairResult.get("ketQua").get(0).get("nhomLoi").asText()).isEqualTo("CAP_NHAM");
        assertThat(pairResult.get("theoKyNang").get(0).get("kyNang").asText()).isEqualTo("CAP_NHAM");
        assertThat(timesConfused(learner, first.theId(), other)).isEqualTo(2);
        assertThat(jdbc.queryForObject("SELECT JSON_UNQUOTE(JSON_EXTRACT(bang_chung_json, '$.theNhamId')) "
                        + "FROM loi_hoc_tap WHERE su_kien_id = ? AND nhom_loi = 'CAP_NHAM' "
                        + "AND JSON_UNQUOTE(JSON_EXTRACT(bang_chung_json, '$.cauHoiId')) = ?", String.class,
                Long.valueOf(pairResult.get("lanLamId").asText()), question.id()))
                .isEqualTo(pairWrong.get("theId").asText());
    }

    @Test
    void fr07_matchScoresPairsRetriesWrongCardsAndListsHistory() throws Exception {
        Learner learner = learner();
        cards(learner, 5);
        String id = idOf(create(learner, Map.of("loaiBai", "GHEP_TU", "soCau", 5))
                .andExpect(status().isCreated()));
        Key match = keys(id).get(0);
        JsonNode links = match.dapAn().get("cap");
        assertThat(links.size()).isEqualTo(5);
        List<Map<String, Object>> cap = new ArrayList<>();
        for (int i = 0; i < 5; i++) {
            int target = i == 0 ? 1 : i == 1 ? 0 : i;
            cap.add(Map.of("traiId", links.get(i).get("traiId").asText(),
                    "phaiId", links.get(target).get("phaiId").asText()));
        }
        JsonNode result = body(submit(learner, id, Map.of(
                "submitKey", "k-" + UUID.randomUUID(),
                "thoiGian", 1000,
                "traLoi", List.of(Map.of("cauHoiId", match.id(), "cap", cap))))
                .andExpect(status().isCreated()));
        assertThat(result.get("soCauDung").asInt()).isZero();
        assertThat(result.get("diem").asInt()).isEqualTo(60);
        JsonNode item = result.get("ketQua").get(0);
        assertThat(item.get("dung").asBoolean()).isFalse();
        assertThat(item.get("diem").asInt()).isEqualTo(60);
        assertThat(item.get("chiTiet").size()).isEqualTo(5);
        assertThat(item.get("dapAn").get("cap").size()).isEqualTo(5);
        long card0 = Long.parseLong(links.get(0).get("theId").asText());
        long card1 = Long.parseLong(links.get(1).get("theId").asText());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM loi_hoc_tap WHERE nguoi_dung_id = ?",
                Integer.class, learner.id())).isEqualTo(2);
        assertThat(timesConfused(learner, card0, card1)).isEqualTo(1);

        String lanLamId = result.get("lanLamId").asText();
        JsonNode retry = body(send(learner.session(), "/api/v1/practice/mistakes/retry", Map.of("lanLamId", lanLamId))
                .andExpect(status().isCreated()));
        assertThat(retry.get("loaiBai").asText()).isEqualTo("CHON_NGHIA");
        assertThat(retry.get("laLuyenLai").asBoolean()).isTrue();
        assertThat(retry.get("baiGocId").asText()).isEqualTo(id);
        assertThat(retry.get("soCau").asInt()).isEqualTo(2);
        assertThat(retry.get("soCauYeuCau").asInt()).isEqualTo(5);
        assertThat(retry.get("daNop").asBoolean()).isFalse();
        assertThat(retry.get("ketQua").isNull()).isTrue();
        String retryId = retry.get("id").asText();
        Set<Long> retryCards = new HashSet<>(jdbc.queryForList(
                "SELECT the_id FROM cau_hoi_bai_luyen WHERE bai_id = ?", Long.class, Long.valueOf(retryId)));
        assertThat(retryCards).containsExactlyInAnyOrder(card0, card1);

        List<Map<String, Object>> correct = new ArrayList<>();
        for (Key key : keys(retryId)) {
            correct.add(Map.of("cauHoiId", key.id(), "luaChonId", key.dapAn().get("luaChonId").asText()));
        }
        String retryAttempt = body(submit(learner, retryId, Map.of(
                "submitKey", "k-" + UUID.randomUUID(), "thoiGian", 1000, "traLoi", correct))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.diem").value(100))
                .andExpect(jsonPath("$.laLuyenLai").value(true))).get("lanLamId").asText();
        send(learner.session(), "/api/v1/practice/mistakes/retry", Map.of("lanLamId", retryAttempt))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));

        mockMvc.perform(get("/api/v1/practice/history").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.size").value(20))
                .andExpect(jsonPath("$.items[0].lanLamId").value(retryAttempt))
                .andExpect(jsonPath("$.items[0].laLuyenLai").value(true))
                .andExpect(jsonPath("$.items[0].soCauSai").value(0))
                .andExpect(jsonPath("$.items[0].boTheTen").value("Tất cả bộ của tôi"))
                .andExpect(jsonPath("$.items[1].lanLamId").value(lanLamId))
                .andExpect(jsonPath("$.items[1].loaiBai").value("GHEP_TU"))
                .andExpect(jsonPath("$.items[1].soCauSai").value(1))
                .andExpect(jsonPath("$.items[1].diem").value(60));
        mockMvc.perform(get("/api/v1/practice/history").param("loaiBai", "GHEP_TU").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(get("/api/v1/practice/history").param("tuNgay", "2026-11-05").param("denNgay", "2026-11-01")
                        .cookie(learner.session()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'denNgay')]").exists());
        mockMvc.perform(get("/api/v1/practice/history").param("size", "101").cookie(learner.session()))
                .andExpect(status().isBadRequest());

        jdbc.update("UPDATE the_tu_vung SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id IN (?, ?)", card0, card1);
        send(learner.session(), "/api/v1/practice/mistakes/retry", Map.of("lanLamId", lanLamId))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));
    }

    @Test
    void fr07_validatesSubmissionAndHidesOtherUsers() throws Exception {
        Learner owner = learner();
        Learner stranger = learner();
        cards(owner, 5);
        String id = idOf(create(owner, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5))
                .andExpect(status().isCreated()));
        String question = keys(id).get(0).id();

        submit(stranger, id, Map.of("submitKey", "k1", "thoiGian", 0, "traLoi", List.of()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        mockMvc.perform(post("/api/v1/practice/sessions/" + id + "/submissions").with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("submitKey", "k1", "thoiGian", 0, "traLoi", List.of()))))
                .andExpect(status().isUnauthorized());

        expectField(owner, id, Map.of("thoiGian", 0, "traLoi", List.of()), "submitKey");
        expectField(owner, id, Map.of("submitKey", "bad key", "thoiGian", 0, "traLoi", List.of()), "submitKey");
        expectField(owner, id, Map.of("submitKey", "k1", "thoiGian", -1, "traLoi", List.of()), "thoiGian");
        expectField(owner, id, Map.of("submitKey", "k1", "thoiGian", 0,
                "traLoi", List.of(Map.of("cauHoiId", "999999999"))), "traLoi[0].cauHoiId");
        expectField(owner, id, Map.of("submitKey", "k1", "thoiGian", 0,
                "traLoi", List.of(Map.of("cauHoiId", question), Map.of("cauHoiId", question))), "traLoi[1].cauHoiId");
        expectField(owner, id, Map.of("submitKey", "k1", "thoiGian", 0,
                "traLoi", List.of(Map.of("cauHoiId", question, "luaChonId", "o9"))), "traLoi[0].luaChonId");
        expectField(owner, id, Map.of("submitKey", "k1", "thoiGian", 0,
                "traLoi", List.of(Map.of("cauHoiId", question, "noiDung", "x".repeat(201)))), "traLoi[0].noiDung");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM lan_lam_bai WHERE nguoi_dung_id = ?",
                Integer.class, owner.id())).isZero();

        String shared = "shared-" + UUID.randomUUID();
        JsonNode first = body(submit(owner, id, Map.of("submitKey", shared, "thoiGian", 999999999, "traLoi", List.of()))
                .andExpect(status().isCreated()));
        assertThat(first.get("thoiGian").asInt()).isLessThan(60000);
        String otherId = idOf(create(owner, Map.of("loaiBai", "CHON_TU", "soCau", 5))
                .andExpect(status().isCreated()));
        submit(owner, otherId, Map.of("submitKey", shared, "thoiGian", 0, "traLoi", List.of()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'submitKey')]").exists());

        send(stranger.session(), "/api/v1/practice/mistakes/retry", Map.of("lanLamId", first.get("lanLamId").asText()))
                .andExpect(status().isNotFound());
        send(owner.session(), "/api/v1/practice/mistakes/retry", Map.of("lanLamId", "abc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'lanLamId')]").exists());
    }

    private void expectField(Learner learner, String id, Map<String, Object> body, String field) throws Exception {
        submit(learner, id, body)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == '" + field + "')]").exists());
    }

    private int timesConfused(Learner learner, long a, long b) {
        return jdbc.queryForObject("SELECT so_lan_nham FROM cap_tu_de_nham WHERE nguoi_dung_id = ? "
                + "AND the_1_id = ? AND the_2_id = ?", Integer.class, learner.id(), Math.min(a, b), Math.max(a, b));
    }

    private JsonNode otherChoice(Key key) {
        String right = key.dapAn().get("luaChonId").asText();
        for (JsonNode choice : key.dapAn().get("luaChon")) {
            if (!choice.get("id").asText().equals(right)) {
                return choice;
            }
        }
        throw new IllegalStateException("No wrong choice");
    }

    private String word(Key key) {
        return key.dapAn().get("noiDung").asText();
    }

    private void backdate(String id, int seconds) {
        jdbc.update("UPDATE bai_luyen SET created_at = TIMESTAMPADD(SECOND, ?, created_at) WHERE id = ?",
                -seconds, Long.valueOf(id));
    }

    private List<Key> keys(String id) {
        return jdbc.query("SELECT id, the_id, dap_an_json FROM cau_hoi_bai_luyen WHERE bai_id = ? ORDER BY thu_tu",
                (rs, row) -> new Key(rs.getString("id"), rs.getLong("the_id"), jsonMapper.readTree(rs.getString("dap_an_json"))),
                Long.valueOf(id));
    }

    private ResultActions create(Learner learner, Map<String, Object> body) throws Exception {
        return send(learner.session(), "/api/v1/practice/sessions", body);
    }

    private ResultActions submit(Learner learner, String id, Map<String, Object> body) throws Exception {
        return send(learner.session(), "/api/v1/practice/sessions/" + id + "/submissions", body);
    }

    private JsonNode body(ResultActions actions) throws Exception {
        return jsonMapper.readTree(actions.andReturn().getResponse().getContentAsString());
    }

    private String idOf(ResultActions actions) throws Exception {
        return body(actions).get("id").asText();
    }

    private void cards(Learner learner, int count) throws Exception {
        for (int i = 0; i < count; i++) {
            String[] row = WORDS[i];
            Map<String, Object> body = new HashMap<>();
            body.put("tu", row[0]);
            body.put("nghiaVi", row[1]);
            body.put("viDuEn", row[2]);
            send(learner.session(), "/api/v1/decks/" + learner.deckId() + "/cards", body)
                    .andExpect(status().isCreated());
        }
    }

    private Learner learner() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Practice tester", passwords.encode(PASSWORD),
                HCM, roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long userId = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        MvcResult deck = send(session, "/api/v1/decks", Map.of(
                "ten", "Practice deck " + UUID.randomUUID(),
                "trinhDo", "CO_BAN",
                "quyenTruyCap", "RIENG_TU")).andExpect(status().isCreated()).andReturn();
        return new Learner(userId, session, jsonMapper.readTree(deck.getResponse().getContentAsString()).get("id").asText());
    }

    private ResultActions send(Cookie session, String path, Object body) throws Exception {
        return mockMvc.perform(post(path).cookie(session).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private record Key(String id, long theId, JsonNode dapAn) {
    }

    private record Learner(Long id, Cookie session, String deckId) {
    }
}
