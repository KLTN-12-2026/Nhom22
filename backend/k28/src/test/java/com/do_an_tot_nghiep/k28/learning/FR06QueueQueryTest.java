package com.do_an_tot_nghiep.k28.learning;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.learning.entity.TienDoThe;
import com.do_an_tot_nghiep.k28.learning.entity.enums.ChieuHoc;
import com.do_an_tot_nghiep.k28.learning.entity.enums.TrangThaiTienDo;
import com.do_an_tot_nghiep.k28.learning.repository.TienDoTheRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

class FR06QueueQueryTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final Instant NOW = Instant.parse("2026-10-20T00:00:00Z");

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
    TienDoTheRepository progress;

    @Test
    void dueQueue_ordersByDueAtAndFiltersDirectionStatusAndDeletedCards() throws Exception {
        Learner learner = learner();
        long late = card(learner, learner.deckId());
        long early = card(learner, learner.deckId());
        long future = card(learner, learner.deckId());
        long wrongDirection = card(learner, learner.deckId());
        long fresh = card(learner, learner.deckId());
        long deleted = card(learner, learner.deckId());
        addProgress(learner, late, "EN_VI", "ON_TAP", "2026-10-19T10:00:00Z");
        addProgress(learner, early, "EN_VI", "DANG_HOC", "2026-10-18T10:00:00Z");
        addProgress(learner, future, "EN_VI", "ON_TAP", "2026-10-21T10:00:00Z");
        addProgress(learner, wrongDirection, "VI_EN", "ON_TAP", "2026-10-17T10:00:00Z");
        addProgress(learner, fresh, "EN_VI", "MOI", null);
        addProgress(learner, deleted, "EN_VI", "ON_TAP", "2026-10-16T10:00:00Z");
        jdbc.update("UPDATE the_tu_vung SET xoa_at = ? WHERE id = ?", LocalDateTime.of(2026, 10, 1, 0, 0), deleted);

        List<TienDoThe> queue = progress.dueQueue(learner.id(), ChieuHoc.EN_VI,
                EnumSet.of(TrangThaiTienDo.DANG_HOC, TrangThaiTienDo.ON_TAP, TrangThaiTienDo.HOC_LAI),
                NOW, null, PageRequest.of(0, 10));

        assertThat(queue).extracting(TienDoThe::getTheId).containsExactly(early, late);
    }

    @Test
    void dueQueue_scopesToDeckAndOwner() throws Exception {
        Learner learner = learner();
        Learner other = learner();
        String secondDeck = createDeck(learner.session());
        long inFirst = card(learner, learner.deckId());
        long inSecond = card(learner, secondDeck);
        long foreign = card(other, other.deckId());
        addProgress(learner, inFirst, "EN_VI", "ON_TAP", "2026-10-19T10:00:00Z");
        addProgress(learner, inSecond, "EN_VI", "ON_TAP", "2026-10-19T11:00:00Z");
        addProgress(other, foreign, "EN_VI", "ON_TAP", "2026-10-19T09:00:00Z");
        EnumSet<TrangThaiTienDo> active = EnumSet.of(TrangThaiTienDo.ON_TAP);

        List<TienDoThe> all = progress.dueQueue(learner.id(), ChieuHoc.EN_VI, active, NOW, null, PageRequest.of(0, 10));
        List<TienDoThe> onlySecond = progress.dueQueue(learner.id(), ChieuHoc.EN_VI, active, NOW,
                Long.parseLong(secondDeck), PageRequest.of(0, 10));
        List<TienDoThe> limited = progress.dueQueue(learner.id(), ChieuHoc.EN_VI, active, NOW, null, PageRequest.of(0, 1));

        assertThat(all).extracting(TienDoThe::getTheId).containsExactly(inFirst, inSecond);
        assertThat(onlySecond).extracting(TienDoThe::getTheId).containsExactly(inSecond);
        assertThat(limited).extracting(TienDoThe::getTheId).containsExactly(inFirst);
    }

    @Test
    void physicallyNewCardIds_excludesCardsWithAnyStartedDirectionAndDeleted() throws Exception {
        Learner learner = learner();
        long untouched = card(learner, learner.deckId());
        long startedEnVi = card(learner, learner.deckId());
        long startedViEn = card(learner, learner.deckId());
        long placeholder = card(learner, learner.deckId());
        long deleted = card(learner, learner.deckId());
        addProgress(learner, startedEnVi, "EN_VI", "DANG_HOC", "2026-10-19T10:00:00Z");
        addProgress(learner, startedViEn, "VI_EN", "ON_TAP", "2026-10-19T10:00:00Z");
        addProgress(learner, placeholder, "EN_VI", "MOI", null);
        jdbc.update("UPDATE the_tu_vung SET xoa_at = ? WHERE id = ?", LocalDateTime.of(2026, 10, 1, 0, 0), deleted);

        List<Long> ids = progress.physicallyNewCardIds(learner.id(), null, TrangThaiTienDo.MOI, PageRequest.of(0, 10));
        List<Long> limited = progress.physicallyNewCardIds(learner.id(), Long.parseLong(learner.deckId()),
                TrangThaiTienDo.MOI, PageRequest.of(0, 1));

        assertThat(ids).containsExactly(untouched, placeholder);
        assertThat(limited).containsExactly(untouched);
    }

    @Test
    void otherDirectionCardIds_returnsCardsStartedOnlyInTheOppositeDirection() throws Exception {
        Learner learner = learner();
        long onlyEnVi = card(learner, learner.deckId());
        long both = card(learner, learner.deckId());
        long untouched = card(learner, learner.deckId());
        long onlyViEn = card(learner, learner.deckId());
        addProgress(learner, onlyEnVi, "EN_VI", "ON_TAP", "2026-10-19T10:00:00Z");
        addProgress(learner, both, "EN_VI", "ON_TAP", "2026-10-19T10:00:00Z");
        addProgress(learner, both, "VI_EN", "DANG_HOC", "2026-10-19T10:00:00Z");
        addProgress(learner, onlyViEn, "VI_EN", "ON_TAP", "2026-10-19T10:00:00Z");

        List<Long> forViEn = progress.otherDirectionCardIds(learner.id(), ChieuHoc.VI_EN, null,
                TrangThaiTienDo.MOI, PageRequest.of(0, 10));
        List<Long> forEnVi = progress.otherDirectionCardIds(learner.id(), ChieuHoc.EN_VI, null,
                TrangThaiTienDo.MOI, PageRequest.of(0, 10));

        assertThat(forViEn).containsExactly(onlyEnVi);
        assertThat(forEnVi).containsExactly(onlyViEn);
        assertThat(forViEn).doesNotContain(both, untouched);
    }

    private Learner learner() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Queue tester", passwords.encode(PASSWORD),
                "Asia/Ho_Chi_Minh", roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long userId = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return new Learner(userId, session, createDeck(session));
    }

    private String createDeck(Cookie session) throws Exception {
        MvcResult result = send(session, "/api/v1/decks", Map.of(
                "ten", "Queue deck " + UUID.randomUUID(),
                "trinhDo", "CO_BAN",
                "quyenTruyCap", "RIENG_TU")).andExpect(status().isCreated()).andReturn();
        return idOf(result);
    }

    private long card(Learner learner, String deckId) throws Exception {
        MvcResult result = send(learner.session(), "/api/v1/decks/" + deckId + "/cards", Map.of(
                "tu", "word-" + UUID.randomUUID(),
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

    private void addProgress(Learner learner, long cardId, String direction, String status, String dueAt) {
        LocalDateTime due = dueAt == null ? null : LocalDateTime.ofInstant(Instant.parse(dueAt), ZoneOffset.UTC);
        jdbc.update("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai, han_on_at) "
                + "VALUES (?, ?, ?, ?, ?)", learner.id(), cardId, direction, status, due);
    }

    private record Learner(Long id, Cookie session, String deckId) {
    }
}
