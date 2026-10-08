package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import javax.sql.DataSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR04LibrarySeedTest extends AbstractIntegrationTest {

    @Autowired DataSource dataSource;
    @Autowired JdbcTemplate jdbc;

    @BeforeEach
    void seedStarters() {
        ResourceDatabasePopulator seed = new ResourceDatabasePopulator(
                new ClassPathResource("db/seed/R__library_starter.sql"));
        seed.setSqlScriptEncoding("UTF-8");
        seed.execute(dataSource);
    }

    @ParameterizedTest
    @CsvSource({
            "GIAO_TIEP,MOI_BAT_DAU", "GIAO_TIEP,CO_BAN",
            "GIAO_TIEP,TRUNG_CAP", "GIAO_TIEP,NANG_CAO",
            "TOEIC,MOI_BAT_DAU", "TOEIC,CO_BAN",
            "TOEIC,TRUNG_CAP", "TOEIC,NANG_CAO"
    })
    void tc03_seedProvidesStarterForEveryGoalAndLevel(String goal, String level) throws Exception {
        mockMvc.perform(get("/api/v1/library/decks")
                        .param("q", "Khởi động —")
                        .param("nguon", "MAU")
                        .param("mucTieu", goal)
                        .param("trinhDo", level))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].soThe").value(3))
                .andExpect(jsonPath("$.items[0].nguon").value("MAU"))
                .andExpect(jsonPath("$.items[0].mucTieu").value(goal))
                .andExpect(jsonPath("$.items[0].trinhDo").value(level));
    }

    @Test
    void tc03_seedCanRunAgainWithoutDuplicateDecksOrCards() {
        ResourceDatabasePopulator seed = new ResourceDatabasePopulator(
                new ClassPathResource("db/seed/R__library_starter.sql"));
        seed.setSqlScriptEncoding("UTF-8");
        seed.execute(dataSource);
        seed.execute(dataSource);
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM bo_the b JOIN nguoi_dung u ON u.id = b.chu_so_huu_id
                WHERE u.email = 'library-editor@vocab.local'
                """, Long.class)).isEqualTo(8);
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM the_tu_vung t JOIN bo_the b ON b.id = t.bo_the_id
                JOIN nguoi_dung u ON u.id = b.chu_so_huu_id
                WHERE u.email = 'library-editor@vocab.local'
                """, Long.class)).isEqualTo(24);
        assertThat(jdbc.queryForObject("""
                SELECT password_hash FROM nguoi_dung WHERE email = 'library-editor@vocab.local'
                """, String.class)).isNull();
    }
}
