package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.common.storage.StorageService;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.ChuDe;
import com.do_an_tot_nghiep.k28.content.entity.Nhan;
import com.do_an_tot_nghiep.k28.content.entity.TepTin;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.entity.enums.LoaiTep;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.entity.enums.VaiTroTep;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.CardLinkRepository;
import com.do_an_tot_nghiep.k28.content.repository.ChuDeRepository;
import com.do_an_tot_nghiep.k28.content.repository.NhanRepository;
import com.do_an_tot_nghiep.k28.content.repository.TepTinRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import tools.jackson.databind.JsonNode;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Clock;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@TestPropertySource(properties = "app.files.cleanup.enabled=false")
class FR04LibraryTest extends AbstractIntegrationTest {

    private static final String PATH = "/api/v1/library/decks";

    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired BoTheRepository decks;
    @Autowired TheTuVungRepository cards;
    @Autowired ChuDeRepository topics;
    @Autowired NhanRepository tags;
    @Autowired TepTinRepository files;
    @Autowired CardLinkRepository links;
    @Autowired StorageService storage;
    @Autowired JdbcTemplate jdbc;
    @Autowired Clock clock;

    private Long ownerId;
    private String prefix;

    @BeforeEach
    void fixtures() {
        prefix = "Library-" + UUID.randomUUID();
        NguoiDung owner = NguoiDung.register(
                UUID.randomUUID() + "@test.local", "Library author",
                passwords.encode("matkhau123"), "Asia/Ho_Chi_Minh",
                roles.findByMa("USER").orElseThrow()
        );
        owner.verifyEmail(clock.instant());
        ownerId = users.saveAndFlush(owner).getId();
    }

    @Test
    void tc03_sortSizeCountsOnlyActiveCardsBeforePaging() throws Exception {
        Long a = deck(" A");
        Long b = deck(" B");
        Long c = deck(" C");
        card(a, "one");
        Long deleted = card(a, "deleted");
        jdbc.update("UPDATE the_tu_vung SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", deleted);
        for (Long id : List.of(b, c)) {
            card(id, "one");
            card(id, "two");
            card(id, "three");
        }

        mockMvc.perform(get(PATH).param("q", prefix).param("sort", "size").param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(3))
                .andExpect(jsonPath("$.items[0].id").value(c.toString()))
                .andExpect(jsonPath("$.items[0].soThe").value(3));
        mockMvc.perform(get(PATH).param("q", prefix).param("sort", "size")
                        .param("page", "1").param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(b.toString()));
        mockMvc.perform(get(PATH).param("q", prefix).param("sort", "size")
                        .param("page", "2").param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(a.toString()))
                .andExpect(jsonPath("$.items[0].soThe").value(1));
    }

    @Test
    void tc03_nameUpdatedAndBeyondLastPageAreDeterministic() throws Exception {
        Long a = deck(" A");
        Long b = deck(" B");
        Long c = deck(" C");
        for (Long id : List.of(a, b, c)) {
            jdbc.update("UPDATE bo_the SET updated_at = '2026-10-08 00:00:00.000' WHERE id = ?", id);
        }
        mockMvc.perform(get(PATH).param("q", prefix).param("sort", "name")
                        .param("page", "1").param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(b.toString()));
        mockMvc.perform(get(PATH).param("q", prefix).param("sort", "updated"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(c.toString()))
                .andExpect(jsonPath("$.items[2].id").value(a.toString()));
        mockMvc.perform(get(PATH).param("q", prefix).param("page", "99").param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty())
                .andExpect(jsonPath("$.page").value(99))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(3));
    }

    @Test
    void tc03_searchEscapesWildcardsNormalizesNfcAndSearchesDescription() throws Exception {
        Long literal = deck(" _%! café");
        deck(" XZZ cafe");
        mockMvc.perform(get(PATH).param("q", prefix + " _%! cafe\u0301"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].id").value(literal.toString()));
        jdbc.update("UPDATE bo_the SET mo_ta = ? WHERE id = ?", prefix + " description-only", literal);
        mockMvc.perform(get(PATH).param("q", prefix + " description-only"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(literal.toString()));
        card(literal, prefix + " card-only");
        mockMvc.perform(get(PATH).param("q", prefix + " card-only"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void tc03_topicFilterAndAuthorMetadata() throws Exception {
        Long topicId = topics.saveAndFlush(ChuDe.create(prefix, null)).getId();
        Long matching = deck(" matching");
        deck(" no-topic");
        jdbc.update("UPDATE bo_the SET chu_de_id = ? WHERE id = ?", topicId, matching);
        mockMvc.perform(get(PATH).param("q", prefix).param("chuDeId", topicId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].id").value(matching.toString()))
                .andExpect(jsonPath("$.items[0].tenChuDe").value(prefix))
                .andExpect(jsonPath("$.items[0].tenTacGia").value("Library author"));
    }

    @Test
    void tc03_detailPagesActiveCardsAndBatchLinks() throws Exception {
        Long deckId = deck(" detail");
        Long first = card(deckId, "first");
        Long second = card(deckId, "second");
        Long deleted = card(deckId, "deleted");
        jdbc.update("UPDATE the_tu_vung SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", deleted);
        Long tagId = tags.saveAndFlush(Nhan.create(UUID.randomUUID().toString())).getId();
        links.replaceTags(second, List.of(tagId), clock.instant());
        TepTin image = completedFile(LoaiTep.ANH, FileFixtures.image("png"));
        links.replaceFiles(second, List.of(
                new CardLinkRepository.FileSelection(image.getId(), VaiTroTep.ANH)
        ), clock.instant());

        mockMvc.perform(get(PATH + "/" + deckId).param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.boThe.soThe").value(2))
                .andExpect(jsonPath("$.the.totalElements").value(2))
                .andExpect(jsonPath("$.the.totalPages").value(2))
                .andExpect(jsonPath("$.the.items[0].id").value(second.toString()))
                .andExpect(jsonPath("$.the.items[0].nhanIds[0]").value(tagId.toString()))
                .andExpect(jsonPath("$.the.items[0].anhId").value(image.getId().toString()))
                .andExpect(jsonPath("$.the.items[0].version").doesNotExist())
                .andExpect(jsonPath("$.the.items[0].trung").doesNotExist());
        mockMvc.perform(get(PATH + "/" + deckId).param("page", "1").param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.the.items[0].id").value(first.toString()))
                .andExpect(jsonPath("$.the.items[0].nhanIds").isEmpty());
    }

    @ParameterizedTest
    @ValueSource(strings = {"private", "hidden", "deleted"})
    void tc03_unavailableDeckExcludedFromListDetailAndMedia(String state) throws Exception {
        Long deckId = deck(" unavailable");
        Long cardId = card(deckId, "word");
        switch (state) {
            case "private" -> jdbc.update("UPDATE bo_the SET quyen_truy_cap = 'RIENG_TU' WHERE id = ?", deckId);
            case "hidden" -> jdbc.update("UPDATE bo_the SET trang_thai_kiem_duyet = 'DA_AN' WHERE id = ?", deckId);
            default -> jdbc.update("UPDATE bo_the SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", deckId);
        }
        mockMvc.perform(get(PATH).param("q", prefix))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
        mockMvc.perform(get(PATH + "/" + deckId))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("NOT_FOUND"));
        mockMvc.perform(get(mediaPath(deckId, cardId, VaiTroTep.ANH)))
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @EnumSource(VaiTroTep.class)
    void tc03_guestDownloadsLinkedMediaAndCannotReadGenericFile(VaiTroTep role) throws Exception {
        Long deckId = deck(" media");
        Long cardId = card(deckId, "word");
        byte[] content = role == VaiTroTep.ANH ? FileFixtures.image("png") : FileFixtures.wav(1);
        TepTin file = completedFile(role == VaiTroTep.ANH ? LoaiTep.ANH : LoaiTep.AM_THANH, content);
        links.replaceFiles(cardId, List.of(
                new CardLinkRepository.FileSelection(file.getId(), role)
        ), clock.instant());
        JsonNode response = jsonMapper.readTree(mockMvc.perform(get(mediaPath(deckId, cardId, role)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(file.getId().toString()))
                .andExpect(jsonPath("$.expiresAt").exists())
                .andReturn().getResponse().getContentAsString());
        HttpResponse<byte[]> download = HttpClient.newHttpClient().send(
                HttpRequest.newBuilder(URI.create(response.get("downloadUrl").asText())).GET().build(),
                HttpResponse.BodyHandlers.ofByteArray()
        );
        assertThat(download.statusCode()).isEqualTo(200);
        assertThat(download.body()).isEqualTo(content);
        mockMvc.perform(get("/api/v1/files/" + file.getId())).andExpect(status().isUnauthorized());
        Long foreignDeck = deck(" other");
        mockMvc.perform(get(mediaPath(foreignDeck, cardId, role))).andExpect(status().isNotFound());
        jdbc.update("UPDATE the_tu_vung SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", cardId);
        mockMvc.perform(get(mediaPath(deckId, cardId, role))).andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @ValueSource(strings = {"size=101", "page=-1", "sort=invalid", "nguon=invalid", "mucTieu=invalid",
            "trinhDo=invalid", "chuDeId=9223372036854775808", "page=2147483647"})
    void tc03_invalidListQueryReturnsValidationFailed(String query) throws Exception {
        String[] pair = query.split("=", 2);
        mockMvc.perform(get(PATH).param(pair[0], pair[1]))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    private Long deck(String suffix) {
        BoThe deck = BoThe.create(ownerId, null, prefix + suffix, null,
                TrinhDo.CO_BAN, QuyenTruyCap.CONG_KHAI);
        deck.updateGoal(MucTieu.TOEIC);
        return decks.saveAndFlush(deck).getId();
    }

    private Long card(Long deckId, String word) {
        return cards.saveAndFlush(TheTuVung.create(
                deckId, word, "noun", "nghĩa", null, null, null, 1, null
        )).getId();
    }

    private TepTin completedFile(LoaiTep type, byte[] content) {
        String mime = type == LoaiTep.ANH ? "image/png" : "audio/vnd.wave";
        String key = storage.newObjectKey("library-test");
        storage.putVerified(key, content, mime);
        TepTin file = TepTin.pending(ownerId, key, mime, content.length, "0".repeat(64), type);
        file.complete(key, mime, content.length, "0".repeat(64), clock.instant());
        return files.saveAndFlush(file);
    }

    private String mediaPath(Long deckId, Long cardId, VaiTroTep role) {
        return PATH + "/" + deckId + "/cards/" + cardId + "/files/" + role;
    }
}
