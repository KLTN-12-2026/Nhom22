package com.do_an_tot_nghiep.k28.support;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;

class IntegrationSetupTest extends AbstractIntegrationTest {

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    StringRedisTemplate redis;

    @Test
    void flywayCreatedSchemaWithoutDevSeed() {
        Integer roles = jdbc.queryForObject("SELECT COUNT(*) FROM vai_tro", Integer.class);
        Integer users = jdbc.queryForObject("SELECT COUNT(*) FROM nguoi_dung", Integer.class);
        assertThat(roles).isEqualTo(2);
        assertThat(users).isZero();
    }

    @Test
    void redisIsReachable() {
        redis.opsForValue().set("it:ping", "pong");
        assertThat(redis.opsForValue().get("it:ping")).isEqualTo("pong");
    }

    @Test
    void postWithoutXsrfIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/public/ping").with(randomIp()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void xsrfHelperPassesCsrfFilter() throws Exception {
        mockMvc.perform(post("/api/v1/public/ping").with(xsrf()).with(randomIp()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("NOT_FOUND"));
    }
}