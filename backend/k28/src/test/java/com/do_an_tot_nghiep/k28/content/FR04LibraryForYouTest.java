package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.account.entity.HoSoHocTap;
import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.account.repository.HoSoHocTapRepository;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.ChuDe;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.ChuDeRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR04LibraryForYouTest extends AbstractIntegrationTest {

    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired HoSoHocTapRepository profiles;
    @Autowired ChuDeRepository topics;
    @Autowired BoTheRepository decks;
    @Autowired TheTuVungRepository cards;
    @Autowired JdbcTemplate jdbc;
    @Autowired Clock clock;

    @Test
    void forYouListsUnlearnedPublicDecksOfChosenTopics() throws Exception {
        Long liked = topics.saveAndFlush(ChuDe.create("ForYou " + UUID.randomUUID(), null)).getId();
        Long other = topics.saveAndFlush(ChuDe.create("ForYou " + UUID.randomUUID(), null)).getId();
        Long author = login().id();
        Actor learner = login();
        HoSoHocTap profile = profiles.findById(learner.id())
                .orElseGet(() -> HoSoHocTap.defaultFor(learner.id()));
        profile.updateLearning(TrinhDo.TRUNG_CAP, null, 10, 10);
        profile.replaceTopics(List.of(liked));
        profiles.saveAndFlush(profile);

        Long sameLevel = deck(author, liked, TrinhDo.TRUNG_CAP, QuyenTruyCap.CONG_KHAI);
        Long otherLevel = deck(author, liked, TrinhDo.CO_BAN, QuyenTruyCap.CONG_KHAI);
        Long otherTopic = deck(author, other, TrinhDo.TRUNG_CAP, QuyenTruyCap.CONG_KHAI);
        Long privateDeck = deck(author, liked, TrinhDo.TRUNG_CAP, QuyenTruyCap.RIENG_TU);
        Long own = deck(learner.id(), liked, TrinhDo.TRUNG_CAP, QuyenTruyCap.CONG_KHAI);
        Long copied = deck(author, liked, TrinhDo.TRUNG_CAP, QuyenTruyCap.CONG_KHAI);
        decks.saveAndFlush(BoThe.createCopy(learner.id(), decks.findById(copied).orElseThrow()));
        Long learned = deck(author, liked, TrinhDo.TRUNG_CAP, QuyenTruyCap.CONG_KHAI);
        Long cardId = cards.saveAndFlush(TheTuVung.create(learned, "apple", "noun", "quả táo", null,
                null, null, 2, null)).getId();
        jdbc.update("INSERT INTO tien_do_the (nguoi_dung_id, the_id, chieu_hoc, trang_thai, han_on_at, "
                + "khoang_on_ngay, chuoi_thanh_cong) VALUES (?, ?, 'EN_VI', 'ON_TAP', CURRENT_TIMESTAMP(3), 1, 0)",
                learner.id(), cardId);

        JsonNode body = forYou(learner, 20);
        assertThat(body.get("daChonChuDe").asBoolean()).isTrue();
        List<String> ids = new ArrayList<>();
        body.get("boThe").forEach(item -> ids.add(item.get("id").asString()));
        assertThat(ids).containsExactly(sameLevel.toString(), otherLevel.toString());
        assertThat(ids).doesNotContain(otherTopic.toString(), privateDeck.toString(), own.toString(),
                copied.toString(), learned.toString());

        assertThat(forYou(learner, 1).get("boThe").size()).isEqualTo(1);
    }

    @Test
    void forYouWithoutTopicsAsksToChooseAndRequiresLogin() throws Exception {
        Actor learner = login();
        JsonNode body = forYou(learner, 6);
        assertThat(body.get("daChonChuDe").asBoolean()).isFalse();
        assertThat(body.get("boThe").size()).isZero();

        mockMvc.perform(get("/api/v1/decks/for-you")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/decks/for-you").param("size", "21").cookie(learner.session()))
                .andExpect(status().isBadRequest());
    }

    private JsonNode forYou(Actor actor, int size) throws Exception {
        return jsonMapper.readTree(mockMvc.perform(get("/api/v1/decks/for-you")
                        .param("size", String.valueOf(size)).cookie(actor.session()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
    }

    private Long deck(Long owner, Long topicId, TrinhDo level, QuyenTruyCap access) {
        return decks.saveAndFlush(BoThe.create(owner, topicId, "ForYou " + UUID.randomUUID(), null,
                level, access)).getId();
    }

    private Actor login() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "ForYou tester", passwords.encode("matkhau123"),
                "Asia/Ho_Chi_Minh", roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long id = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", "matkhau123"))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return new Actor(id, session);
    }

    private record Actor(Long id, Cookie session) { }
}
