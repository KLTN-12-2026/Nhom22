package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;

import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.sql.Timestamp;

import org.springframework.jdbc.core.JdbcTemplate;

import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

class FR03DeckTest extends AbstractIntegrationTest {

    private static final String PATH = "/api/v1/decks";
    private static final String PASSWORD = "matkhau123";

    @Autowired
    NguoiDungRepository users;
    @Autowired
    VaiTroRepository roles;
    @Autowired
    PasswordEncoder passwords;
    @Autowired
    Clock clock;

    private Actor owner;
    private Actor other;
    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    BoTheRepository decks;

    @Autowired
    PlatformTransactionManager transactionManager;

    @BeforeEach
    void loginUsers() throws Exception {
        owner = loginUser();
        other = loginUser();
    }

    @Test
    void fr03_createAndPartialUpdate() throws Exception {
        JsonNode deck = createDeck();
        String path = PATH + "/" + deck.get("id").asText();
        long version = deck.get("version").asLong();

        assertThat(deck.get("id").isString()).isTrue();
        assertThat(deck.get("chuSoHuuId").asText())
                .isEqualTo(owner.id().toString());
        assertThat(deck.get("quyenTruyCap").asText()).isEqualTo("RIENG_TU");
        assertThat(deck.get("createdAt").asText()).isNotBlank();
        assertThat(deck.get("updatedAt").asText()).isNotBlank();

        mockMvc.perform(get(PATH).cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].id")
                        .value(deck.get("id").asText()));

        mockMvc.perform(get(PATH).cookie(other.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));

        send(owner, patch(path), Map.of(
                "ten", "  Updated deck  ", "version", version
        ))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten").value("Updated deck"))
                .andExpect(jsonPath("$.moTa").value("Original description"))
                .andExpect(jsonPath("$.trinhDo").value("CO_BAN"))
                .andExpect(jsonPath("$.quyenTruyCap").value("RIENG_TU"))
                .andExpect(jsonPath("$.version").value((int) version + 1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"RIENG_TU", "CONG_KHAI"})
    void tc02_foreignManagementReturns404(String access) throws Exception {
        JsonNode deck = createDeck();
        String path = PATH + "/" + deck.get("id").asText();
        long version = deck.get("version").asLong();

        if (access.equals("CONG_KHAI")) {
            send(owner, patch(path), Map.of(
                    "quyenTruyCap", access, "version", version
            )).andExpect(status().isOk());
        }

        mockMvc.perform(get(path).cookie(other.session()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));

        send(other, patch(path), Map.of(
                "ten", "Unauthorized change", "version", version
        ))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));

        mockMvc.perform(delete(path).param("version", Long.toString(version))
                        .cookie(other.session()).with(xsrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));

        mockMvc.perform(get(path).cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten").value("Original deck"))
                .andExpect(jsonPath("$.quyenTruyCap").value(access));
    }

    @Test
    void fr03_staleVersionCannotUpdateOrDelete() throws Exception {
        JsonNode deck = createDeck();
        String path = PATH + "/" + deck.get("id").asText();
        long version = deck.get("version").asLong();

        send(owner, patch(path), Map.of(
                "ten", "Committed name", "version", version
        )).andExpect(status().isOk());

        send(owner, patch(path), Map.of(
                "ten", "Stale name", "version", version
        ))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VERSION_CONFLICT"));

        mockMvc.perform(delete(path).param("version", Long.toString(version))
                        .cookie(owner.session()).with(xsrf()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VERSION_CONFLICT"));

        mockMvc.perform(get(path).cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten").value("Committed name"))
                .andExpect(jsonPath("$.version").value((int) version + 1));
    }

    @Test
    void fr03_invalidPatchReturns400() throws Exception {
        JsonNode deck = createDeck();
        String path = PATH + "/" + deck.get("id").asText();
        long version = deck.get("version").asLong();

        for (Object body : List.of(
                Map.of("ten", "Missing version"),
                Map.of("version", -1),
                Map.of("ten", "   ", "version", version)
        )) {
            send(owner, patch(path), body)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.fieldErrors").isNotEmpty());
        }

        mockMvc.perform(get(path).cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten").value("Original deck"))
                .andExpect(jsonPath("$.version").value((int) version));
    }

    @Test
    void fr03_favoriteIsIdempotentAndBelongsToCurrentUser() throws Exception {
        JsonNode deck = createDeck();
        String id = deck.get("id").asText();
        String path = PATH + "/" + id;
        long version = deck.get("version").asLong();

        for (int attempt = 0; attempt < 2; attempt++) {
            mockMvc.perform(put(path + "/favorite")
                            .cookie(owner.session()).with(xsrf()))
                    .andExpect(status().isNoContent());
        }

        assertThat(favoriteCount(owner, id)).isEqualTo(1L);

        mockMvc.perform(get(path).cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.yeuThich").value(true))
                .andExpect(jsonPath("$.version").value((int) version));

        mockMvc.perform(get(PATH).cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].yeuThich").value(true));

        mockMvc.perform(delete(path + "/favorite")
                        .cookie(other.session()).with(xsrf()))
                .andExpect(status().isNoContent());

        assertThat(favoriteCount(owner, id)).isEqualTo(1L);

        for (int attempt = 0; attempt < 2; attempt++) {
            mockMvc.perform(delete(path + "/favorite")
                            .cookie(owner.session()).with(xsrf()))
                    .andExpect(status().isNoContent());
        }

        assertThat(favoriteCount(owner, id)).isZero();

        mockMvc.perform(get(path).cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.yeuThich").value(false))
                .andExpect(jsonPath("$.version").value((int) version));
    }

    @Test
    void tc02_foreignFavoriteRespectsVisibilityChanges() throws Exception {
        JsonNode deck = createDeck();
        String id = deck.get("id").asText();
        String path = PATH + "/" + id;

        mockMvc.perform(put(path + "/favorite")
                        .cookie(other.session()).with(xsrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));

        assertThat(favoriteCount(other, id)).isZero();

        var published = send(owner, patch(path), Map.of(
                "quyenTruyCap", "CONG_KHAI",
                "version", deck.get("version").asLong()
        )).andExpect(status().isOk()).andReturn();

        long publicVersion = jsonMapper.readTree(
                published.getResponse().getContentAsString()
        ).get("version").asLong();

        for (int attempt = 0; attempt < 2; attempt++) {
            mockMvc.perform(put(path + "/favorite")
                            .cookie(other.session()).with(xsrf()))
                    .andExpect(status().isNoContent());
        }

        assertThat(favoriteCount(other, id)).isEqualTo(1L);
        assertThat(favoriteCount(owner, id)).isZero();

        send(owner, patch(path), Map.of(
                "quyenTruyCap", "RIENG_TU", "version", publicVersion
        )).andExpect(status().isOk());

        mockMvc.perform(put(path + "/favorite")
                        .cookie(other.session()).with(xsrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));

        mockMvc.perform(delete(path + "/favorite")
                        .cookie(other.session()).with(xsrf()))
                .andExpect(status().isNoContent());

        assertThat(favoriteCount(other, id)).isZero();
    }

    @Test
    void fr03_softDeletePreservesCardsFavoritesAndSourceReferences()
            throws Exception {
        JsonNode source = createDeck();
        JsonNode copied = createDeck();
        String sourceId = source.get("id").asText();
        String copiedId = copied.get("id").asText();
        String path = PATH + "/" + sourceId;
        long version = source.get("version").asLong();

        jdbc.update("""
                INSERT INTO the_tu_vung (bo_the_id, tu, nghia_vi)
                VALUES (?, ?, ?)
                """, Long.valueOf(sourceId), "office", "văn phòng");

        jdbc.update("""
                UPDATE bo_the SET bo_nguon_id = ? WHERE id = ?
                """, Long.valueOf(sourceId), Long.valueOf(copiedId));

        mockMvc.perform(put(path + "/favorite")
                        .cookie(owner.session()).with(xsrf()))
                .andExpect(status().isNoContent());

        mockMvc.perform(delete(path).param("version", Long.toString(version))
                        .cookie(owner.session()).with(xsrf()))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        mockMvc.perform(get(path).cookie(owner.session()))
                .andExpect(status().isNotFound());

        mockMvc.perform(get(PATH).cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].id").value(copiedId));

        mockMvc.perform(put(path + "/favorite")
                        .cookie(owner.session()).with(xsrf()))
                .andExpect(status().isNotFound());

        assertThat(jdbc.queryForObject("""
                SELECT xoa_at FROM bo_the WHERE id = ?
                """, Timestamp.class, Long.valueOf(sourceId))).isNotNull();

        assertThat(jdbc.queryForObject("""
                SELECT version FROM bo_the WHERE id = ?
                """, Long.class, Long.valueOf(sourceId))).isEqualTo(version + 1);

        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM the_tu_vung
                WHERE bo_the_id = ? AND tu = ? AND nghia_vi = ?
                  AND xoa_at IS NULL AND version = 0
                """, Long.class, Long.valueOf(sourceId), "office", "văn phòng"))
                .isEqualTo(1L);

        assertThat(favoriteCount(owner, sourceId)).isEqualTo(1L);

        mockMvc.perform(get(PATH + "/" + copiedId).cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.boNguonId").value(sourceId));

        mockMvc.perform(delete(path + "/favorite")
                        .cookie(owner.session()).with(xsrf()))
                .andExpect(status().isNoContent());

        assertThat(favoriteCount(owner, sourceId)).isZero();
    }

    @Test
    void tc02_hiddenPublicDeckCannotBeFavoritedByOthers() throws Exception {
        JsonNode deck = createDeck();
        String id = deck.get("id").asText();
        String path = PATH + "/" + id;

        send(owner, patch(path), Map.of(
                "quyenTruyCap", "CONG_KHAI",
                "version", deck.get("version").asLong()
        )).andExpect(status().isOk());

        assertThat(jdbc.update("""
            UPDATE bo_the
            SET trang_thai_kiem_duyet = 'DA_AN', version = version + 1
            WHERE id = ?
            """, Long.valueOf(id))).isEqualTo(1);

        mockMvc.perform(put(path + "/favorite")
                        .cookie(other.session()).with(xsrf()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));

        assertThat(favoriteCount(other, id)).isZero();

        mockMvc.perform(get(path).cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThaiKiemDuyet").value("DA_AN"));

        mockMvc.perform(put(path + "/favorite")
                        .cookie(owner.session()).with(xsrf()))
                .andExpect(status().isNoContent());

        assertThat(favoriteCount(owner, id)).isEqualTo(1L);
    }

    @Test
    void fr03_invalidFieldsAndDeleteVersionDoNotChangeDeck() throws Exception {
        JsonNode deck = createDeck();
        String path = PATH + "/" + deck.get("id").asText();
        long version = deck.get("version").asLong();

        for (Object body : List.of(
                Map.of("ten", "a".repeat(151), "version", version),
                Map.of("moTa", "a".repeat(1001), "version", version),
                Map.of("chuDeId", "0", "version", version),
                Map.of("chuDeId", "9223372036854775808", "version", version),
                Map.of("boChuDe", true, "chuDeId", "1", "version", version)
        )) {
            send(owner, patch(path), body)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath("$.fieldErrors").isNotEmpty());
        }

        mockMvc.perform(delete(path)
                        .cookie(owner.session()).with(xsrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        mockMvc.perform(delete(path).param("version", "-1")
                        .cookie(owner.session()).with(xsrf()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));

        mockMvc.perform(get(path).cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten").value("Original deck"))
                .andExpect(jsonPath("$.moTa").value("Original description"))
                .andExpect(jsonPath("$.version").value((int) version));
    }

    @Test
    void fr03_concurrentTransactionsCannotOverwriteCommittedUpdate()
            throws Exception {
        JsonNode deck = createDeck();
        Long id = Long.valueOf(deck.get("id").asText());
        long version = deck.get("version").asLong();
        CyclicBarrier bothLoaded = new CyclicBarrier(2);
        CountDownLatch firstFinished = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);

        try {
            var first = executor.submit(() -> updateConcurrently(
                    id, "First committed name", true,
                    bothLoaded, firstFinished
            ));
            var second = executor.submit(() -> updateConcurrently(
                    id, "Overwriting name", false,
                    bothLoaded, firstFinished
            ));

            assertThat(first.get(20, TimeUnit.SECONDS)).isTrue();
            assertThat(second.get(20, TimeUnit.SECONDS)).isFalse();
        } finally {
            executor.shutdownNow();
        }

        mockMvc.perform(get(PATH + "/" + id).cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten").value("First committed name"))
                .andExpect(jsonPath("$.version").value((int) version + 1));
    }

    private boolean updateConcurrently(
            Long id,
            String name,
            boolean first,
            CyclicBarrier bothLoaded,
            CountDownLatch firstFinished
    ) {
        try {
            new TransactionTemplate(transactionManager)
                    .executeWithoutResult(status -> {
                        var deck = decks.findById(id).orElseThrow();

                        try {
                            bothLoaded.await(10, TimeUnit.SECONDS);
                            if (!first
                                    && !firstFinished.await(10, TimeUnit.SECONDS)) {
                                throw new IllegalStateException(
                                        "First transaction did not finish"
                                );
                            }
                        } catch (InterruptedException exception) {
                            Thread.currentThread().interrupt();
                            throw new IllegalStateException(exception);
                        } catch (Exception exception) {
                            throw new IllegalStateException(exception);
                        }

                        deck.updateDetails(
                                deck.getChuDeId(),
                                name,
                                deck.getMoTa(),
                                deck.getTrinhDo(),
                                deck.getQuyenTruyCap()
                        );
                        decks.flush();
                    });
            return true;
        } catch (OptimisticLockingFailureException exception) {
            return false;
        } finally {
            if (first) {
                firstFinished.countDown();
            }
        }
    }

    private long favoriteCount(Actor actor, String deckId) {
        return jdbc.queryForObject("""
                SELECT COUNT(*) FROM bo_yeu_thich
                WHERE nguoi_dung_id = ? AND bo_the_id = ?
                """, Long.class, actor.id(), Long.valueOf(deckId));
    }

    private JsonNode createDeck() throws Exception {
        var result = send(owner, post(PATH), Map.of(
                "ten", "  Original deck  ",
                "moTa", "  Original description  ",
                "trinhDo", "CO_BAN"
        ))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.ten").value("Original deck"))
                .andExpect(jsonPath("$.moTa").value("Original description"))
                .andReturn();

        JsonNode deck = jsonMapper.readTree(
                result.getResponse().getContentAsString()
        );
        assertThat(result.getResponse().getHeader("Location"))
                .isEqualTo(PATH + "/" + deck.get("id").asText());
        return deck;
    }

    private ResultActions send(
            Actor actor,
            MockHttpServletRequestBuilder request,
            Object body
    ) throws Exception {
        return mockMvc.perform(request.cookie(actor.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(body)));
    }

    private Actor loginUser() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(
                email, "Deck tester", passwords.encode(PASSWORD),
                "Asia/Ho_Chi_Minh", roles.findByMa("USER").orElseThrow()
        );
        user.verifyEmail(clock.instant());
        Long id = users.saveAndFlush(user).getId();

        Cookie session = mockMvc.perform(post("/api/v1/auth/login")
                        .with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of(
                                "email", email, "password", PASSWORD
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getCookie("SESSION");

        assertThat(session).isNotNull();
        return new Actor(id, session);
    }

    private record Actor(Long id, Cookie session) {
    }
}