package com.do_an_tot_nghiep.k28.speaking;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.JsonNode;

class FR10PronunciationTest extends AbstractIntegrationTest {

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

    @Test
    void tc14_assessmentStoresScoresRecordingAndComparesWithPreviousAttempt() throws Exception {
        Learner learner = learner("RIENG_TU");
        Learner stranger = learner("RIENG_TU");
        long card = card(learner, word());

        JsonNode first = body(assess(learner, card, wav(16000, 1, 16, 1000, 3)).andExpect(status().isCreated()));
        assertThat(first.get("trangThai").asText()).isEqualTo("DAY_DU");
        assertThat(first.get("moPhong").asBoolean()).isTrue();
        assertThat(first.get("nhaCungCap").asText()).isEqualTo("fake");
        assertThat(first.get("thoiLuongGhiMs").asInt()).isEqualTo(1000);
        assertThat(first.get("chiSo").get("tongDiem").isNumber()).isTrue();
        assertThat(first.get("ghiAm").get("downloadUrl").asText()).isNotBlank();
        assertThat(first.get("soSanh").isNull()).isTrue();
        assertThat(used(learner)).isEqualTo(1);

        JsonNode second = body(assess(learner, card, wav(16000, 1, 16, 1500, 7)).andExpect(status().isCreated()));
        JsonNode soSanh = second.get("soSanh");
        assertThat(soSanh.get("lanTruocId").asText()).isEqualTo(first.get("id").asText());
        assertThat(soSanh.get("cungThangDo").asBoolean()).isTrue();
        double expected = second.get("chiSo").get("tongDiem").asDouble() - first.get("chiSo").get("tongDiem").asDouble();
        assertThat(soSanh.get("tongDiem").asDouble()).isEqualTo(expected);
        assertThat(used(learner)).isEqualTo(2);

        String recordingId = first.get("ghiAm").get("id").asText();
        assertThat(jdbc.queryForObject("SELECT chu_so_huu_id FROM tep_tin WHERE id = ?", Long.class,
                Long.valueOf(recordingId))).isEqualTo(learner.id());

        JsonNode fetched = body(mockMvc.perform(get("/api/v1/pronunciation/assessments/" + second.get("id").asText())
                .cookie(learner.session())).andExpect(status().isOk()));
        assertThat(fetched.get("soSanh").get("lanTruocId").asText()).isEqualTo(first.get("id").asText());
        mockMvc.perform(get("/api/v1/pronunciation/assessments/" + second.get("id").asText())
                        .cookie(stranger.session()))
                .andExpect(status().isNotFound());

        JsonNode history = body(mockMvc.perform(get("/api/v1/pronunciation/history")
                .param("theId", String.valueOf(card)).cookie(learner.session())).andExpect(status().isOk()));
        assertThat(history.get("totalElements").asLong()).isEqualTo(2);
        assertThat(history.get("items").get(0).get("id").asText()).isEqualTo(second.get("id").asText());
        assertThat(history.get("items").get(0).get("tepGhiAmId").asText()).isEqualTo(second.get("ghiAm").get("id").asText());
        JsonNode foreign = body(mockMvc.perform(get("/api/v1/pronunciation/history")
                .param("theId", String.valueOf(card)).cookie(stranger.session())).andExpect(status().isOk()));
        assertThat(foreign.get("totalElements").asLong()).isZero();
    }

    @Test
    void tc14_missingMetricsAreNotInventedOrCompared() throws Exception {
        Learner learner = learner("RIENG_TU");
        long partial = card(learner, "thieu " + word() + " #mo-phong:THIEU_CHI_SO");
        long silent = card(learner, "im " + word() + " #mo-phong:KHONG_NHAN_DIEN");

        JsonNode first = body(assess(learner, partial, wav(16000, 1, 16, 800, 1)).andExpect(status().isCreated()));
        assertThat(first.get("trangThai").asText()).isEqualTo("THIEU_CHI_SO");
        assertThat(first.get("chiSo").get("tongDiem").isNull()).isTrue();
        assertThat(first.get("chiSo").get("doTroiChay").isNull()).isTrue();
        assertThat(first.get("chiSo").get("doChinhXac").isNumber()).isTrue();

        JsonNode second = body(assess(learner, partial, wav(16000, 1, 16, 900, 2)).andExpect(status().isCreated()));
        assertThat(second.get("soSanh").get("tongDiem").isNull()).isTrue();
        assertThat(second.get("soSanh").get("doTroiChay").isNull()).isTrue();
        assertThat(second.get("soSanh").get("doChinhXac").isNumber()).isTrue();

        JsonNode none = body(assess(learner, silent, wav(16000, 1, 16, 700, 4)).andExpect(status().isCreated()));
        assertThat(none.get("trangThai").asText()).isEqualTo("KHONG_NHAN_DIEN");
        for (String metric : new String[]{"tongDiem", "doChinhXac", "doTroiChay", "doDayDu"}) {
            assertThat(none.get("chiSo").get(metric).isNull()).isTrue();
        }
        assertThat(used(learner)).isEqualTo(3);
    }

    @Test
    void tc14_invalidRecordingsAndForeignCardsAreRejectedWithoutQuota() throws Exception {
        Learner learner = learner("RIENG_TU");
        Learner owner = learner("RIENG_TU");
        Learner author = learner("CONG_KHAI");
        long card = card(learner, word());
        long privateCard = card(owner, word());
        long publicCard = card(author, word());

        mockMvc.perform(multipart("/api/v1/pronunciation/assessments").param("theId", String.valueOf(card))
                        .cookie(learner.session()).with(xsrf()))
                .andExpect(status().isBadRequest());
        assess(learner, card, "not a wav file at all, just some text bytes".getBytes())
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));
        assess(learner, card, wav(8000, 1, 16, 1000, 1)).andExpect(status().isUnprocessableContent());
        assess(learner, card, wav(16000, 2, 16, 1000, 1)).andExpect(status().isUnprocessableContent());
        assess(learner, card, wav(16000, 1, 16, 15100, 1)).andExpect(status().isUnprocessableContent());
        assess(learner, privateCard, wav(16000, 1, 16, 1000, 1))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
        mockMvc.perform(multipart("/api/v1/pronunciation/assessments").file(recording(wav(16000, 1, 16, 500, 1)))
                        .param("theId", String.valueOf(card)).with(xsrf()))
                .andExpect(status().isUnauthorized());
        assertThat(used(learner)).isZero();
        assertThat(reserved(learner)).isZero();
        assertThat(rows(learner)).isZero();

        assess(learner, publicCard, wav(16000, 1, 16, 15000, 1)).andExpect(status().isCreated());
        assertThat(used(learner)).isEqualTo(1);
    }

    @Test
    void tc14_serviceFailuresRefundAndQuotaExhaustionReturns429() throws Exception {
        Learner learner = learner("RIENG_TU");
        long failing = card(learner, "loi " + word() + " #mo-phong:LOI");
        long timeout = card(learner, "cham " + word() + " #mo-phong:TIMEOUT");
        long ok = card(learner, word());
        long recordingsBefore = recordings(learner);

        assess(learner, failing, wav(16000, 1, 16, 600, 1))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("SPEECH_UNAVAILABLE"));
        assess(learner, timeout, wav(16000, 1, 16, 600, 1))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("SPEECH_UNAVAILABLE"));
        assertThat(used(learner)).isZero();
        assertThat(reserved(learner)).isZero();
        assertThat(rows(learner)).isZero();
        assertThat(recordings(learner)).isEqualTo(recordingsBefore);

        jdbc.update("UPDATE su_dung_dich_vu SET so_dung = 30 WHERE nguoi_dung_id = ? AND ngay = ? AND loai = 'PHAT_AM'",
                learner.id(), today());
        assess(learner, ok, wav(16000, 1, 16, 600, 1))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"))
                .andExpect(header().exists("Retry-After"));
        assertThat(rows(learner)).isZero();
    }

    @Test
    void tc14_deletingRecordingKeepsScores() throws Exception {
        Learner learner = learner("RIENG_TU");
        Learner stranger = learner("RIENG_TU");
        long card = card(learner, word());
        JsonNode result = body(assess(learner, card, wav(16000, 1, 16, 1000, 5)).andExpect(status().isCreated()));
        String recordingId = result.get("ghiAm").get("id").asText();

        mockMvc.perform(delete("/api/v1/pronunciation/recordings/" + recordingId)
                        .cookie(stranger.session()).with(xsrf()))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/v1/pronunciation/recordings/" + recordingId)
                        .cookie(learner.session()).with(xsrf()))
                .andExpect(status().isNoContent());

        JsonNode after = body(mockMvc.perform(get("/api/v1/pronunciation/assessments/" + result.get("id").asText())
                .cookie(learner.session())).andExpect(status().isOk()));
        assertThat(after.get("ghiAm").isNull()).isTrue();
        assertThat(after.get("chiSo").get("tongDiem").asDouble())
                .isEqualTo(result.get("chiSo").get("tongDiem").asDouble());
        assertThat(jdbc.queryForObject("SELECT trang_thai_xoa FROM tep_tin WHERE id = ?", String.class,
                Long.valueOf(recordingId))).isEqualTo("DA_XOA");
        mockMvc.perform(delete("/api/v1/pronunciation/recordings/" + recordingId)
                        .cookie(learner.session()).with(xsrf()))
                .andExpect(status().isNotFound());
    }

    private ResultActions assess(Learner learner, long cardId, byte[] content) throws Exception {
        return mockMvc.perform(multipart("/api/v1/pronunciation/assessments").file(recording(content))
                .param("theId", String.valueOf(cardId)).cookie(learner.session()).with(xsrf()));
    }

    private MockMultipartFile recording(byte[] content) {
        return new MockMultipartFile("file", "ghi-am.wav", "audio/wav", content);
    }

    private byte[] wav(int sampleRate, int channels, int bits, int millis, int seed) {
        int blockAlign = channels * bits / 8;
        int dataBytes = (int) ((long) sampleRate * millis / 1000) * blockAlign;
        ByteBuffer buffer = ByteBuffer.allocate(44 + dataBytes).order(ByteOrder.LITTLE_ENDIAN);
        buffer.put("RIFF".getBytes()).putInt(36 + dataBytes).put("WAVE".getBytes());
        buffer.put("fmt ".getBytes()).putInt(16).putShort((short) 1).putShort((short) channels)
                .putInt(sampleRate).putInt(sampleRate * blockAlign).putShort((short) blockAlign)
                .putShort((short) bits);
        buffer.put("data".getBytes()).putInt(dataBytes);
        for (int i = 0; buffer.remaining() >= 2; i++) {
            buffer.putShort((short) (Math.sin(i * (seed + 1) / 10.0) * 4000));
        }
        return buffer.array();
    }

    private String word() {
        return "w" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
    }

    private int used(Learner learner) {
        return counter(learner, "so_dung");
    }

    private int reserved(Learner learner) {
        return counter(learner, "so_giu");
    }

    private int counter(Learner learner, String column) {
        Integer value = jdbc.query("SELECT " + column + " FROM su_dung_dich_vu WHERE nguoi_dung_id = ? AND ngay = ? "
                        + "AND loai = 'PHAT_AM'",
                rs -> rs.next() ? rs.getInt(1) : 0, learner.id(), today());
        return value == null ? 0 : value;
    }

    private long rows(Learner learner) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM ket_qua_phat_am WHERE nguoi_dung_id = ?", Long.class,
                learner.id());
    }

    private long recordings(Learner learner) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM tep_tin WHERE object_key LIKE ?", Long.class,
                "recordings/" + learner.id() + "/%");
    }

    private LocalDate today() {
        return clock.instant().atZone(ZoneId.of(HCM)).toLocalDate();
    }

    private long card(Learner learner, String tu) throws Exception {
        MvcResult result = send(learner.session(), "/api/v1/decks/" + learner.deckId() + "/cards",
                Map.of("tu", tu, "nghiaVi", "nghĩa " + UUID.randomUUID()))
                .andExpect(status().isCreated()).andReturn();
        return Long.parseLong(idOf(result));
    }

    private Learner learner(String quyenTruyCap) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Speech tester", passwords.encode(PASSWORD),
                HCM, roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long userId = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        MvcResult deck = send(session, "/api/v1/decks", Map.of(
                "ten", "Speech deck " + UUID.randomUUID(),
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
