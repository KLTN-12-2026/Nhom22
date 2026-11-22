package com.do_an_tot_nghiep.k28.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import javax.sql.DataSource;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.crypto.password.PasswordEncoder;
import tools.jackson.databind.JsonNode;

class FR02OnboardingTourTest extends AbstractIntegrationTest {

    private static final String EDITOR = "library-editor@vocab.local";
    private static final String STARTER = "Khởi động — Một ngày của tôi";
    private static final String PASSWORD = "matkhau123";

    @Autowired DataSource dataSource;
    @Autowired JdbcTemplate jdbc;
    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired Clock clock;

    Cookie session;

    @BeforeEach
    void seedAndLogin() throws Exception {
        ResourceDatabasePopulator seed = new ResourceDatabasePopulator(
                new ClassPathResource("db/seed/R__library_daily_life.sql"));
        seed.setSqlScriptEncoding("UTF-8");
        seed.execute(dataSource);
        session = login();
    }

    @AfterEach
    void hideDailyDecks() {
        jdbc.update("""
                UPDATE bo_the b JOIN nguoi_dung u ON u.id = b.chu_so_huu_id
                SET b.xoa_at = UTC_TIMESTAMP(3)
                WHERE u.email = ? AND b.bo_mau = TRUE AND b.xoa_at IS NULL
                  AND (b.ten = ? OR b.ten LIKE 'Đời sống — %')
                """, EDITOR, STARTER);
    }

    @Test
    void fr02_dailyLifeSeedHasStarterAndQualityCards() {
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM the_tu_vung t JOIN bo_the b ON b.id = t.bo_the_id
                JOIN nguoi_dung u ON u.id = b.chu_so_huu_id
                WHERE u.email = ? AND b.ten = ? AND b.xoa_at IS NULL AND t.xoa_at IS NULL
                """, Long.class, EDITOR, STARTER)).isEqualTo(8L);
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM the_tu_vung t JOIN bo_the b ON b.id = t.bo_the_id
                JOIN nguoi_dung u ON u.id = b.chu_so_huu_id
                WHERE u.email = ? AND b.xoa_at IS NULL AND t.xoa_at IS NULL
                  AND (b.ten = ? OR b.ten LIKE 'Đời sống — %')
                  AND (t.phien_am IS NULL OR t.phien_am NOT LIKE '/%/'
                       OR t.vi_du_en IS NULL OR t.dich_vi IS NULL OR t.tu_loai IS NULL
                       OR LOCATE(LOWER(t.tu), LOWER(t.vi_du_en)) = 0)
                """, Long.class, EDITOR, STARTER)).isZero();
    }

    @Test
    void fr02_newUserTourStartsWithStarterCopy() throws Exception {
        mockMvc.perform(get("/api/v1/me/onboarding-tour").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.buocHuongDan").value("CHUA_BAT_DAU"))
                .andExpect(jsonPath("$.boKhoiDongId").doesNotExist());

        JsonNode started = start();
        assertThat(started.get("buocHuongDan").asString()).isEqualTo("HOC_BO_KHOI_DONG");
        String copyId = started.get("boKhoiDongId").asString();
        String sourceId = started.get("boKhoiDongNguonId").asString();
        assertThat(copyId).isNotEqualTo(sourceId);

        mockMvc.perform(get("/api/v1/decks/" + copyId).cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten").value(STARTER))
                .andExpect(jsonPath("$.boNguonId").value(sourceId));

        JsonNode again = start();
        assertThat(again.get("boKhoiDongId").asString()).isEqualTo(copyId);
    }

    @Test
    void fr02_tourMovesForwardOnlyAndChecksCopyOwner() throws Exception {
        String starterCopy = start().get("boKhoiDongId").asString();

        advance("XEM_TONG_KET", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.buocHuongDan").value("XEM_TONG_KET"));
        advance("HOC_BO_KHOI_DONG", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.buocHuongDan").value("XEM_TONG_KET"));
        advance("MO_BO_SAO_CHEP", "999999999")
                .andExpect(status().isNotFound());
        advance("MO_BO_SAO_CHEP", starterCopy)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.buocHuongDan").value("MO_BO_SAO_CHEP"))
                .andExpect(jsonPath("$.boSaoChepId").value(starterCopy));
        advance("CHUA_BAT_DAU", null)
                .andExpect(status().isBadRequest());
        advance("HOAN_TAT", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.buocHuongDan").value("HOAN_TAT"));

        assertThat(start().get("buocHuongDan").asString()).isEqualTo("HOC_BO_KHOI_DONG");
    }

    private JsonNode start() throws Exception {
        return jsonMapper.readTree(mockMvc.perform(post("/api/v1/me/onboarding-tour/start")
                        .cookie(session).with(xsrf()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private org.springframework.test.web.servlet.ResultActions advance(String step, String copyId) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("buocHuongDan", step);
        body.put("boSaoChepId", copyId);
        return mockMvc.perform(put("/api/v1/me/onboarding-tour").cookie(session).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(body)));
    }

    private Cookie login() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Tour tester", passwords.encode(PASSWORD),
                "Asia/Ho_Chi_Minh", roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        users.saveAndFlush(user);
        Cookie cookie = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(cookie).isNotNull();
        return cookie;
    }
}
