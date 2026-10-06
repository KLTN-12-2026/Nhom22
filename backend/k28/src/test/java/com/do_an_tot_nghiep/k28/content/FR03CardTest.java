package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.common.storage.StorageService;
import com.do_an_tot_nghiep.k28.content.dto.UploadRequestResponse;
import com.do_an_tot_nghiep.k28.content.dto.UpdateCardRequest;
import com.do_an_tot_nghiep.k28.content.entity.TepTin;
import com.do_an_tot_nghiep.k28.content.entity.enums.LoaiTep;
import com.do_an_tot_nghiep.k28.content.repository.TepTinRepository;
import com.do_an_tot_nghiep.k28.content.service.FileService;
import com.do_an_tot_nghiep.k28.content.service.CardService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.MessageDigest;
import java.sql.Timestamp;
import java.time.Clock;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR03CardTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";

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
    TepTinRepository files;
    @Autowired
    FileService fileService;
    @Autowired
    StorageService storage;
    @Autowired
    CardService cardService;
    @Autowired
    PlatformTransactionManager transactionManager;

    private Actor owner;
    private Actor other;
    private String deckId;

    @BeforeEach
    void setUp() throws Exception {
        owner = login("USER");
        other = login("USER");
        deckId = createDeck(owner, "RIENG_TU");
    }

    @Test
    void fr03_createStoresAllFieldsAndDefaults() throws Exception {
        Map<String, Object> body = fullCard();
        MvcResult result = send(owner, post(cardsPath()), body)
                .andExpect(status().isCreated()).andReturn();
        JsonNode card = body(result);
        assertThat(result.getResponse().getHeader("Location"))
                .isEqualTo(cardPath(card));
        assertThat(card.get("id").isString()).isTrue();
        assertThat(card.get("boTheId").asText()).isEqualTo(deckId);
        assertThat(card.get("tu").asText()).isEqualTo("Apple");
        assertThat(card.get("tuLoai").asText()).isEqualTo("Noun");
        assertThat(card.get("nghiaVi").asText()).isEqualTo("quả táo");
        for (String field : List.of("phienAm", "viDuEn", "dichVi", "nguon")) {
            assertThat(card.get(field).asText()).isEqualTo(body.get(field));
        }
        assertThat(card.get("doKho").asInt()).isEqualTo(2);
        assertThat(card.get("version").asLong()).isZero();
        assertThat(card.get("createdAt").asText()).isNotBlank();
        assertThat(card.get("updatedAt").asText()).isNotBlank();
        assertThat(card.get("nhanIds").size()).isZero();
        assertThat(card.get("theTrungIds").size()).isZero();
        assertThat(card.get("trung").asBoolean()).isFalse();

        JsonNode minimal = create(Map.of("tu", "book", "nghiaVi", "sách"));
        assertThat(minimal.get("doKho").asInt()).isEqualTo(1);
        for (String field : List.of("tuLoai", "phienAm", "viDuEn", "dichVi",
                "nguon", "anhId", "amTuId", "amCauId")) {
            assertThat(minimal.get(field).isNull()).isTrue();
        }
        assertThat(jdbc.queryForObject("SELECT version FROM bo_the WHERE id=?",
                Long.class, Long.valueOf(deckId))).isZero();
    }

    @Test
    void fr03_listPagesDescendingAndFindsDuplicatesOutsidePage() throws Exception {
        JsonNode first = create(Map.of("tu", "ice cream", "tuLoai", "noun", "nghiaVi", "kem"));
        JsonNode second = create(Map.of("tu", " ICE\u00a0\u202fCREAM ", "tuLoai", " NOUN ", "nghiaVi", "kem"));
        assertThat(second.get("trung").asBoolean()).isTrue();
        assertThat(second.get("theTrungIds").get(0).asText()).isEqualTo(id(first));
        mockMvc.perform(get(cardsPath()).cookie(owner.session()).param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(1))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.items[0].id").value(id(second)))
                .andExpect(jsonPath("$.items[0].trung").value(true))
                .andExpect(jsonPath("$.items[0].theTrungIds[0]").value(id(first)));
        mockMvc.perform(get(cardsPath()).cookie(owner.session()).param("page", "99"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty())
                .andExpect(jsonPath("$.totalElements").value(2));
        for (String query : List.of("page=-1", "size=0", "size=101")) {
            mockMvc.perform(get(cardsPath() + "?" + query).cookie(owner.session()))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }
    }

    @Test
    void fr03_duplicateKeyUsesNfcAndPosWithinActiveParentOnly() throws Exception {
        JsonNode original = create(Map.of("tu", "cafe\u0301", "tuLoai", "noun", "nghiaVi", "quán"));
        JsonNode duplicate = create(Map.of("tu", "CAFÉ", "tuLoai", "NOUN", "nghiaVi", "quán"));
        assertThat(original.get("tu").asText()).isEqualTo("café");
        assertThat(duplicate.get("theTrungIds").size()).isEqualTo(1);
        assertThat(duplicate.get("theTrungIds").get(0).asText()).isEqualTo(id(original));
        for (Map<String, Object> request : List.of(
                Map.<String, Object>of("tu", "cafe", "tuLoai", "noun", "nghiaVi", "không dấu"),
                Map.<String, Object>of("tu", "café", "tuLoai", "verb", "nghiaVi", "khác loại"))) {
            assertThat(create(request).get("trung").asBoolean()).isFalse();
        }
        String another = createDeck(owner, "RIENG_TU");
        send(owner, post("/api/v1/decks/" + another + "/cards"),
                Map.of("tu", "café", "tuLoai", "noun", "nghiaVi", "bộ khác"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.trung").value(false));
        remove(original, 0).andExpect(status().isNoContent());
        JsonNode remaining = readCard(duplicate);
        assertThat(remaining.get("trung").asBoolean()).isFalse();
        JsonNode noPos = create(Map.of("tu", "apple", "nghiaVi", "táo"));
        assertThat(create(Map.of("tu", "APPLE", "tuLoai", "\u00a0", "nghiaVi", "táo"))
                .get("theTrungIds").get(0).asText()).isEqualTo(id(noPos));
        JsonNode changed = update(remaining, Map.of("tu", "cafe"));
        assertThat(changed.get("trung").asBoolean()).isTrue();
    }

    @ParameterizedTest
    @CsvSource({"USER,RIENG_TU", "USER,CONG_KHAI", "ADMIN,RIENG_TU", "ADMIN,CONG_KHAI"})
    void tc02_foreignParentHidesAllCardOperations(String role, String visibility) throws Exception {
        if (visibility.equals("CONG_KHAI")) {
            jdbc.update("UPDATE bo_the SET quyen_truy_cap=? WHERE id=?", visibility, Long.valueOf(deckId));
        }
        Actor actor = role.equals("USER") ? other : login("ADMIN");
        JsonNode card = readCard(create(fullCard()));
        mockMvc.perform(get(cardsPath()).cookie(actor.session()))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("NOT_FOUND"));
        send(actor, post(cardsPath()), fullCard())
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("NOT_FOUND"));
        send(actor, patch(cardPath(card)), Map.of("version", 0, "nghiaVi", "không được sửa"))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("NOT_FOUND"));
        mockMvc.perform(delete(cardPath(card)).param("version", "0").cookie(actor.session()).with(xsrf()))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("NOT_FOUND"));
        assertThat(readCard(card)).isEqualTo(card);
    }

    @Test
    void fr03_adminCanManageCardsInOwnDeck() throws Exception {
        Actor admin = login("ADMIN");
        String parent = createDeck(admin, "RIENG_TU");
        String path = "/api/v1/decks/" + parent + "/cards";
        JsonNode card = body(send(admin, post(path), fullCard()).andExpect(status().isCreated()).andReturn());
        mockMvc.perform(get(path).cookie(admin.session())).andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(id(card)));
        send(admin, patch(cardPath(card)), Map.of("version", 0, "nghiaVi", "táo mới"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.version").value(1));
        mockMvc.perform(delete(cardPath(card)).param("version", "1").cookie(admin.session()).with(xsrf()))
                .andExpect(status().isNoContent());
    }

    @Test
    void fr03_guestAndMissingCsrfCannotManageCards() throws Exception {
        JsonNode card = readCard(create(fullCard()));
        mockMvc.perform(get(cardsPath())).andExpect(status().isUnauthorized());
        for (MockHttpServletRequestBuilder request : List.of(post(cardsPath()), patch(cardPath(card)))) {
            mockMvc.perform(request.with(xsrf()).contentType(MediaType.APPLICATION_JSON)
                            .content(toJson(Map.of("tu", "book", "nghiaVi", "sách", "version", 0))))
                    .andExpect(status().isUnauthorized());
        }
        mockMvc.perform(delete(cardPath(card)).param("version", "0").with(xsrf()))
                .andExpect(status().isUnauthorized());
        for (MockHttpServletRequestBuilder request : List.of(post(cardsPath()), patch(cardPath(card)))) {
            mockMvc.perform(request.cookie(owner.session()).contentType(MediaType.APPLICATION_JSON)
                            .content(toJson(Map.of("tu", "book", "nghiaVi", "sách", "version", 0))))
                    .andExpect(status().isForbidden());
        }
        mockMvc.perform(delete(cardPath(card)).param("version", "0").cookie(owner.session()))
                .andExpect(status().isForbidden());
        assertThat(readCard(card)).isEqualTo(card);
    }

    @ParameterizedTest
    @ValueSource(strings = {"GET", "POST", "PATCH", "DELETE"})
    void tc02_softDeletedParentBlocksCardOperations(String method) throws Exception {
        JsonNode card = create(fullCard());
        jdbc.update("UPDATE bo_the SET xoa_at=UTC_TIMESTAMP(3) WHERE id=?", Long.valueOf(deckId));
        ResultActions result = switch (method) {
            case "GET" -> mockMvc.perform(get(cardsPath()).cookie(owner.session()));
            case "POST" -> send(owner, post(cardsPath()), fullCard());
            case "PATCH" -> send(owner, patch(cardPath(card)), Map.of("version", 0, "nghiaVi", "không sửa"));
            case "DELETE" -> remove(card, 0);
            default -> throw new IllegalArgumentException(method);
        };
        result.andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("NOT_FOUND"));
        assertThat(jdbc.queryForObject("SELECT version FROM the_tu_vung WHERE id=?",
                Long.class, Long.valueOf(id(card)))).isZero();
        assertThat(jdbc.queryForObject("SELECT xoa_at FROM the_tu_vung WHERE id=?",
                Timestamp.class, Long.valueOf(id(card)))).isNull();
    }

    @Test
    void fr03_patchPreservesNullAndClearsEmptyOptionalFields() throws Exception {
        JsonNode card = create(fullCard());
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("tu", null);
        request.put("tuLoai", null);
        request.put("nghiaVi", "táo mới");
        request.put("nguon", "\u00a0\u202f");
        JsonNode updated = update(card, request);
        assertThat(updated.get("tu")).isEqualTo(card.get("tu"));
        assertThat(updated.get("tuLoai")).isEqualTo(card.get("tuLoai"));
        assertThat(updated.get("phienAm")).isEqualTo(card.get("phienAm"));
        assertThat(updated.get("nghiaVi").asText()).isEqualTo("táo mới");
        assertThat(updated.get("nguon").isNull()).isTrue();
        assertThat(updated.get("version").asLong()).isEqualTo(1);
        JsonNode cleared = update(updated, Map.of("tuLoai", "", "phienAm", "", "viDuEn", "", "dichVi", ""));
        for (String field : List.of("tuLoai", "phienAm", "viDuEn", "dichVi")) {
            assertThat(cleared.get(field).isNull()).isTrue();
        }
    }

    @Test
    void fr03_staleVersionsFailAndNoOpIncrementsExactlyOnce() throws Exception {
        JsonNode card = create(fullCard());
        JsonNode updated = update(card, Map.of());
        assertThat(updated.get("version").asLong()).isEqualTo(1);
        send(owner, patch(cardPath(card)), Map.of("version", 0, "nghiaVi", "stale"))
                .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("VERSION_CONFLICT"));
        remove(card, 0).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VERSION_CONFLICT"));
        assertThat(readCard(card)).isEqualTo(updated);
        JsonNode same = update(updated, Map.of("tu", updated.get("tu").asText(), "nghiaVi", updated.get("nghiaVi").asText()));
        assertThat(same.get("version").asLong()).isEqualTo(2);
        assertThat(jdbc.queryForObject("SELECT version FROM bo_the WHERE id=?",
                Long.class, Long.valueOf(deckId))).isZero();
    }

    @Test
    void fr03_tagsValidateAndReplaceWithoutLosingOtherFields() throws Exception {
        String tag = tag();
        JsonNode card = create(Map.of("tu", "apple", "nghiaVi", "táo", "nhanIds", List.of(tag)));
        assertThat(card.get("nhanIds").get(0).asText()).isEqualTo(tag);
        Map<String, Object> omitted = new LinkedHashMap<>();
        omitted.put("nhanIds", null);
        JsonNode retained = update(card, omitted);
        assertThat(retained.get("nhanIds")).isEqualTo(card.get("nhanIds"));
        JsonNode cleared = update(retained, Map.of("nhanIds", List.of()));
        assertThat(cleared.get("nhanIds").size()).isZero();
        JsonNode restored = update(cleared, Map.of("nhanIds", List.of(tag)));
        assertThat(restored.get("version").asLong()).isEqualTo(3);
        send(owner, patch(cardPath(card)), Map.of("version", 3, "nhanIds", List.of(tag, tag)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        send(owner, patch(cardPath(card)), Map.of("version", 3, "nhanIds", List.of("9223372036854775807")))
                .andExpect(status().is(422)).andExpect(jsonPath("$.code").value("BUSINESS_RULE"));
        assertThat(readCard(card)).isEqualTo(restored);
    }

    @Test
    void fr03_mediaOnlyPatchPreservesRolesAndIncrementsOnce() throws Exception {
        String image = file(owner, LoaiTep.ANH, true, false);
        String replacement = file(owner, LoaiTep.ANH, true, false);
        String audio = file(owner, LoaiTep.AM_THANH, true, false);
        JsonNode card = create(Map.of("tu", "apple", "nghiaVi", "táo", "anhId", image, "amTuId", audio, "amCauId", audio));
        JsonNode replaced = update(card, Map.of("anhId", replacement));
        assertThat(replaced.get("version").asLong()).isEqualTo(1);
        assertThat(replaced.get("anhId").asText()).isEqualTo(replacement);
        assertThat(replaced.get("amTuId").asText()).isEqualTo(audio);
        assertThat(replaced.get("amCauId").asText()).isEqualTo(audio);
        JsonNode unlinked = update(replaced, Map.of("boAnh", true, "boAmTu", true));
        assertThat(unlinked.get("version").asLong()).isEqualTo(2);
        assertThat(unlinked.get("anhId").isNull()).isTrue();
        assertThat(unlinked.get("amTuId").isNull()).isTrue();
        assertThat(unlinked.get("amCauId").asText()).isEqualTo(audio);
        JsonNode cleared = update(unlinked, Map.of("boAmCau", true));
        assertThat(cleared.get("amCauId").isNull()).isTrue();
        assertThat(files.findById(Long.valueOf(image)).orElseThrow().getXoaAt()).isNull();
        assertThat(files.findById(Long.valueOf(replacement)).orElseThrow().getXoaAt()).isNull();
        assertThat(files.findById(Long.valueOf(audio)).orElseThrow().getXoaAt()).isNull();
    }

    @Test
    void fr03_rejectsForeignDeletedIncompleteAndWrongTypeFiles() throws Exception {
        String foreign = file(other, LoaiTep.ANH, true, false);
        String deleted = file(owner, LoaiTep.ANH, true, true);
        String pending = file(owner, LoaiTep.ANH, false, false);
        String audio = file(owner, LoaiTep.AM_THANH, true, false);
        String image = file(owner, LoaiTep.ANH, true, false);
        for (String value : List.of(foreign, deleted, "9223372036854775807")) {
            send(owner, post(cardsPath()), Map.of("tu", "apple", "nghiaVi", "táo", "anhId", value))
                    .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("NOT_FOUND"));
        }
        for (Map<String, Object> selection : List.of(
                Map.<String, Object>of("anhId", pending), Map.<String, Object>of("anhId", audio),
                Map.<String, Object>of("amTuId", image), Map.<String, Object>of("amCauId", image))) {
            Map<String, Object> request = new LinkedHashMap<>(selection);
            request.put("tu", "apple");
            request.put("nghiaVi", "táo");
            send(owner, post(cardsPath()), request).andExpect(status().is(422))
                    .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));
        }
        mockMvc.perform(get(cardsPath()).cookie(owner.session())).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void fr03_failedPatchRollsBackContentVersionAndLinks() throws Exception {
        String tag = tag();
        String image = file(owner, LoaiTep.ANH, true, false);
        String pending = file(owner, LoaiTep.ANH, false, false);
        JsonNode card = readCard(create(Map.of("tu", "apple", "nghiaVi", "táo", "nhanIds", List.of(tag), "anhId", image)));
        send(owner, patch(cardPath(card)), Map.of("version", 0, "nghiaVi", "must not persist", "nhanIds", List.of(), "anhId", pending))
                .andExpect(status().is(422));
        assertThat(readCard(card)).isEqualTo(card);
        send(owner, patch(cardPath(card)), Map.of("version", 0, "nghiaVi", "must not persist", "nhanIds", List.of("9223372036854775807"), "boAnh", true))
                .andExpect(status().is(422));
        assertThat(readCard(card)).isEqualTo(card);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM the_nhan WHERE the_id=?",
                Long.class, Long.valueOf(id(card)))).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT tep_id FROM the_tep WHERE the_id=? AND vai_tro='ANH'",
                Long.class, Long.valueOf(id(card)))).isEqualTo(Long.valueOf(image));
        UpdateCardRequest request = jsonMapper.readValue(toJson(Map.of("version", 0,
                "nghiaVi", "rolled back after writes", "nhanIds", List.of(), "boAnh", true)), UpdateCardRequest.class);
        assertThatThrownBy(() -> new TransactionTemplate(transactionManager).executeWithoutResult(transaction -> {
            cardService.update(owner.id(), Long.valueOf(id(card)), request);
            throw new IllegalStateException("Rollback after JPA and JDBC writes");
        })).isInstanceOf(IllegalStateException.class)
                .hasMessage("Rollback after JPA and JDBC writes");
        assertThat(readCard(card)).isEqualTo(card);
    }

    @Test
    void fr03_softDeletePreservesLinksAvatarAndStoredObjects() throws Exception {
        byte[] png = FileFixtures.image("png");
        byte[] wav = FileFixtures.wav(1);
        String image = upload(png, "ANH", "image/png");
        String audio = upload(wav, "AM_THANH", "audio/vnd.wave");
        fileService.setAvatar(owner.id(), Long.valueOf(image));
        String tag = tag();
        JsonNode card = create(Map.of("tu", "apple", "nghiaVi", "táo", "nhanIds", List.of(tag),
                "anhId", image, "amTuId", audio, "amCauId", audio));
        remove(card, 0).andExpect(status().isNoContent()).andExpect(content().string(""));
        assertThat(jdbc.queryForObject("SELECT xoa_at FROM the_tu_vung WHERE id=?",
                Timestamp.class, Long.valueOf(id(card)))).isNotNull();
        assertThat(jdbc.queryForObject("SELECT version FROM the_tu_vung WHERE id=?",
                Long.class, Long.valueOf(id(card)))).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM the_nhan WHERE the_id=?",
                Long.class, Long.valueOf(id(card)))).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM the_tep WHERE the_id=?",
                Long.class, Long.valueOf(id(card)))).isEqualTo(3);
        mockMvc.perform(get(cardsPath()).cookie(owner.session())).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
        remove(card, 1).andExpect(status().isNotFound());
        send(owner, patch(cardPath(card)), Map.of("version", 1, "nghiaVi", "không sửa"))
                .andExpect(status().isNotFound());
        for (String fileId : List.of(image, audio)) {
            mockMvc.perform(delete("/api/v1/files/" + fileId).cookie(owner.session()).with(xsrf()))
                    .andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("CONFLICT"));
            TepTin retained = files.findById(Long.valueOf(fileId)).orElseThrow();
            assertThat(retained.getXoaAt()).isNull();
            assertThat(retained.getDaXoaObjectAt()).isNull();
            assertThat(storage.readBounded(retained.getObjectKey(), 100000))
                    .isEqualTo(fileId.equals(image) ? png : wav);
        }
        assertThat(fileService.avatar(owner.id()).id()).isEqualTo(image);
        assertThat(jdbc.queryForObject("SELECT version FROM bo_the WHERE id=?",
                Long.class, Long.valueOf(deckId))).isZero();
    }

    @Test
    void fr03_concurrentSameVersionPatchesHaveOneWinner() throws Exception {
        JsonNode card = create(fullCard());
        CyclicBarrier start = new CyclicBarrier(2);
        var executor = Executors.newFixedThreadPool(2);
        try {
            var first = executor.submit(() -> concurrentPatch(card, "first writer", start));
            var second = executor.submit(() -> concurrentPatch(card, "second writer", start));
            List<MvcResult> results = List.of(first.get(20, TimeUnit.SECONDS), second.get(20, TimeUnit.SECONDS));
            assertThat(results.stream().map(r -> r.getResponse().getStatus()).toList())
                    .containsExactlyInAnyOrder(200, 409);
            MvcResult winner = results.stream().filter(r -> r.getResponse().getStatus() == 200).findFirst().orElseThrow();
            MvcResult loser = results.stream().filter(r -> r.getResponse().getStatus() == 409).findFirst().orElseThrow();
            assertThat(body(loser).get("code").asText()).isEqualTo("VERSION_CONFLICT");
            JsonNode finalCard = readCard(card);
            assertThat(finalCard.get("version").asLong()).isEqualTo(1);
            assertThat(finalCard.get("nghiaVi")).isEqualTo(body(winner).get("nghiaVi"));
        } finally {
            executor.shutdownNow();
        }
    }

    @Test
    void fr03_invalidFieldsAndVersionsDoNotChangeCard() throws Exception {
        JsonNode card = readCard(create(fullCard()));
        for (Map<String, Object> fields : List.of(
                Map.<String, Object>of("tu", "\u00a0\u202f"), Map.<String, Object>of("nghiaVi", ""),
                Map.<String, Object>of("tu", "x".repeat(101)), Map.<String, Object>of("tuLoai", "x".repeat(31)),
                Map.<String, Object>of("nghiaVi", "x".repeat(501)), Map.<String, Object>of("phienAm", "x".repeat(101)),
                Map.<String, Object>of("viDuEn", "x".repeat(301)), Map.<String, Object>of("dichVi", "x".repeat(301)),
                Map.<String, Object>of("nguon", "x".repeat(501)), Map.<String, Object>of("doKho", 0),
                Map.<String, Object>of("doKho", 6), Map.<String, Object>of("nhanIds", List.of("0")),
                Map.<String, Object>of("nhanIds", java.util.Collections.singletonList(null)),
                Map.<String, Object>of("nhanIds", java.util.Collections.nCopies(101, "1")),
                Map.<String, Object>of("anhId", "9223372036854775808"))) {
            Map<String, Object> createRequest = new LinkedHashMap<>(fullCard());
            createRequest.putAll(fields);
            send(owner, post(cardsPath()), createRequest).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
            Map<String, Object> updateRequest = new LinkedHashMap<>(fields);
            updateRequest.put("version", 0);
            send(owner, patch(cardPath(card)), updateRequest).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }
        for (Map<String, Object> request : List.of(Map.<String, Object>of(), Map.<String, Object>of("version", -1),
                Map.<String, Object>of("version", 0, "anhId", "1", "boAnh", true),
                Map.<String, Object>of("version", 0, "amTuId", "1", "boAmTu", true),
                Map.<String, Object>of("version", 0, "amCauId", "1", "boAmCau", true))) {
            send(owner, patch(cardPath(card)), request).andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }
        mockMvc.perform(delete(cardPath(card)).cookie(owner.session()).with(xsrf()))
                .andExpect(status().isBadRequest());
        remove(card, -1).andExpect(status().isBadRequest());
        assertThat(readCard(card)).isEqualTo(card);
        mockMvc.perform(get(cardsPath()).cookie(owner.session())).andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1));
    }

    private MvcResult concurrentPatch(JsonNode card, String meaning, CyclicBarrier start) throws Exception {
        start.await(10, TimeUnit.SECONDS);
        return send(owner, patch(cardPath(card)), Map.of("version", 0, "nghiaVi", meaning)).andReturn();
    }

    private Map<String, Object> fullCard() {
        return Map.of("tu", "\u00a0Apple\u202f", "tuLoai", " Noun ", "nghiaVi", "\u2007quả táo\u00a0",
                "phienAm", "/ˈæpəl/", "viDuEn", "I eat an apple.", "dichVi", "Tôi ăn một quả táo.",
                "doKho", 2, "nguon", "Card integration test");
    }

    private JsonNode create(Object request) throws Exception {
        return body(send(owner, post(cardsPath()), request).andExpect(status().isCreated()).andReturn());
    }

    private JsonNode update(JsonNode card, Map<String, Object> fields) throws Exception {
        Map<String, Object> request = new LinkedHashMap<>(fields);
        request.put("version", card.get("version").asLong());
        return body(send(owner, patch(cardPath(card)), request).andExpect(status().isOk()).andReturn());
    }

    private ResultActions remove(JsonNode card, long version) throws Exception {
        return mockMvc.perform(delete(cardPath(card)).param("version", Long.toString(version))
                .cookie(owner.session()).with(xsrf()));
    }

    private JsonNode readCard(JsonNode card) throws Exception {
        JsonNode page = body(mockMvc.perform(get(cardsPath()).cookie(owner.session()))
                .andExpect(status().isOk()).andReturn());
        for (JsonNode item : page.get("items")) {
            if (id(item).equals(id(card))) {
                return item;
            }
        }
        throw new AssertionError("Card not found in its active parent");
    }

    private String cardsPath() {
        return "/api/v1/decks/" + deckId + "/cards";
    }

    private String cardPath(JsonNode card) {
        return "/api/v1/cards/" + id(card);
    }

    private String id(JsonNode card) {
        return card.get("id").asText();
    }

    private JsonNode body(MvcResult result) throws Exception {
        return jsonMapper.readTree(result.getResponse().getContentAsString());
    }

    private ResultActions send(Actor actor, MockHttpServletRequestBuilder request, Object body) throws Exception {
        return mockMvc.perform(request.cookie(actor.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private String createDeck(Actor actor, String visibility) throws Exception {
        return id(body(send(actor, post("/api/v1/decks"), Map.of("ten", "Card test " + UUID.randomUUID(),
                "trinhDo", "CO_BAN", "quyenTruyCap", visibility)).andExpect(status().isCreated()).andReturn()));
    }

    private String tag() {
        String name = "Card tag " + UUID.randomUUID();
        jdbc.update("INSERT INTO nhan(ten) VALUES (?)", name);
        return jdbc.queryForObject("SELECT id FROM nhan WHERE ten=?", Long.class, name).toString();
    }

    private String file(Actor actor, LoaiTep kind, boolean completed, boolean deleted) {
        TepTin file = TepTin.pending(actor.id(), "card-test/" + UUID.randomUUID(),
                kind == LoaiTep.ANH ? "image/png" : "audio/vnd.wave", 100, "0".repeat(64), kind);
        if (completed) {
            file.complete(file.getObjectKey(), file.getMimeType(), file.getKichThuoc(), file.getChecksum(), clock.instant());
        }
        if (deleted) {
            file.markDeleted(clock.instant());
        }
        return files.saveAndFlush(file).getId().toString();
    }

    private String upload(byte[] bytes, String kind, String mime) throws Exception {
        String checksum = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        MvcResult result = send(owner, post("/api/v1/files/upload-requests"),
                Map.of("loai", kind, "mimeType", mime, "kichThuoc", bytes.length, "checksum", checksum))
                .andExpect(status().isCreated()).andReturn();
        UploadRequestResponse intent = jsonMapper.readValue(result.getResponse().getContentAsString(), UploadRequestResponse.class);
        try (HttpClient http = HttpClient.newHttpClient()) {
            HttpResponse<Void> response = http.send(HttpRequest.newBuilder(URI.create(intent.uploadUrl()))
                    .header("Content-Type", mime).PUT(HttpRequest.BodyPublishers.ofByteArray(bytes)).build(),
                    HttpResponse.BodyHandlers.discarding());
            assertThat(response.statusCode()).isEqualTo(200);
        }
        mockMvc.perform(post("/api/v1/files/" + intent.fileId() + "/complete")
                        .cookie(owner.session()).with(xsrf()))
                .andExpect(status().isOk());
        return intent.fileId();
    }

    private Actor login(String role) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Card tester", passwords.encode(PASSWORD),
                "Asia/Ho_Chi_Minh", roles.findByMa(role).orElseThrow());
        user.verifyEmail(clock.instant());
        Long userId = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return new Actor(userId, session);
    }

    private record Actor(Long id, Cookie session) {
    }
}
