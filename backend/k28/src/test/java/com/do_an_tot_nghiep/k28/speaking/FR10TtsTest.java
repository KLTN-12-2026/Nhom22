package com.do_an_tot_nghiep.k28.speaking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.speaking.dto.CardAudioResponse;
import com.do_an_tot_nghiep.k28.speaking.entity.enums.LoaiAmThanh;
import com.do_an_tot_nghiep.k28.speaking.service.TtsService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.JsonNode;

class FR10TtsTest extends AbstractIntegrationTest {

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
    TtsService ttsService;

    @Test
    void tc14_cacheMissGeneratesOnceAndIsSharedAcrossCards() throws Exception {
        Learner first = learner("RIENG_TU");
        Learner second = learner("RIENG_TU");
        String word = word();
        long firstCard = card(first, word, "The " + word + " is on the desk.");
        long secondCard = card(second, "  " + word + "  ", null);

        JsonNode generated = body(audio(first, firstCard, null).andExpect(status().isOk()));
        assertThat(generated.get("nguon").asText()).isEqualTo("TTS");
        assertThat(generated.get("moPhong").asBoolean()).isTrue();
        assertThat(generated.get("mimeType").asText()).isEqualTo("audio/vnd.wave");
        assertThat(generated.get("downloadUrl").asText()).isNotBlank();
        assertThat(used(first)).isEqualTo(1);

        JsonNode again = body(audio(first, firstCard, "TU").andExpect(status().isOk()));
        JsonNode shared = body(audio(second, secondCard, "TU").andExpect(status().isOk()));
        assertThat(again.get("id").asText()).isEqualTo(generated.get("id").asText());
        assertThat(shared.get("id").asText()).isEqualTo(generated.get("id").asText());
        assertThat(used(first)).isEqualTo(1);
        assertThat(used(second)).isZero();

        JsonNode sentence = body(audio(first, firstCard, "CAU").andExpect(status().isOk()));
        assertThat(sentence.get("id").asText()).isNotEqualTo(generated.get("id").asText());
        assertThat(used(first)).isEqualTo(2);

        Long fileId = generated.get("id").asLong();
        assertThat(jdbc.queryForObject("SELECT chu_so_huu_id FROM tep_tin WHERE id = ?", Long.class, fileId)).isNull();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM am_thanh_tts WHERE tep_tin_id = ?", Long.class, fileId))
                .isEqualTo(1);
        Map<String, Object> row = jdbc.queryForMap("SELECT * FROM am_thanh_tts WHERE tep_tin_id = ?", fileId);
        assertThat(row).doesNotContainKeys("nguoi_dung_id", "the_id");
        assertThat(row.get("nha_cung_cap")).isEqualTo("fake");
        assertThat(row.get("do_dai_van_ban")).isEqualTo(word.length());

        mockMvc.perform(delete("/api/v1/files/" + fileId).cookie(first.session()).with(xsrf()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/files/" + fileId).cookie(first.session()))
                .andExpect(status().isNotFound());
    }

    @Test
    void tc14_changedContentGeneratesNewAudio() throws Exception {
        Learner learner = learner("RIENG_TU");
        long card = card(learner, word(), null);
        String before = body(audio(learner, card, null).andExpect(status().isOk())).get("id").asText();

        jdbc.update("UPDATE the_tu_vung SET tu = ? WHERE id = ?", word(), card);
        String after = body(audio(learner, card, null).andExpect(status().isOk())).get("id").asText();

        assertThat(after).isNotEqualTo(before);
        assertThat(used(learner)).isEqualTo(2);
    }

    @Test
    void tc14_uploadedAudioIsPreferred() throws Exception {
        Learner learner = learner("RIENG_TU");
        long card = card(learner, word(), "An uploaded sentence.");
        long uploaded = uploadedAudio(learner, card, "AM_TU");

        JsonNode word = body(audio(learner, card, "TU").andExpect(status().isOk()));
        assertThat(word.get("id").asLong()).isEqualTo(uploaded);
        assertThat(word.get("nguon").asText()).isEqualTo("TAI_LEN");
        assertThat(word.get("moPhong").asBoolean()).isFalse();
        assertThat(used(learner)).isZero();

        JsonNode sentence = body(audio(learner, card, "CAU").andExpect(status().isOk()));
        assertThat(sentence.get("nguon").asText()).isEqualTo("TTS");
        assertThat(used(learner)).isEqualTo(1);
    }

    @Test
    void tc14_accessRulesHideForeignPrivateAndDeletedCards() throws Exception {
        Learner owner = learner("RIENG_TU");
        Learner stranger = learner("RIENG_TU");
        Learner author = learner("CONG_KHAI");
        long privateCard = card(owner, word(), null);
        long publicCard = card(author, word(), null);

        audio(stranger, privateCard, null)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        audio(owner, privateCard, "CAU")
                .andExpect(status().isNotFound());
        audio(owner, privateCard, "KHAC")
                .andExpect(status().isBadRequest());

        JsonNode shared = body(audio(stranger, publicCard, null).andExpect(status().isOk()));
        assertThat(shared.get("nguon").asText()).isEqualTo("TTS");
        assertThat(used(stranger)).isEqualTo(1);

        jdbc.update("UPDATE bo_the SET trang_thai_kiem_duyet = 'DA_AN' WHERE id = ?", Long.valueOf(author.deckId()));
        audio(stranger, publicCard, null).andExpect(status().isNotFound());

        jdbc.update("UPDATE the_tu_vung SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", privateCard);
        audio(owner, privateCard, null).andExpect(status().isNotFound());

        mockMvc.perform(get("/api/v1/cards/" + publicCard + "/audio")).andExpect(status().isUnauthorized());
    }

    @Test
    void tc14_quotaExhaustedReturns429AndFailuresRefund() throws Exception {
        Learner learner = learner("RIENG_TU");
        long failing = card(learner, "loi " + word() + " #mo-phong:LOI", null);
        long timeout = card(learner, "cham " + word() + " #mo-phong:TIMEOUT", null);
        long ok = card(learner, word(), null);

        audio(learner, failing, null)
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("TTS_UNAVAILABLE"));
        audio(learner, timeout, null)
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("TTS_UNAVAILABLE"));
        assertThat(used(learner)).isZero();
        assertThat(reserved(learner)).isZero();

        jdbc.update("UPDATE su_dung_dich_vu SET so_dung = 100 WHERE nguoi_dung_id = ? AND ngay = ? AND loai = 'TTS'",
                learner.id(), today());
        audio(learner, ok, null)
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"))
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    void tc14_parallelRequestsCreateOneFile() throws Exception {
        Learner learner = learner("RIENG_TU");
        long card = card(learner, "song " + word() + " #mo-phong:CHAM", null);
        long before = ttsFiles();

        ExecutorService pool = Executors.newFixedThreadPool(2);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<CardAudioResponse>> futures = List.of(
                    pool.submit(() -> {
                        start.await();
                        return ttsService.cardAudio(learner.id(), card, LoaiAmThanh.TU);
                    }),
                    pool.submit(() -> {
                        start.await();
                        return ttsService.cardAudio(learner.id(), card, LoaiAmThanh.TU);
                    }));
            start.countDown();
            Set<String> ids = new HashSet<>();
            for (Future<CardAudioResponse> future : futures) {
                ids.add(future.get(30, TimeUnit.SECONDS).id());
            }
            assertThat(ids).hasSize(1);
        } finally {
            pool.shutdownNow();
        }

        assertThat(ttsFiles() - before).isEqualTo(1);
        assertThat(used(learner)).isEqualTo(1);
        assertThat(reserved(learner)).isZero();
    }

    @Test
    void tc14_listeningPracticeUsesTtsForCardsWithoutAudio() throws Exception {
        Learner learner = learner("RIENG_TU");
        String secret = word();
        for (int i = 0; i < 4; i++) {
            card(learner, word(), null);
        }
        card(learner, secret, null);

        JsonNode practice = body(send(learner.session(), "/api/v1/practice/sessions",
                Map.of("loaiBai", "NGHE_VIET", "soCau", 5)).andExpect(status().isCreated()));
        assertThat(practice.get("soCau").asInt()).isEqualTo(5);
        assertThat(practice.toString()).doesNotContain(secret);
        JsonNode question = practice.get("cauHoi").get(0);
        assertThat(question.get("deBai").get("amThanhTts").asBoolean()).isTrue();
        assertThat(question.get("deBai").has("amTuId")).isFalse();

        String path = "/api/v1/practice/sessions/" + practice.get("id").asText()
                + "/questions/" + question.get("id").asText() + "/audio";
        JsonNode file = body(mockMvc.perform(get(path).cookie(learner.session())).andExpect(status().isOk()));
        assertThat(file.get("mimeType").asText()).isEqualTo("audio/vnd.wave");
        assertThat(file.get("downloadUrl").asText()).isNotBlank();
        assertThat(file.toString()).doesNotContain(secret, "nguon", "theId");
        assertThat(used(learner)).isEqualTo(1);
    }

    private String word() {
        return "w" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private ResultActions audio(Learner learner, long cardId, String loai) throws Exception {
        var request = get("/api/v1/cards/" + cardId + "/audio").cookie(learner.session());
        return mockMvc.perform(loai == null ? request : request.param("loai", loai));
    }

    private int used(Learner learner) {
        return counter(learner, "so_dung");
    }

    private int reserved(Learner learner) {
        return counter(learner, "so_giu");
    }

    private int counter(Learner learner, String column) {
        Integer value = jdbc.query("SELECT " + column + " FROM su_dung_dich_vu WHERE nguoi_dung_id = ? AND ngay = ? AND loai = 'TTS'",
                rs -> rs.next() ? rs.getInt(1) : 0, learner.id(), today());
        return value == null ? 0 : value;
    }

    private long ttsFiles() {
        return jdbc.queryForObject("SELECT COUNT(*) FROM tep_tin WHERE object_key LIKE 'tts/%'", Long.class);
    }

    private LocalDate today() {
        return clock.instant().atZone(ZoneId.of(HCM)).toLocalDate();
    }

    private long uploadedAudio(Learner learner, long cardId, String role) {
        String key = "test/" + UUID.randomUUID() + ".mp3";
        jdbc.update("INSERT INTO tep_tin (chu_so_huu_id, object_key, mime_type, kich_thuoc, checksum, loai, hoan_tat_at) "
                        + "VALUES (?, ?, 'audio/mpeg', 10, ?, 'AM_THANH', CURRENT_TIMESTAMP(3))",
                learner.id(), key, "0".repeat(64));
        long fileId = jdbc.queryForObject("SELECT id FROM tep_tin WHERE object_key = ?", Long.class, key);
        jdbc.update("INSERT INTO the_tep (the_id, tep_id, vai_tro) VALUES (?, ?, ?)", cardId, fileId, role);
        return fileId;
    }

    private long card(Learner learner, String tu, String viDuEn) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("tu", tu);
        body.put("nghiaVi", "nghĩa " + UUID.randomUUID());
        if (viDuEn != null) {
            body.put("viDuEn", viDuEn);
        }
        MvcResult result = send(learner.session(), "/api/v1/decks/" + learner.deckId() + "/cards", body)
                .andExpect(status().isCreated()).andReturn();
        return Long.parseLong(idOf(result));
    }

    private Learner learner(String quyenTruyCap) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "TTS tester", passwords.encode(PASSWORD),
                HCM, roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long userId = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        MvcResult deck = send(session, "/api/v1/decks", Map.of(
                "ten", "TTS deck " + UUID.randomUUID(),
                "trinhDo", "CO_BAN",
                "quyenTruyCap", quyenTruyCap)).andExpect(status().isCreated()).andReturn();
        return new Learner(userId, session, idOf(deck));
    }

    private JsonNode body(ResultActions actions) throws Exception {
        return jsonMapper.readTree(actions.andReturn().getResponse().getContentAsString());
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
