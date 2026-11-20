package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR04LibraryHighlightsTest extends AbstractIntegrationTest {

    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired BoTheRepository decks;
    @Autowired JdbcTemplate jdbc;
    @Autowired Clock clock;

    @Test
    void fr04_highlightsRankPublicDecksAndWeeklyContributors() throws Exception {
        Instant now = clock.instant();
        Long owner = user();
        Long weekly = deck(owner, QuyenTruyCap.CONG_KHAI);
        Long classic = deck(owner, QuyenTruyCap.CONG_KHAI);
        Long privateDeck = deck(owner, QuyenTruyCap.RIENG_TU);
        Long hidden = deck(owner, QuyenTruyCap.CONG_KHAI);
        jdbc.update("UPDATE bo_the SET trang_thai_kiem_duyet = 'DA_AN' WHERE id = ?", hidden);

        for (int i = 0; i < 40; i++) {
            Long fan = user();
            if (i < 30) {
                favorite(fan, weekly, now.minus(1, ChronoUnit.DAYS));
            }
            favorite(fan, classic, now.minus(30, ChronoUnit.DAYS));
            favorite(fan, privateDeck, now.minus(1, ChronoUnit.DAYS));
            favorite(fan, hidden, now.minus(1, ChronoUnit.DAYS));
            if (i < 3) {
                decks.saveAndFlush(BoThe.createCopy(fan, decks.findById(weekly).orElseThrow()));
            }
        }
        favorite(owner, weekly, now.minus(1, ChronoUnit.HOURS));
        decks.saveAndFlush(BoThe.createCopy(owner, decks.findById(weekly).orElseThrow()));

        JsonNode body = jsonMapper.readTree(mockMvc.perform(get("/api/v1/library/highlights"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());

        assertThat(Instant.parse(body.get("denLuc").asString()))
                .isEqualTo(Instant.parse(body.get("tuLuc").asString()).plus(7, ChronoUnit.DAYS));
        assertThat(body.get("yeuThichTuan").size()).isLessThanOrEqualTo(5);
        assertThat(count(body.get("yeuThichTuan"), weekly)).isEqualTo(30);
        assertThat(count(body.get("yeuThichTuan"), classic)).isEqualTo(-1);
        assertThat(count(body.get("yeuThichNhieuNhat"), classic)).isEqualTo(40);
        assertThat(count(body.get("yeuThichNhieuNhat"), weekly)).isEqualTo(30);
        for (JsonNode list : new JsonNode[]{body.get("yeuThichTuan"), body.get("yeuThichNhieuNhat")}) {
            assertThat(count(list, privateDeck)).isEqualTo(-1);
            assertThat(count(list, hidden)).isEqualTo(-1);
        }
        assertThat(body.get("yeuThichNhieuNhat").get(0).get("boThe").get("tenTacGia").asString())
                .isNotBlank();

        JsonNode contributor = null;
        for (JsonNode item : body.get("dongGopTuan")) {
            if (item.get("chuSoHuuId").asString().equals(owner.toString())) {
                contributor = item;
            }
        }
        assertThat(contributor).isNotNull();
        assertThat(contributor.get("tenTacGia").asString()).isEqualTo("Highlight user");
        assertThat(contributor.get("soYeuThich").asLong()).isEqualTo(30);
        assertThat(contributor.get("soSaoChep").asLong()).isEqualTo(3);
        assertThat(contributor.get("soBoCongKhai").asLong()).isEqualTo(2);
    }

    private static long count(JsonNode list, Long deckId) {
        for (JsonNode item : list) {
            if (item.get("boThe").get("id").asString().equals(deckId.toString())) {
                return item.get("soYeuThich").asLong();
            }
        }
        return -1;
    }

    private Long user() {
        NguoiDung user = NguoiDung.register(UUID.randomUUID() + "@test.local", "Highlight user",
                passwords.encode("matkhau123"), "Asia/Ho_Chi_Minh", roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        return users.saveAndFlush(user).getId();
    }

    private Long deck(Long owner, QuyenTruyCap access) {
        return decks.saveAndFlush(BoThe.create(owner, null, "Highlight " + UUID.randomUUID(), null,
                TrinhDo.CO_BAN, access)).getId();
    }

    private void favorite(Long userId, Long deckId, Instant at) {
        jdbc.update("INSERT INTO bo_yeu_thich (nguoi_dung_id, bo_the_id, created_at) VALUES (?, ?, ?)",
                userId, deckId, LocalDateTime.ofInstant(at, ZoneOffset.UTC));
    }
}
