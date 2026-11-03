package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.common.storage.StorageService;
import com.do_an_tot_nghiep.k28.content.dto.DeckResponse;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.Nhan;
import com.do_an_tot_nghiep.k28.content.entity.TepTin;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.entity.enums.LoaiTep;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.entity.enums.VaiTroTep;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.CardLinkRepository;
import com.do_an_tot_nghiep.k28.content.repository.NhanRepository;
import com.do_an_tot_nghiep.k28.content.repository.TepTinRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import com.do_an_tot_nghiep.k28.content.service.DeckCopyService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@TestPropertySource(properties = "app.files.cleanup.enabled=false")
class FR04DeckCopyTest extends AbstractIntegrationTest {

    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired BoTheRepository decks;
    @Autowired TheTuVungRepository cards;
    @Autowired NhanRepository tags;
    @Autowired TepTinRepository files;
    @Autowired CardLinkRepository links;
    @Autowired DeckCopyService copies;
    @Autowired StorageService storage;
    @Autowired JdbcTemplate jdbc;
    @Autowired Clock clock;
    private Actor author;
    private Actor learner;
    private Long sourceId;
    private Long sourceCardId;

    @BeforeEach
    void fixtures() throws Exception {
        author = login();
        learner = login();
        BoThe source = BoThe.create(author.id(), null, "Sao chép tiếng Việt", "Mô tả nguồn",
                TrinhDo.CO_BAN, QuyenTruyCap.CONG_KHAI);
        source.updateGoal(MucTieu.TOEIC);
        sourceId = decks.saveAndFlush(source).getId();
        sourceCardId = card(sourceId, "apple");
    }

    @Test
    void tc03_copiesActiveContentTagsAndMetadataWithNewOwnership() throws Exception {
        Long deleted = card(sourceId, "deleted");
        jdbc.update("UPDATE the_tu_vung SET xoa_at=CURRENT_TIMESTAMP(3) WHERE id=?", deleted);
        jdbc.update("UPDATE bo_the SET bo_mau=true WHERE id=?", sourceId);
        Long tagId = tags.saveAndFlush(Nhan.create("Copy-" + UUID.randomUUID())).getId();
        links.replaceTags(sourceCardId, List.of(tagId), clock.instant());

        MvcResult result = copy(learner, sourceId, "content").andExpect(status().isCreated()).andReturn();
        JsonNode response = body(result);
        Long copiedId = response.get("id").asLong();
        assertThat(result.getResponse().getHeader("Location")).isEqualTo("/api/v1/decks/" + copiedId);
        assertThat(copiedId).isNotEqualTo(sourceId);
        assertThat(response.get("chuSoHuuId").asText()).isEqualTo(learner.id().toString());
        assertThat(response.get("boNguonId").asText()).isEqualTo(sourceId.toString());
        assertThat(response.get("mucTieu").asText()).isEqualTo("TOEIC");
        assertThat(response.get("quyenTruyCap").asText()).isEqualTo("RIENG_TU");
        assertThat(response.get("trangThaiKiemDuyet").asText()).isEqualTo("BINH_THUONG");
        assertThat(response.get("yeuThich").asBoolean()).isFalse();
        assertThat(decks.findById(copiedId).orElseThrow().isBoMau()).isFalse();
        var page = body(send(learner, get("/api/v1/decks/" + copiedId + "/cards"))
                .andExpect(status().isOk()).andReturn());
        assertThat(page.get("totalElements").asInt()).isEqualTo(1);
        JsonNode copiedCard = page.get("items").get(0);
        assertThat(copiedCard.get("id").asLong()).isNotEqualTo(sourceCardId);
        assertThat(copiedCard.get("nguon").asText()).isEqualTo("Tài liệu tự soạn");
        assertThat(copiedCard.get("nhanIds").get(0).asLong()).isEqualTo(tagId);
        assertThat(copiedCard.get("version").asLong()).isZero();
    }

    @Test
    void tc03_replaysOriginalSnapshotAfterSourceAndCopyChangesOrDeletion() throws Exception {
        JsonNode original = body(copy(learner, sourceId, "replay").andExpect(status().isCreated()).andReturn());
        Long resultId = original.get("id").asLong();
        jdbc.update("UPDATE bo_the SET ten='changed', xoa_at=CURRENT_TIMESTAMP(3) WHERE id IN (?,?)", sourceId, resultId);
        JsonNode replay = body(copy(learner, sourceId, "replay").andExpect(status().isCreated()).andReturn());
        assertThat(replay).isEqualTo(original);
        assertThat(countCopies()).isEqualTo(1);
        assertThat(decks.findById(resultId).orElseThrow().getXoaAt()).isNotNull();
    }

    @Test
    void tc03_reusingKeyForDifferentSourceConflictsBeforeSourceLookup() throws Exception {
        copy(learner, sourceId, "shared").andExpect(status().isCreated());
        copy(learner, Long.MAX_VALUE, "shared").andExpect(status().isConflict());
        assertThat(countCopies()).isEqualTo(1);
    }

    @Test
    void tc03_keysAreCaseSensitiveAndScopedToUser() throws Exception {
        String first = body(copy(learner, sourceId, "Case").andExpect(status().isCreated()).andReturn()).get("id").asText();
        String second = body(copy(learner, sourceId, "case").andExpect(status().isCreated()).andReturn()).get("id").asText();
        String third = body(copy(author, sourceId, "Case").andExpect(status().isCreated()).andReturn()).get("id").asText();
        assertThat(List.of(first, second, third)).doesNotHaveDuplicates();
    }

    @ParameterizedTest
    @ValueSource(strings = { "", " key", "key ", "ký", "a,b", "a/b" })
    void tc03_rejectsMalformedKeys(String key) throws Exception {
        copy(learner, sourceId, key).andExpect(status().isBadRequest());
        assertThat(countCopies()).isZero();
    }

    @Test
    void tc03_requiresKeyAndRejectsOverlengthAndNonemptyBody() throws Exception {
        send(learner, post(copyPath(sourceId))).andExpect(status().isBadRequest());
        copy(learner, sourceId, "a".repeat(129)).andExpect(status().isBadRequest());
        send(learner, post(copyPath(sourceId)).header("Idempotency-Key", "body")
                .contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isBadRequest());
        copy(learner, sourceId, "a".repeat(128)).andExpect(status().isCreated());
    }

    @ParameterizedTest
    @ValueSource(strings = { "private", "hidden", "deleted" })
    void tc03_onlyVisibleSourceCanBeCopiedEvenByItsAuthor(String state) throws Exception {
        String change = switch (state) {
            case "private" -> "quyen_truy_cap='RIENG_TU'";
            case "hidden" -> "trang_thai_kiem_duyet='DA_AN'";
            default -> "xoa_at=CURRENT_TIMESTAMP(3)";
        };
        jdbc.update("UPDATE bo_the SET " + change + " WHERE id=?", sourceId);
        copy(learner, sourceId, "hidden").andExpect(status().isNotFound());
        copy(author, sourceId, "own-hidden").andExpect(status().isNotFound());
    }

    @Test
    void tc03_requiresAuthenticationAndCsrf() throws Exception {
        mockMvc.perform(post(copyPath(sourceId)).with(xsrf()).header("Idempotency-Key", "guest"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post(copyPath(sourceId)).cookie(learner.session()).header("Idempotency-Key", "csrf"))
                .andExpect(status().isForbidden());
        copy(learner, Long.MAX_VALUE, "missing").andExpect(status().isNotFound());
    }

    @Test
    void tc03_emptyDeckAndNullableGoalArePreserved() throws Exception {
        jdbc.update("UPDATE the_tu_vung SET xoa_at=CURRENT_TIMESTAMP(3) WHERE bo_the_id=?", sourceId);
        jdbc.update("UPDATE bo_the SET muc_tieu=NULL WHERE id=?", sourceId);
        JsonNode response = body(copy(learner, sourceId, "empty").andExpect(status().isCreated()).andReturn());
        assertThat(response.get("mucTieu").isNull()).isTrue();
        send(learner, get("/api/v1/decks/" + response.get("id").asText() + "/cards"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void tc03_sameKeyConcurrentRequestsCreateExactlyOneDeck() throws Exception {
        CyclicBarrier start = new CyclicBarrier(6);
        try (var executor = Executors.newFixedThreadPool(6)) {
            var futures = java.util.stream.IntStream.range(0, 6).mapToObj(index -> executor.submit(() -> {
                start.await(15, TimeUnit.SECONDS);
                return copies.copy(learner.id(), sourceId, "concurrent");
            })).toList();
            java.util.Set<String> results = new java.util.HashSet<>();
            for (var future : futures) results.add(future.get(45, TimeUnit.SECONDS).id());
            assertThat(results).hasSize(1);
        }
        assertThat(countCopies()).isEqualTo(1);
    }

    @Test
    void tc03_invalidFileRollsBackReservationAndAllowsSameKeyRetry() throws Exception {
        TepTin pending = TepTin.pending(author.id(), "pending/" + UUID.randomUUID(), "image/png", 1, "x", LoaiTep.ANH);
        Long fileId = files.saveAndFlush(pending).getId();
        links.replaceFiles(sourceCardId, List.of(new CardLinkRepository.FileSelection(fileId, VaiTroTep.ANH)), clock.instant());
        copy(learner, sourceId, "rollback").andExpect(status().isUnprocessableContent());
        assertThat(countCopies()).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM yeu_cau_sao_chep_bo WHERE nguoi_dung_id=?", Long.class, learner.id())).isZero();
        pending.complete(pending.getObjectKey(), "image/png", 1, "x", clock.instant());
        files.saveAndFlush(pending);
        copy(learner, sourceId, "rollback").andExpect(status().isCreated());
    }

    @Test
    void tc03_sharedMediaSurvivesSourceHidingWithoutWeakeningFileOwnership() throws Exception {
        byte[] content = FileFixtures.image("png");
        String objectKey = "copy-test/" + UUID.randomUUID() + ".png";
        storage.putVerified(objectKey, content, "image/png");
        TepTin file = TepTin.pending(author.id(), objectKey, "image/png", content.length, "x", LoaiTep.ANH);
        file.complete(objectKey, "image/png", content.length, "x", clock.instant());
        Long fileId = files.saveAndFlush(file).getId();
        links.replaceFiles(sourceCardId, List.of(new CardLinkRepository.FileSelection(fileId, VaiTroTep.ANH)), clock.instant());
        Long resultId = body(copy(learner, sourceId, "media").andExpect(status().isCreated()).andReturn()).get("id").asLong();
        Long copiedCardId = jdbc.queryForObject("SELECT id FROM the_tu_vung WHERE bo_the_id=?", Long.class, resultId);
        jdbc.update("UPDATE bo_the SET trang_thai_kiem_duyet='DA_AN' WHERE id=?", sourceId);
        String mediaPath = "/api/v1/decks/" + resultId + "/cards/" + copiedCardId + "/files/ANH";
        JsonNode response = body(send(learner, get(mediaPath)).andExpect(status().isOk()).andReturn());
        assertThat(response.get("id").asLong()).isEqualTo(fileId);
        assertThat(files.findById(fileId).orElseThrow().getChuSoHuuId()).isEqualTo(author.id());
        var downloaded = HttpClient.newHttpClient().send(HttpRequest.newBuilder(URI.create(response.get("downloadUrl").asText())).GET().build(), HttpResponse.BodyHandlers.ofByteArray());
        assertThat(downloaded.statusCode()).isEqualTo(200);
        assertThat(downloaded.body()).isEqualTo(content);
        send(author, get(mediaPath)).andExpect(status().isNotFound());
        send(learner, get("/api/v1/files/" + fileId)).andExpect(status().isNotFound());
        send(learner, get("/api/v1/decks/" + resultId + "/cards/" + sourceCardId + "/files/ANH")).andExpect(status().isNotFound());
        send(author, delete("/api/v1/files/" + fileId)).andExpect(status().isConflict());
        send(learner, patch("/api/v1/cards/" + copiedCardId).contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("version", 0, "boAmTu", true, "nghiaVi", "nghĩa mới"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.anhId").value(fileId.toString()));
        assertThat(cards.findById(sourceCardId).orElseThrow().getNghiaVi()).isEqualTo("quả táo");
        Long another = card(resultId, "other");
        send(learner, patch("/api/v1/cards/" + another).contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("version", 0, "anhId", fileId.toString())))).andExpect(status().isNotFound());
    }

    @Test
    void tc03_sourceMayBecomePrivateThroughPartialPatchWithoutOptionalFlags() throws Exception {
        JsonNode copied = body(copy(learner, sourceId, "partial").andExpect(status().isCreated()).andReturn());
        send(author, patch("/api/v1/decks/" + sourceId).contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("version", 0, "quyenTruyCap", "RIENG_TU"))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.quyenTruyCap").value("RIENG_TU"));
        mockMvc.perform(get("/api/v1/library/decks/" + sourceId)).andExpect(status().isNotFound());
        send(learner, get("/api/v1/decks/" + copied.get("id").asText())).andExpect(status().isOk());
    }

    private long countCopies() {
        return jdbc.queryForObject("SELECT COUNT(*) FROM bo_the WHERE chu_so_huu_id=? AND bo_nguon_id=?", Long.class, learner.id(), sourceId);
    }

    private Long card(Long deckId, String term) {
        return cards.saveAndFlush(TheTuVung.create(deckId, term, "noun", "quả táo", "/ˈæpəl/", "An apple.", "Một quả táo.", 2, "Tài liệu tự soạn")).getId();
    }

    private String copyPath(Long id) { return "/api/v1/decks/" + id + "/copy"; }

    private ResultActions copy(Actor actor, Long id, String key) throws Exception {
        return send(actor, post(copyPath(id)).header("Idempotency-Key", key));
    }

    private ResultActions send(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.cookie(actor.session()).with(xsrf()));
    }

    private JsonNode body(MvcResult result) throws Exception {
        return jsonMapper.readTree(result.getResponse().getContentAsString(java.nio.charset.StandardCharsets.UTF_8));
    }

    private Actor login() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Copy tester", passwords.encode("matkhau123"),
                "Asia/Ho_Chi_Minh", roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long id = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("email", email, "password", "matkhau123"))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return new Actor(id, session);
    }

    private record Actor(Long id, Cookie session) { }
}
