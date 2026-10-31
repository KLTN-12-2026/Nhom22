package com.do_an_tot_nghiep.k28.practice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.JsonNode;

class FR07PracticeSessionTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String HCM = "Asia/Ho_Chi_Minh";
    private static final String[][] WORDS = {
            {"receipt", "biên lai", "Please keep the receipt for your records."},
            {"invoice", "hóa đơn", "The invoice was sent yesterday."},
            {"deadline", "hạn chót", "We missed the deadline again."},
            {"schedule", "lịch trình", "Check the schedule before the meeting."},
            {"budget", "ngân sách", "Our budgets are tight this year."},
            {"agenda", "chương trình họp", null}
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
    void tc11_snapshotKeepsQuestionsAfterCardEditAndHidesAnswers() throws Exception {
        Learner learner = learner();
        List<Long> cards = cards(learner, 5);

        MvcResult created = create(learner, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isString())
                .andExpect(jsonPath("$.loaiBai").value("CHON_NGHIA"))
                .andExpect(jsonPath("$.nguon").value("BO_THE"))
                .andExpect(jsonPath("$.boTheId").doesNotExist())
                .andExpect(jsonPath("$.boTheTen").value("Tất cả bộ của tôi"))
                .andExpect(jsonPath("$.soCau").value(5))
                .andExpect(jsonPath("$.soCauYeuCau").value(5))
                .andExpect(jsonPath("$.createdAt").isString())
                .andExpect(jsonPath("$.cauHoi.length()").value(5))
                .andExpect(jsonPath("$.cauHoi[0].id").isString())
                .andExpect(jsonPath("$.cauHoi[0].thuTu").value(1))
                .andExpect(jsonPath("$.cauHoi[0].loaiCau").value("CHON_NGHIA"))
                .andExpect(jsonPath("$.cauHoi[0].phuongAn.length()").value(4))
                .andReturn();
        String body = created.getResponse().getContentAsString();
        assertThat(body).doesNotContain("dapAn", "giaiThich", "luaChon", "theId", "chapNhan");
        JsonNode session = jsonMapper.readTree(body);
        String id = session.get("id").asText();

        List<String> prompts = new ArrayList<>();
        for (JsonNode question : session.get("cauHoi")) {
            String word = question.get("deBai").get("tu").asText();
            prompts.add(word);
            Map<String, Object> answer = jdbc.queryForMap(
                    "SELECT JSON_UNQUOTE(JSON_EXTRACT(dap_an_json, '$.luaChonId')) AS luaChonId, "
                            + "JSON_UNQUOTE(JSON_EXTRACT(dap_an_json, '$.noiDung')) AS noiDung "
                            + "FROM cau_hoi_bai_luyen WHERE id = ?", Long.valueOf(question.get("id").asText()));
            String meaning = meaningOf(word);
            assertThat(answer.get("noiDung")).isEqualTo(meaning);
            JsonNode chosen = null;
            for (JsonNode option : question.get("phuongAn")) {
                if (option.get("id").asText().equals(answer.get("luaChonId"))) {
                    chosen = option;
                }
            }
            assertThat(chosen).isNotNull();
            assertThat(chosen.get("noiDung").asText()).isEqualTo(meaning);
        }
        assertThat(prompts).doesNotHaveDuplicates();

        jdbc.update("UPDATE the_tu_vung SET tu = 'changed', nghia_vi = 'đã sửa' WHERE id = ?", cards.get(0));
        jdbc.update("UPDATE the_tu_vung SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", cards.get(1));

        MvcResult again = mockMvc.perform(get("/api/v1/practice/sessions/" + id).cookie(learner.session()))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(jsonMapper.readTree(again.getResponse().getContentAsString())).isEqualTo(session);
        assertThat(again.getResponse().getContentAsString()).doesNotContain("changed", "đã sửa");
    }

    @Test
    void fr07_buildsBlankTypingMatchingListeningAndMixedQuestions() throws Exception {
        Learner learner = learner();
        List<Long> cards = cards(learner, 6);

        JsonNode blank = body(create(learner, Map.of("loaiBai", "DIEN_CHO_TRONG", "soCau", 10))
                .andExpect(status().isCreated()));
        assertThat(blank.get("soCau").asInt()).isEqualTo(5);
        assertThat(blank.get("soCauYeuCau").asInt()).isEqualTo(10);
        for (JsonNode question : blank.get("cauHoi")) {
            String sentence = question.get("deBai").get("cau").asText();
            assertThat(sentence).contains("_____");
            assertThat(question.get("phuongAn").isNull()).isTrue();
        }
        String budget = jdbc.queryForObject(
                "SELECT JSON_UNQUOTE(JSON_EXTRACT(q.dap_an_json, '$.chapNhan[0]')) FROM cau_hoi_bai_luyen q "
                        + "JOIN the_tu_vung c ON c.id = q.the_id WHERE q.bai_id = ? AND c.tu = 'budget'",
                String.class, Long.valueOf(blank.get("id").asText()));
        assertThat(budget).isEqualTo("budgets");

        JsonNode typing = body(create(learner, Map.of("loaiBai", "NHAP_TU_THEO_NGHIA", "soCau", 5))
                .andExpect(status().isCreated()));
        assertThat(typing.get("cauHoi").get(0).get("deBai").has("nghiaVi")).isTrue();
        assertThat(typing.get("cauHoi").get(0).get("deBai").has("tu")).isFalse();

        JsonNode matching = body(create(learner, Map.of("loaiBai", "GHEP_TU", "soCau", 5))
                .andExpect(status().isCreated()));
        assertThat(matching.get("soCau").asInt()).isEqualTo(1);
        JsonNode match = matching.get("cauHoi").get(0);
        assertThat(match.get("loaiCau").asText()).isEqualTo("GHEP_TU");
        assertThat(match.get("deBai").get("cotTrai").size()).isEqualTo(5);
        assertThat(match.get("deBai").get("cotPhai").size()).isEqualTo(5);

        create(learner, Map.of("loaiBai", "NGHE_VIET", "soCau", 5))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));
        long audio = audioFile(learner, cards.get(2));
        JsonNode listening = body(create(learner, Map.of("loaiBai", "NGHE_VIET", "soCau", 5))
                .andExpect(status().isCreated()));
        assertThat(listening.get("soCau").asInt()).isEqualTo(1);
        assertThat(listening.get("cauHoi").get(0).get("deBai").get("amTuId").asText()).isEqualTo(String.valueOf(audio));
        assertThat(listening.toString()).doesNotContain("deadline");

        JsonNode mixed = body(create(learner, Map.of("loaiBai", "TONG_HOP", "soCau", 5))
                .andExpect(status().isCreated()));
        assertThat(mixed.get("soCau").asInt()).isEqualTo(5);
        List<String> types = new ArrayList<>();
        mixed.get("cauHoi").forEach(question -> types.add(question.get("loaiCau").asText()));
        assertThat(types).isSubsetOf("CHON_NGHIA", "DIEN_CHO_TRONG", "NGHE_VIET", "CHON_TU", "NHAP_TU_THEO_NGHIA");
        assertThat(types.stream().distinct().count()).isGreaterThan(1);
    }

    @Test
    void fr07_sourcesPairsAndSuspendedCards() throws Exception {
        Learner learner = learner();
        List<Long> cards = cards(learner, 5);

        create(learner, Map.of("loaiBai", "TONG_HOP", "nguon", "SO_TAY", "soCau", 10))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.message").value("Sổ tay đang trống, chưa có từ nào để luyện."));
        create(learner, Map.of("loaiBai", "PHAN_BIET_CAP", "soCau", 5))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));

        jdbc.update("INSERT INTO so_tay_tu_kho (nguoi_dung_id, the_id) VALUES (?, ?)", learner.id(), cards.get(0));
        JsonNode notebook = body(create(learner, Map.of("loaiBai", "NHAP_TU_THEO_NGHIA", "nguon", "SO_TAY", "soCau", 5))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nguon").value("SO_TAY"))
                .andExpect(jsonPath("$.boTheTen").value("Sổ tay từ khó")));
        assertThat(notebook.get("soCau").asInt()).isEqualTo(1);

        jdbc.update("INSERT INTO cap_tu_de_nham (nguoi_dung_id, the_1_id, the_2_id, so_lan_nham) VALUES (?, ?, ?, 2)",
                learner.id(), cards.get(0), cards.get(1));
        JsonNode pair = body(create(learner, Map.of(
                "loaiBai", "PHAN_BIET_CAP",
                "theIds", List.of(String.valueOf(cards.get(1)), String.valueOf(cards.get(0))),
                "soCau", 5)).andExpect(status().isCreated()));
        assertThat(pair.get("soCau").asInt()).isEqualTo(2);
        assertThat(pair.get("cauHoi").get(0).get("phuongAn").size()).isEqualTo(2);

        JsonNode deck = body(create(learner, Map.of("loaiBai", "CHON_TU", "boTheId", learner.deckId(), "soCau", 5))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.boTheId").value(learner.deckId())));
        assertThat(deck.get("boTheTen").asText()).startsWith("Practice deck ");
        assertThat(deck.get("cauHoi").get(0).get("deBai").has("nghiaVi")).isTrue();

        for (Long suspended : List.of(cards.get(3), cards.get(4))) {
            for (String direction : List.of("EN_VI", "VI_EN")) {
                jdbc.update("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai) "
                        + "VALUES (?, ?, ?, 'TAM_NGUNG')", learner.id(), suspended, direction);
            }
        }
        create(learner, Map.of("loaiBai", "NHAP_TU_THEO_NGHIA", "theIds", List.of(String.valueOf(cards.get(4))), "soCau", 5))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.message").value("Chưa có thẻ nào để luyện. Thêm thẻ vào bộ trước."));
        create(learner, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.message").value("Cần ít nhất 4 thẻ trong các bộ của bạn để tạo phương án nhiễu."));
    }

    @Test
    void fr07_validatesInputAndHidesOtherUsersData() throws Exception {
        Learner owner = learner();
        Learner stranger = learner();
        List<Long> cards = cards(owner, 4);
        create(stranger, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5))
                .andExpect(status().isUnprocessableContent());

        expectField(owner, Map.of("loaiBai", "VIET_CAU", "soCau", 5), "loaiBai");
        expectField(owner, Map.of("soCau", 5), "loaiBai");
        expectField(owner, Map.of("loaiBai", "CHON_NGHIA", "soCau", 7), "soCau");
        expectField(owner, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5, "nguon", "AI"), "nguon");
        expectField(owner, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5, "boTheId", "abc"), "boTheId");
        expectField(owner, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5, "nguon", "SO_TAY",
                "boTheId", owner.deckId()), "boTheId");
        expectField(owner, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5, "boTheId", owner.deckId(),
                "theIds", List.of(String.valueOf(cards.get(0)))), "theIds");

        create(stranger, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5, "boTheId", owner.deckId()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        create(stranger, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5, "theIds", List.of(String.valueOf(cards.get(0)))))
                .andExpect(status().isNotFound());

        String id = body(create(owner, Map.of("loaiBai", "CHON_NGHIA", "soCau", 5))
                .andExpect(status().isCreated())).get("id").asText();
        mockMvc.perform(get("/api/v1/practice/sessions/" + id).cookie(stranger.session()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        mockMvc.perform(get("/api/v1/practice/sessions/" + id))
                .andExpect(status().isUnauthorized());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM bai_luyen WHERE nguoi_dung_id = ?",
                Integer.class, stranger.id())).isZero();
    }

    private void expectField(Learner learner, Map<String, Object> body, String field) throws Exception {
        create(learner, body)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == '" + field + "')]").exists());
    }

    private String meaningOf(String word) {
        for (String[] row : WORDS) {
            if (word.equals(row[0])) {
                return row[1];
            }
        }
        throw new IllegalArgumentException(word);
    }

    private ResultActions create(Learner learner, Map<String, Object> body) throws Exception {
        return send(learner.session(), "/api/v1/practice/sessions", body);
    }

    private JsonNode body(ResultActions actions) throws Exception {
        return jsonMapper.readTree(actions.andReturn().getResponse().getContentAsString());
    }

    private List<Long> cards(Learner learner, int count) throws Exception {
        List<Long> ids = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            String[] row = WORDS[i];
            Map<String, Object> body = new HashMap<>();
            body.put("tu", row[0]);
            body.put("nghiaVi", row[1]);
            if (row[2] != null) {
                body.put("viDuEn", row[2]);
            }
            MvcResult result = send(learner.session(), "/api/v1/decks/" + learner.deckId() + "/cards", body)
                    .andExpect(status().isCreated()).andReturn();
            ids.add(Long.parseLong(idOf(result)));
        }
        return ids;
    }

    private long audioFile(Learner learner, long cardId) {
        String key = "test/" + UUID.randomUUID() + ".mp3";
        jdbc.update("INSERT INTO tep_tin (chu_so_huu_id, object_key, mime_type, kich_thuoc, checksum, loai, hoan_tat_at) "
                + "VALUES (?, ?, 'audio/mpeg', 10, ?, 'AM_THANH', CURRENT_TIMESTAMP(3))",
                learner.id(), key, "0".repeat(64));
        long fileId = jdbc.queryForObject("SELECT id FROM tep_tin WHERE object_key = ?", Long.class, key);
        jdbc.update("INSERT INTO the_tep (the_id, tep_id, vai_tro) VALUES (?, ?, 'AM_TU')", cardId, fileId);
        return fileId;
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
        return new Learner(userId, session, idOf(deck));
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
