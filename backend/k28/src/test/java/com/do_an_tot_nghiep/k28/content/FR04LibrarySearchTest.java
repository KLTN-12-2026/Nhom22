package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR04LibrarySearchTest extends AbstractIntegrationTest {

    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired BoTheRepository decks;
    @Autowired TheTuVungRepository cards;
    @Autowired JdbcTemplate jdbc;
    @Autowired Clock clock;

    @Test
    void fr04_suggestGroupsPublicWordsDecksAuthorsAndOwnContent() throws Exception {
        String token = "zq" + UUID.randomUUID().toString().substring(0, 8);
        String email = UUID.randomUUID() + "@test.local";
        Long author = user(email, "Tác giả " + token);
        Long publicDeck = deck(author, "Bộ " + token, QuyenTruyCap.CONG_KHAI);
        Long privateDeck = deck(author, "Riêng " + token, QuyenTruyCap.RIENG_TU);
        Long hiddenDeck = deck(author, "Ẩn " + token, QuyenTruyCap.CONG_KHAI);
        jdbc.update("UPDATE bo_the SET trang_thai_kiem_duyet = 'DA_AN' WHERE id = ?", hiddenDeck);

        Long exact = card(publicDeck, token, "nghĩa chính");
        Long longer = card(publicDeck, token + "ing", "nghĩa phụ");
        Long hiddenCard = card(publicDeck, token + "x", "bị ẩn");
        jdbc.update("UPDATE the_tu_vung SET an_kiem_duyet = TRUE WHERE id = ?", hiddenCard);
        Long privateCard = card(privateDeck, token + "p", "riêng tư");
        card(hiddenDeck, token + "h", "bộ bị ẩn");

        JsonNode anonymous = body(mockMvc.perform(get("/api/v1/library/search").param("q", token))
                .andExpect(status().isOk()).andReturn());

        assertThat(ids(anonymous.get("tuVung").get("items"))).containsExactly(exact, longer);
        assertThat(anonymous.get("tuVung").get("totalElements").asLong()).isEqualTo(2);
        assertThat(anonymous.get("tuVung").get("items").get(0).get("tenBoThe").asString())
                .isEqualTo("Bộ " + token);
        assertThat(ids(anonymous.get("boThe").get("items"))).containsExactly(publicDeck);
        JsonNode authorHit = anonymous.get("tacGia").get("items").get(0);
        assertThat(authorHit.get("id").asString()).isEqualTo(author.toString());
        assertThat(authorHit.get("soBoThe").asLong()).isEqualTo(1);
        assertThat(authorHit.get("soThe").asLong()).isEqualTo(2);
        assertThat(anonymous.get("cuaToi").isNull()).isTrue();

        Cookie session = login(email);
        JsonNode mine = body(mockMvc.perform(get("/api/v1/library/search").param("q", token).cookie(session))
                .andExpect(status().isOk()).andReturn()).get("cuaToi");
        assertThat(ids(mine.get("boThe").get("items"))).contains(publicDeck, privateDeck, hiddenDeck);
        assertThat(ids(mine.get("tuVung").get("items"))).contains(privateCard, hiddenCard);

        JsonNode page = body(mockMvc.perform(get("/api/v1/library/search/cards")
                        .param("q", token).param("size", "1").param("page", "1"))
                .andExpect(status().isOk()).andReturn());
        assertThat(ids(page.get("items"))).containsExactly(longer);
        assertThat(page.get("totalPages").asInt()).isEqualTo(2);

        JsonNode profile = body(mockMvc.perform(get("/api/v1/library/authors/{id}", author))
                .andExpect(status().isOk()).andReturn());
        assertThat(profile.get("tenHienThi").asString()).isEqualTo("Tác giả " + token);

        JsonNode authorDecks = body(mockMvc.perform(get("/api/v1/library/decks").param("chuSoHuuId", author.toString()))
                .andExpect(status().isOk()).andReturn());
        assertThat(ids(authorDecks.get("items"))).containsExactly(publicDeck);
    }

    @Test
    void fr04_searchRejectsBlankQueryAndUnknownAuthor() throws Exception {
        mockMvc.perform(get("/api/v1/library/search").param("q", "  "))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/library/search/authors").param("q", "a").param("size", "51"))
                .andExpect(status().isBadRequest());
        Long lonely = user(UUID.randomUUID() + "@test.local", "Không có bộ");
        mockMvc.perform(get("/api/v1/library/authors/{id}", lonely))
                .andExpect(status().isNotFound());
    }

    private static List<Long> ids(JsonNode items) {
        List<Long> result = new ArrayList<>();
        items.forEach(item -> result.add(Long.valueOf(item.get("id").asString())));
        return result;
    }

    private JsonNode body(MvcResult result) throws Exception {
        return jsonMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private Long user(String email, String name) {
        NguoiDung user = NguoiDung.register(email, name, passwords.encode("matkhau123"),
                "Asia/Ho_Chi_Minh", roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        return users.saveAndFlush(user).getId();
    }

    private Cookie login(String email) throws Exception {
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", "matkhau123"))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return session;
    }

    private Long deck(Long owner, String name, QuyenTruyCap access) {
        return decks.saveAndFlush(BoThe.create(owner, null, name, null, TrinhDo.CO_BAN, access)).getId();
    }

    private Long card(Long deckId, String word, String meaning) {
        return cards.saveAndFlush(TheTuVung.create(deckId, word, null, meaning, null, null, null, 1, null)).getId();
    }
}
