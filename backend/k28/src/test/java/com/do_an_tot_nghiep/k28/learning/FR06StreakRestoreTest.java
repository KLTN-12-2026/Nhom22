package com.do_an_tot_nghiep.k28.learning;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR06StreakRestoreTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";

    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired Clock clock;
    @Autowired JdbcTemplate jdbc;

    @Test
    void streakStatusShowsTheLastSevenDays() throws Exception {
        Learner learner = learner();
        LocalDate today = today();
        for (int i = 1; i <= 3; i++) {
            usage(learner, today.minusDays(i), 6);
        }
        usage(learner, today, 2);

        mockMvc.perform(get("/api/v1/learning/streak").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chuoiNgay").value(3))
                .andExpect(jsonPath("$.homNayDaTinhChuoi").value(false))
                .andExpect(jsonPath("$.luotHomNay").value(2))
                .andExpect(jsonPath("$.luotToiThieuChuoi").value(5))
                .andExpect(jsonPath("$.bayNgay.length()").value(7))
                .andExpect(jsonPath("$.bayNgay[6].trangThai").value("CHUA_HOC"))
                .andExpect(jsonPath("$.bayNgay[5].trangThai").value("HOC"))
                .andExpect(jsonPath("$.khoiPhuc.coThe").value(false))
                .andExpect(jsonPath("$.khoiPhuc.conLai").value(5));
    }

    @Test
    void lostStreakIsRestoredOnceWithinTheMonthlyQuota() throws Exception {
        Learner learner = learner();
        LocalDate today = today();
        for (int i = 4; i <= 14; i++) {
            usage(learner, today.minusDays(i), 5);
        }

        JsonNode before = json(mockMvc.perform(get("/api/v1/learning/streak").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.khoiPhuc.coThe").value(true))
                .andExpect(jsonPath("$.khoiPhuc.duLuot").value(true))
                .andReturn().getResponse().getContentAsString());
        int restored = before.get("khoiPhuc").get("chuoiSauKhoiPhuc").asInt();
        int needed = before.get("khoiPhuc").get("ngayCanBu").size();
        assertThat(restored).isEqualTo(11);
        assertThat(needed).isBetween(1, 3);
        assertThat(before.get("chuoiNgay").asInt()).isLessThan(restored);

        mockMvc.perform(post("/api/v1/learning/streak/restore").cookie(learner.session()).with(xsrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chuoiNgay").value(11))
                .andExpect(jsonPath("$.khoiPhuc.coThe").value(false))
                .andExpect(jsonPath("$.khoiPhuc.daDungThang").value(needed))
                .andExpect(jsonPath("$.khoiPhuc.conLai").value(5 - needed));

        mockMvc.perform(get("/api/v1/learning/today").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.chuoiNgay").value(11));

        mockMvc.perform(post("/api/v1/learning/streak/restore").cookie(learner.session()).with(xsrf()))
                .andExpect(status().isUnprocessableContent());
    }

    @Test
    void restoreIsRefusedWhenTheMonthlyQuotaIsUsedUp() throws Exception {
        Learner learner = learner();
        LocalDate today = today();
        for (int i = 4; i <= 14; i++) {
            usage(learner, today.minusDays(i), 5);
        }
        for (int i = 0; i < 5; i++) {
            jdbc.update("INSERT INTO khoi_phuc_chuoi (nguoi_dung_id, ngay, thang, created_at, updated_at) VALUES (?, ?, ?, NOW(3), NOW(3))",
                    learner.id(), today.minusDays(400 + i), today.withDayOfMonth(1));
        }

        mockMvc.perform(get("/api/v1/learning/streak").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.khoiPhuc.coThe").value(true))
                .andExpect(jsonPath("$.khoiPhuc.duLuot").value(false))
                .andExpect(jsonPath("$.khoiPhuc.conLai").value(0));

        mockMvc.perform(post("/api/v1/learning/streak/restore").cookie(learner.session()).with(xsrf()))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.message").value("Tháng này bạn đã dùng hết 5 lượt khôi phục"));
    }

    @Test
    void streakEndpointsNeedLogin() throws Exception {
        mockMvc.perform(get("/api/v1/learning/streak")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/learning/streak/restore").with(xsrf())).andExpect(status().isUnauthorized());
    }

    private LocalDate today() {
        return LocalDate.ofInstant(clock.instant(), ZoneOffset.UTC);
    }

    private void usage(Learner learner, LocalDate day, int validReviews) {
        jdbc.update("INSERT INTO su_dung_hoc_ngay (nguoi_dung_id, ngay_dia_phuong, so_the_moi, so_luot_hop_le) VALUES (?, ?, 0, ?)",
                learner.id(), day, validReviews);
    }

    private JsonNode json(String body) {
        return jsonMapper.readTree(body);
    }

    private Learner learner() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Streak tester", passwords.encode(PASSWORD), "UTC", roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long id = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        return new Learner(id, session);
    }

    private record Learner(Long id, Cookie session) {
    }
}
