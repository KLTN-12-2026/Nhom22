package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.enums.MucTieu;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import tools.jackson.databind.JsonNode;

import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR04LibraryOnboardingTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String SETTINGS = "/api/v1/me/learning-settings";
    private static final String LIBRARY = "/api/v1/library/decks";

    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired BoTheRepository decks;
    @Autowired JdbcTemplate jdbc;
    @Autowired Clock clock;

    @Test
    void tc03_starterTemplatesMatchPersistedGoalAndLevel() throws Exception {
        Cookie learner = loginLearner();
        Long authorId = createUser("Template author").getId();
        String prefix = "Starter-" + UUID.randomUUID();

        Long matching = deck(authorId, prefix + " match", MucTieu.TOEIC,
                TrinhDo.CO_BAN, true, QuyenTruyCap.CONG_KHAI);
        deck(authorId, prefix + " wrong goal", MucTieu.GIAO_TIEP,
                TrinhDo.CO_BAN, true, QuyenTruyCap.CONG_KHAI);
        deck(authorId, prefix + " wrong level", MucTieu.TOEIC,
                TrinhDo.TRUNG_CAP, true, QuyenTruyCap.CONG_KHAI);
        deck(authorId, prefix + " shared", MucTieu.TOEIC,
                TrinhDo.CO_BAN, false, QuyenTruyCap.CONG_KHAI);
        deck(authorId, prefix + " legacy", null,
                TrinhDo.CO_BAN, true, QuyenTruyCap.CONG_KHAI);
        deck(authorId, prefix + " private", MucTieu.TOEIC,
                TrinhDo.CO_BAN, true, QuyenTruyCap.RIENG_TU);
        Long hidden = deck(authorId, prefix + " hidden", MucTieu.TOEIC,
                TrinhDo.CO_BAN, true, QuyenTruyCap.CONG_KHAI);
        jdbc.update("UPDATE bo_the SET trang_thai_kiem_duyet = 'DA_AN' WHERE id = ?", hidden);
        Long deleted = deck(authorId, prefix + " deleted", MucTieu.TOEIC,
                TrinhDo.CO_BAN, true, QuyenTruyCap.CONG_KHAI);
        jdbc.update("UPDATE bo_the SET xoa_at = CURRENT_TIMESTAMP(3) WHERE id = ?", deleted);

        JsonNode saved = saveSettings(learner, "TOEIC", "CO_BAN");
        mockMvc.perform(get(LIBRARY)
                        .param("q", prefix)
                        .param("nguon", "MAU")
                        .param("mucTieu", saved.get("mucTieu").asText())
                        .param("trinhDo", saved.get("trinhDo").asText()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].id").value(matching.toString()))
                .andExpect(jsonPath("$.items[0].nguon").value("MAU"))
                .andExpect(jsonPath("$.items[0].chuSoHuuId").value(authorId.toString()));
    }

    @Test
    void tc03_noMatchingTemplateReturnsEmptyWithoutChangingProfile() throws Exception {
        Cookie learner = loginLearner();
        Long authorId = createUser("Template author").getId();
        String prefix = "Starter-" + UUID.randomUUID();
        deck(authorId, prefix + " other goal", MucTieu.GIAO_TIEP,
                TrinhDo.CO_BAN, true, QuyenTruyCap.CONG_KHAI);
        JsonNode saved = saveSettings(learner, "TOEIC", "CO_BAN");

        mockMvc.perform(get(LIBRARY)
                        .param("q", prefix)
                        .param("nguon", "MAU")
                        .param("mucTieu", saved.get("mucTieu").asText())
                        .param("trinhDo", saved.get("trinhDo").asText()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isEmpty())
                .andExpect(jsonPath("$.totalElements").value(0));

        mockMvc.perform(get(SETTINGS).cookie(learner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.mucTieu").value("TOEIC"))
                .andExpect(jsonPath("$.trinhDo").value("CO_BAN"))
                .andExpect(jsonPath("$.daHoanTatKhoiDau").value(true))
                .andExpect(jsonPath("$.version").value(saved.get("version").asInt()));
    }

    private JsonNode saveSettings(Cookie session, String goal, String level) throws Exception {
        JsonNode current = jsonMapper.readTree(mockMvc.perform(get(SETTINGS).cookie(session))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        mockMvc.perform(put(SETTINGS).cookie(session).with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(Map.of(
                                "mucTieu", goal, "trinhDo", level,
                                "phutMoiNgay", 10, "tuMoiMoiNgay", 10,
                                "chuDeIds", List.of(), "version", current.get("version").asLong()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.daHoanTatKhoiDau").value(true));
        return jsonMapper.readTree(mockMvc.perform(get(SETTINGS).cookie(session))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private Long deck(Long ownerId, String name, MucTieu goal, TrinhDo level,
                      boolean template, QuyenTruyCap access) {
        BoThe deck = BoThe.create(ownerId, null, name, null, level, access);
        deck.updateGoal(goal);
        Long id = decks.saveAndFlush(deck).getId();
        jdbc.update("UPDATE bo_the SET bo_mau = ? WHERE id = ?", template, id);
        return id;
    }

    private Cookie loginLearner() throws Exception {
        NguoiDung user = createUser("Starter learner");
        Cookie session = mockMvc.perform(post("/api/v1/auth/login")
                        .with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(Map.of(
                                "email", user.getEmail(), "password", PASSWORD
                        ))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return session;
    }

    private NguoiDung createUser(String name) {
        NguoiDung user = NguoiDung.register(
                UUID.randomUUID() + "@test.local", name, passwords.encode(PASSWORD),
                "Asia/Ho_Chi_Minh", roles.findByMa("USER").orElseThrow()
        );
        user.verifyEmail(clock.instant());
        return users.saveAndFlush(user);
    }
}
