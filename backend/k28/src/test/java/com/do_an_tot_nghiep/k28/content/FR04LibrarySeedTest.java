package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.crypto.password.PasswordEncoder;
import tools.jackson.databind.JsonNode;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR04LibrarySeedTest extends AbstractIntegrationTest {

    private static final String EDITOR = "library-editor@vocab.local";
    private static final String PASSWORD = "matkhau123";
    private static final int DECKS = 8;
    private static final int CARDS_PER_DECK = 30;

    @Autowired DataSource dataSource;
    @Autowired JdbcTemplate jdbc;
    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired Clock clock;

    @BeforeEach
    void seedLibrary() {
        runSeed();
    }

    @ParameterizedTest
    @CsvSource({
            "GIAO_TIEP,MOI_BAT_DAU,'Giao tiếp mới bắt đầu — Chào hỏi và sinh hoạt hằng ngày'",
            "GIAO_TIEP,CO_BAN,'Giao tiếp cơ bản — Hẹn gặp, hỏi đường và mua sắm'",
            "GIAO_TIEP,TRUNG_CAP,'Giao tiếp trung cấp — Trao đổi ý kiến và giải quyết vấn đề'",
            "GIAO_TIEP,NANG_CAO,'Giao tiếp nâng cao — Thuyết phục và diễn đạt tinh tế'",
            "TOEIC,MOI_BAT_DAU,'TOEIC mới bắt đầu — Văn phòng và đi lại'",
            "TOEIC,CO_BAN,'TOEIC cơ bản — Mua bán, giao hàng và đặt chỗ'",
            "TOEIC,TRUNG_CAP,'TOEIC trung cấp — Tài chính, nhân sự và quy trình'",
            "TOEIC,NANG_CAO,'TOEIC nâng cao — Hợp đồng, rủi ro và chiến lược'"
    })
    void tc03_seedProvidesTemplateForEveryGoalAndLevel(String goal, String level, String name) throws Exception {
        mockMvc.perform(get("/api/v1/library/decks")
                        .param("q", name)
                        .param("nguon", "MAU")
                        .param("mucTieu", goal)
                        .param("trinhDo", level))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].ten").value(name))
                .andExpect(jsonPath("$.items[0].soThe").value(CARDS_PER_DECK))
                .andExpect(jsonPath("$.items[0].nguon").value("MAU"))
                .andExpect(jsonPath("$.items[0].mucTieu").value(goal))
                .andExpect(jsonPath("$.items[0].trinhDo").value(level));
    }

    @Test
    void b52a_everyTemplateCardHasIpaExampleAndTranslation() {
        assertThat(templateCards()).isEqualTo(DECKS * CARDS_PER_DECK);
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM the_tu_vung t JOIN bo_the b ON b.id = t.bo_the_id
                JOIN nguoi_dung u ON u.id = b.chu_so_huu_id
                WHERE u.email = ? AND b.bo_mau = TRUE AND b.xoa_at IS NULL AND t.xoa_at IS NULL
                  AND (t.phien_am IS NULL OR t.phien_am NOT LIKE '/%/'
                       OR t.vi_du_en IS NULL OR t.dich_vi IS NULL OR t.tu_loai IS NULL
                       OR LOCATE(LOWER(t.tu), LOWER(t.vi_du_en)) = 0)
                """, Long.class, EDITOR)).isZero();
    }

    @Test
    void tc03_seedCanRunAgainWithoutDuplicateDecksOrCards() {
        runSeed();
        runSeed();
        assertThat(templateDecks()).isEqualTo(DECKS);
        assertThat(templateCards()).isEqualTo(DECKS * CARDS_PER_DECK);
        assertThat(jdbc.queryForObject(
                "SELECT password_hash FROM nguoi_dung WHERE email = ?", String.class, EDITOR)).isNull();
    }

    @Test
    void b52a_seedUpgradesStarterDeckFromPreviousVersion() {
        jdbc.update("""
                UPDATE bo_the b JOIN nguoi_dung u ON u.id = b.chu_so_huu_id
                SET b.ten = 'Khởi động — TOEIC cơ bản'
                WHERE u.email = ? AND b.ten = 'TOEIC cơ bản — Mua bán, giao hàng và đặt chỗ'
                """, EDITOR);
        jdbc.update("""
                UPDATE the_tu_vung t JOIN bo_the b ON b.id = t.bo_the_id
                SET t.phien_am = NULL
                WHERE b.ten = 'Khởi động — TOEIC cơ bản' AND t.tu = 'invoice'
                """);

        runSeed();

        assertThat(templateDecks()).isEqualTo(DECKS);
        assertThat(templateCards()).isEqualTo(DECKS * CARDS_PER_DECK);
        assertThat(jdbc.queryForObject("""
                SELECT t.phien_am FROM the_tu_vung t JOIN bo_the b ON b.id = t.bo_the_id
                JOIN nguoi_dung u ON u.id = b.chu_so_huu_id
                WHERE u.email = ? AND b.ten = 'TOEIC cơ bản — Mua bán, giao hàng và đặt chỗ' AND t.tu = 'invoice'
                """, String.class, EDITOR)).isEqualTo("/ˈɪnvɔɪs/");
    }

    @Test
    void b52a_everyCopiedTemplateBuildsListeningPractice() throws Exception {
        Cookie session = login();
        List<Long> templates = jdbc.queryForList("""
                SELECT b.id FROM bo_the b JOIN nguoi_dung u ON u.id = b.chu_so_huu_id
                WHERE u.email = ? AND b.bo_mau = TRUE AND b.xoa_at IS NULL ORDER BY b.id
                """, Long.class, EDITOR);
        assertThat(templates).hasSize(DECKS);

        for (Long template : templates) {
            String copyId = body(mockMvc.perform(post("/api/v1/decks/" + template + "/copy")
                            .header("Idempotency-Key", UUID.randomUUID().toString())
                            .cookie(session).with(xsrf()))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8)).get("id").asString();

            JsonNode practice = body(mockMvc.perform(post("/api/v1/practice/sessions")
                            .cookie(session).with(xsrf())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(toJson(Map.of("loaiBai", "NGHE_VIET", "soCau", 20, "boTheId", copyId))))
                    .andExpect(status().isCreated())
                    .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));

            assertThat(practice.get("cauHoi")).hasSize(20);
            for (JsonNode question : practice.get("cauHoi")) {
                assertThat(question.get("loaiCau").asString()).isEqualTo("NGHE_VIET");
                assertThat(question.get("deBai").get("amThanhTts").asBoolean()).isTrue();
            }
        }
    }

    private void runSeed() {
        ResourceDatabasePopulator seed = new ResourceDatabasePopulator(
                new ClassPathResource("db/seed/R__library_starter.sql"));
        seed.setSqlScriptEncoding("UTF-8");
        seed.execute(dataSource);
    }

    private Long templateDecks() {
        return jdbc.queryForObject("""
                SELECT COUNT(*) FROM bo_the b JOIN nguoi_dung u ON u.id = b.chu_so_huu_id
                WHERE u.email = ? AND b.bo_mau = TRUE AND b.xoa_at IS NULL
                """, Long.class, EDITOR);
    }

    private Long templateCards() {
        return jdbc.queryForObject("""
                SELECT COUNT(*) FROM the_tu_vung t JOIN bo_the b ON b.id = t.bo_the_id
                JOIN nguoi_dung u ON u.id = b.chu_so_huu_id
                WHERE u.email = ? AND b.bo_mau = TRUE AND b.xoa_at IS NULL AND t.xoa_at IS NULL
                """, Long.class, EDITOR);
    }

    private JsonNode body(String content) {
        return jsonMapper.readTree(content);
    }

    private Cookie login() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Library tester", passwords.encode(PASSWORD),
                "Asia/Ho_Chi_Minh", roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        users.saveAndFlush(user);
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return session;
    }
}
