package com.do_an_tot_nghiep.k28.practice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.JsonNode;

class FR08NotebookTest extends AbstractIntegrationTest {

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

    @Test
    void notebookDerivesFromMistakesLapsesAndMarks() throws Exception {
        Learner learner = learner();
        List<Long> cards = cards(learner, 5);
        Instant now = clock.instant().truncatedTo(ChronoUnit.MILLIS);

        JsonNode empty = notebook(learner, "");
        assertThat(empty.get("tongHop").get("TAT_CA").asInt()).isZero();
        assertThat(empty.get("items")).isEmpty();
        create(learner, Map.of("loaiBai", "TONG_HOP", "nguon", "SO_TAY", "soCau", 10))
                .andExpect(status().isUnprocessableContent());

        for (int i = 0; i < 4; i++) {
            mistake(learner, cards.get(0), i == 3 ? "CAP_NHAM" : "NGHIA", "sai " + i, now.minusSeconds(400 - i * 100L));
        }
        jdbc.update("INSERT INTO cap_tu_de_nham (nguoi_dung_id, the_1_id, the_2_id, so_lan_nham, lan_cuoi_at) VALUES (?, ?, ?, 2, ?)",
                learner.id(), cards.get(0), cards.get(4), utc(now.minusSeconds(100)));

        long enVi = progress(learner, cards.get(1), "EN_VI");
        long viEn = progress(learner, cards.get(1), "VI_EN");
        lapse(learner, enVi, "ON_TAP", now.minusSeconds(3000));
        lapse(learner, enVi, "ON_TAP", now.minusSeconds(2000));
        lapse(learner, viEn, "ON_TAP", now.minusSeconds(1000));
        lapse(learner, viEn, "DANG_HOC", now.minusSeconds(900));
        lapse(learner, enVi, "ON_TAP", now.minus(Duration.ofDays(40)));
        long other = progress(learner, cards.get(2), "EN_VI");
        lapse(learner, other, "ON_TAP", now.minusSeconds(500));
        lapse(learner, other, "ON_TAP", now.minusSeconds(400));

        update(learner, cards.get(3), Map.of("danhDauThuCong", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.theId").value(String.valueOf(cards.get(3))))
                .andExpect(jsonPath("$.danhDauThuCong").value(true))
                .andExpect(jsonPath("$.lyDo[0]").value("DANH_DAU_THU_CONG"));
        update(learner, cards.get(4), Map.of("ghiChu", "  nhớ đuôi -et  "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ghiChu").value("nhớ đuôi -et"))
                .andExpect(jsonPath("$.lyDo").isEmpty())
                .andExpect(jsonPath("$.danhDauThuCong").value(false));

        JsonNode all = notebook(learner, "");
        JsonNode tongHop = all.get("tongHop");
        assertThat(tongHop.get("TAT_CA").asInt()).isEqualTo(3);
        assertThat(tongHop.get("NGHIA").asInt()).isEqualTo(1);
        assertThat(tongHop.get("CAP_NHAM").asInt()).isEqualTo(1);
        assertThat(tongHop.get("QUEN_NHIEU").asInt()).isEqualTo(1);
        assertThat(tongHop.get("DANH_DAU").asInt()).isEqualTo(1);
        assertThat(tongHop.get("CHINH_TA").asInt()).isZero();
        List<String> order = new ArrayList<>();
        all.get("items").forEach(item -> order.add(item.get("theId").asText()));
        assertThat(order).containsExactly(String.valueOf(cards.get(3)), String.valueOf(cards.get(0)), String.valueOf(cards.get(1)));

        JsonNode first = item(all, cards.get(0));
        assertThat(first.get("tu").asText()).isEqualTo("receipt");
        assertThat(first.get("boTheId").asText()).isEqualTo(learner.deckId());
        assertThat(first.get("boTheTen").asText()).startsWith("Notebook deck");
        assertThat(first.get("lyDo").toString()).isEqualTo("[\"CAP_DE_NHAM\"]");
        assertThat(first.get("nhomLoi").toString()).contains("{\"nhomLoi\":\"NGHIA\",\"soLan\":3}");
        assertThat(first.get("bangChung")).hasSize(3);
        assertThat(first.get("bangChung").get(0).get("traLoi").asText()).isEqualTo("sai 3");
        assertThat(first.get("bangChung").get(0).get("loaiCau").asText()).isEqualTo("CHON_NGHIA");
        assertThat(first.get("bangChung").get(0).get("nguonSuKien").asText()).isEqualTo("BAI_LUYEN");
        assertThat(first.get("bangChung").get(2).get("traLoi").asText()).isEqualTo("sai 1");
        assertThat(Instant.parse(first.get("lanGanNhatAt").asText())).isEqualTo(now.minusSeconds(100));

        JsonNode lapsed = item(all, cards.get(1));
        assertThat(lapsed.get("soLanQuen").asInt()).isEqualTo(3);
        assertThat(lapsed.get("lyDo").toString()).isEqualTo("[\"QUEN_NHIEU\"]");
        assertThat(lapsed.get("bangChung")).isEmpty();

        JsonNode filtered = notebook(learner, "?nhomLoi=QUEN_NHIEU");
        assertThat(filtered.get("totalElements").asInt()).isEqualTo(1);
        assertThat(filtered.get("tongHop").get("TAT_CA").asInt()).isEqualTo(3);
        JsonNode paged = notebook(learner, "?page=1&size=2");
        assertThat(paged.get("items")).hasSize(1);
        assertThat(paged.get("totalPages").asInt()).isEqualTo(2);

        JsonNode practice = body(create(learner, Map.of("loaiBai", "NHAP_TU_THEO_NGHIA", "nguon", "SO_TAY", "soCau", 5))
                .andExpect(status().isCreated()));
        assertThat(practice.get("soCau").asInt()).isEqualTo(3);

        mockMvc.perform(delete("/api/v1/notebook/" + cards.get(1)).cookie(learner.session()).with(xsrf()))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/v1/notebook/" + cards.get(0)).cookie(learner.session()).with(xsrf()))
                .andExpect(status().isNoContent());
        mockMvc.perform(delete("/api/v1/notebook/" + cards.get(3)).cookie(learner.session()).with(xsrf()))
                .andExpect(status().isNoContent());
        assertThat(notebook(learner, "").get("tongHop").get("TAT_CA").asInt()).isZero();
        create(learner, Map.of("loaiBai", "TONG_HOP", "nguon", "SO_TAY", "soCau", 10))
                .andExpect(status().isUnprocessableContent());

        mistake(learner, cards.get(0), "NGHIA", "sai mới", clock.instant().plusSeconds(1));
        JsonNode back = notebook(learner, "");
        assertThat(back.get("tongHop").get("TAT_CA").asInt()).isEqualTo(1);
        JsonNode returned = item(back, cards.get(0));
        assertThat(returned.get("bangChung")).hasSize(1);
        assertThat(returned.get("lyDo")).isEmpty();
        assertThat(returned.get("nhomLoi").toString()).isEqualTo("[{\"nhomLoi\":\"NGHIA\",\"soLan\":1}]");
    }

    @Test
    void spellingReasonUsesLatestTypedAttempts() throws Exception {
        Learner learner = learner();
        cards(learner, 5);
        for (int round = 0; round < 2; round++) {
            String id = idOf(create(learner, Map.of("loaiBai", "NHAP_TU_THEO_NGHIA", "soCau", 5))
                    .andExpect(status().isCreated()));
            List<Map<String, Object>> traLoi = new ArrayList<>();
            for (Key key : keys(id)) {
                if (key.word().equals("budget") && round == 1) {
                    continue;
                }
                traLoi.add(Map.of("cauHoiId", key.id(), "noiDung", key.word().substring(1)));
            }
            backdate(id, 600);
            submit(learner, id, Map.of("submitKey", "k-" + UUID.randomUUID(), "thoiGian", 60000, "traLoi", traLoi))
                    .andExpect(status().isCreated());
        }

        JsonNode all = notebook(learner, "?nhomLoi=CHINH_TA");
        assertThat(all.get("tongHop").get("TAT_CA").asInt()).isEqualTo(5);
        assertThat(all.get("tongHop").get("CHINH_TA").asInt()).isEqualTo(5);
        int spelling = 0;
        for (JsonNode item : all.get("items")) {
            boolean flagged = item.get("lyDo").toString().contains("SAI_CHINH_TA");
            assertThat(flagged).isEqualTo(!item.get("tu").asText().equals("budget"));
            spelling += flagged ? 1 : 0;
            JsonNode evidence = item.get("bangChung").get(0);
            assertThat(evidence.get("loaiCau").asText()).isEqualTo("NHAP_TU_THEO_NGHIA");
            assertThat(evidence.get("suKienId").isString()).isTrue();
            assertThat(evidence.get("baiLuyenId").isString()).isTrue();
        }
        assertThat(spelling).isEqualTo(4);
    }

    @Test
    void notebookValidatesAndHidesForeignDeletedOrSuspendedCards() throws Exception {
        Learner owner = learner();
        Learner stranger = learner();
        List<Long> cards = cards(owner, 4);
        Instant now = clock.instant().truncatedTo(ChronoUnit.MILLIS);
        cards.forEach(card -> mistake(owner, card, "NGHIA", "x", now.minusSeconds(60)));

        update(owner, cards.get(0), Map.of()).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        update(owner, cards.get(0), Map.of("ghiChu", "a".repeat(501))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("ghiChu"));
        update(owner, cards.get(0), Map.of("ghiChu", "ghi chú")).andExpect(status().isOk());
        update(owner, cards.get(0), Map.of("ghiChu", "   ")).andExpect(status().isOk())
                .andExpect(jsonPath("$.ghiChu").doesNotExist());
        update(stranger, cards.get(0), Map.of("danhDauThuCong", true)).andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/v1/notebook/" + cards.get(0)).cookie(stranger.session()).with(xsrf()))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/v1/notebook/999999999").cookie(owner.session()).with(xsrf()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/notebook?nhomLoi=PHAT_AM").cookie(owner.session()))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/notebook?size=101").cookie(owner.session()))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/notebook")).andExpect(status().isUnauthorized());

        jdbc.update("UPDATE the_tu_vung SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", cards.get(1));
        jdbc.update("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai) VALUES (?, ?, 'VI_EN', 'TAM_NGUNG')",
                owner.id(), cards.get(2));
        update(owner, cards.get(1), Map.of("danhDauThuCong", true)).andExpect(status().isNotFound());

        JsonNode list = notebook(owner, "");
        assertThat(list.get("tongHop").get("TAT_CA").asInt()).isEqualTo(2);
        assertThat(list.get("items").toString())
                .doesNotContain("\"theId\":\"" + cards.get(1) + "\"")
                .doesNotContain("\"theId\":\"" + cards.get(2) + "\"");
        assertThat(notebook(stranger, "").get("tongHop").get("TAT_CA").asInt()).isZero();

        update(owner, cards.get(2), Map.of("danhDauThuCong", true)).andExpect(status().isOk())
                .andExpect(jsonPath("$.danhDauThuCong").value(true));
        assertThat(notebook(owner, "").get("tongHop").get("TAT_CA").asInt()).isEqualTo(2);
    }

    @Test
    void confusingPairsListUsablePairsByCount() throws Exception {
        Learner owner = learner();
        Learner stranger = learner();
        List<Long> cards = cards(owner, 5);
        Instant now = clock.instant().truncatedTo(ChronoUnit.MILLIS);
        pair(owner, cards.get(0), cards.get(1), 1, now.minusSeconds(10));
        pair(owner, cards.get(2), cards.get(3), 3, now.minusSeconds(100));
        pair(owner, cards.get(0), cards.get(4), 5, now);
        jdbc.update("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai) VALUES (?, ?, 'EN_VI', 'TAM_NGUNG')",
                owner.id(), cards.get(4));

        JsonNode pairs = body(mockMvc.perform(get("/api/v1/learning/confusing-pairs").cookie(owner.session()))
                .andExpect(status().isOk()));
        assertThat(pairs).hasSize(2);
        JsonNode top = pairs.get(0);
        assertThat(top.get("id").isString()).isTrue();
        assertThat(top.get("soLanNham").asInt()).isEqualTo(3);
        assertThat(Instant.parse(top.get("lanCuoiAt").asText())).isEqualTo(now.minusSeconds(100));
        assertThat(top.get("the1").get("tu").asText()).isEqualTo("deadline");
        assertThat(top.get("the2").get("viDuEn").asText()).isEqualTo(WORDS[3][2]);
        assertThat(top.has("loaiNham")).isFalse();
        assertThat(pairs.get(1).get("soLanNham").asInt()).isEqualTo(1);

        assertThat(body(mockMvc.perform(get("/api/v1/learning/confusing-pairs").cookie(stranger.session()))
                .andExpect(status().isOk()))).isEmpty();
    }

    private void mistake(Learner learner, long theId, String nhomLoi, String traLoi, Instant at) {
        jdbc.update("INSERT INTO loi_hoc_tap (nguoi_dung_id, the_id, nhom_loi, nguon_su_kien, su_kien_id, bang_chung_json, created_at, updated_at) "
                        + "VALUES (?, ?, ?, 'BAI_LUYEN', 1, ?, ?, ?)",
                learner.id(), theId, nhomLoi,
                toJson(Map.of("baiLuyenId", "7", "cauHoiId", "8", "loaiCau", "CHON_NGHIA", "traLoi", traLoi, "dapAn", "đúng")),
                utc(at), utc(at));
    }

    private long progress(Learner learner, long theId, String chieu) {
        jdbc.update("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai, han_on_at) VALUES (?, ?, ?, 'HOC_LAI', ?)",
                learner.id(), theId, chieu, utc(clock.instant()));
        return jdbc.queryForObject("SELECT id FROM tien_do_the WHERE nguoi_dung_id = ? AND the_id = ? AND chieu_hoc = ?",
                Long.class, learner.id(), theId, chieu);
    }

    private void lapse(Learner learner, long tienDoId, String truoc, Instant at) {
        jdbc.update("INSERT INTO phien_hoc (nguoi_dung_id, chieu_hoc, mui_gio, bat_dau_at, quy_thoi_gian) VALUES (?, 'EN_VI', ?, ?, 10)",
                learner.id(), HCM, utc(at));
        Long phienId = jdbc.queryForObject("SELECT MAX(id) FROM phien_hoc WHERE nguoi_dung_id = ?", Long.class, learner.id());
        jdbc.update("INSERT INTO lich_su_on (nguoi_dung_id, client_event_id, phien_id, tien_do_id, danh_gia, thoi_gian, "
                        + "truoc_json, sau_json, phien_ban_thuat_toan, created_at, updated_at) "
                        + "VALUES (?, ?, ?, ?, 'QUEN', 1000, ?, '{\"trangThai\": \"HOC_LAI\"}', 'SM2-VN-2', ?, ?)",
                learner.id(), UUID.randomUUID().toString(), phienId, tienDoId,
                "{\"trangThai\": \"" + truoc + "\"}", utc(at), utc(at));
    }

    private void pair(Learner learner, long a, long b, int count, Instant at) {
        jdbc.update("INSERT INTO cap_tu_de_nham (nguoi_dung_id, the_1_id, the_2_id, so_lan_nham, lan_cuoi_at) VALUES (?, ?, ?, ?, ?)",
                learner.id(), Math.min(a, b), Math.max(a, b), count, utc(at));
    }

    private static LocalDateTime utc(Instant at) {
        return LocalDateTime.ofInstant(at, ZoneOffset.UTC);
    }

    private JsonNode item(JsonNode page, long theId) {
        for (JsonNode item : page.get("items")) {
            if (item.get("theId").asText().equals(String.valueOf(theId))) {
                return item;
            }
        }
        throw new AssertionError("Missing card " + theId);
    }

    private JsonNode notebook(Learner learner, String query) throws Exception {
        return body(mockMvc.perform(get("/api/v1/notebook" + query).cookie(learner.session()))
                .andExpect(status().isOk()));
    }

    private ResultActions update(Learner learner, long theId, Map<String, Object> body) throws Exception {
        return mockMvc.perform(put("/api/v1/notebook/" + theId).cookie(learner.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private void backdate(String id, int seconds) {
        jdbc.update("UPDATE bai_luyen SET created_at = TIMESTAMPADD(SECOND, ?, created_at) WHERE id = ?",
                -seconds, Long.valueOf(id));
    }

    private List<Key> keys(String id) {
        return jdbc.query("SELECT id, the_id, dap_an_json FROM cau_hoi_bai_luyen WHERE bai_id = ? ORDER BY thu_tu",
                (rs, row) -> new Key(rs.getString("id"),
                        jsonMapper.readTree(rs.getString("dap_an_json")).get("noiDung").asText()),
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

    private List<Long> cards(Learner learner, int count) throws Exception {
        List<Long> ids = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            Map<String, Object> body = new HashMap<>();
            body.put("tu", WORDS[i][0]);
            body.put("nghiaVi", WORDS[i][1]);
            body.put("viDuEn", WORDS[i][2]);
            ids.add(Long.parseLong(idOf(send(learner.session(), "/api/v1/decks/" + learner.deckId() + "/cards", body)
                    .andExpect(status().isCreated()))));
        }
        return ids;
    }

    private Learner learner() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Notebook tester", passwords.encode(PASSWORD),
                HCM, roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long userId = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        String deckId = idOf(send(session, "/api/v1/decks", Map.of(
                "ten", "Notebook deck " + UUID.randomUUID(),
                "trinhDo", "CO_BAN",
                "quyenTruyCap", "RIENG_TU")).andExpect(status().isCreated()));
        return new Learner(userId, session, deckId);
    }

    private ResultActions send(Cookie session, String path, Object body) throws Exception {
        return mockMvc.perform(post(path).cookie(session).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private record Key(String id, String word) {
    }

    private record Learner(Long id, Cookie session, String deckId) {
    }
}
