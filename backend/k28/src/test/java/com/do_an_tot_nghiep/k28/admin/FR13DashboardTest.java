package com.do_an_tot_nghiep.k28.admin;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Set;
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

class FR13DashboardTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired
    private NguoiDungRepository users;

    @Autowired
    private VaiTroRepository roles;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbc;

    private record Actor(Long id, Cookie session) {
    }

    @Test
    void fr13_dashboardIsAdminOnlyAndValidatesRange() throws Exception {
        Actor admin = actor(true);
        Actor learner = actor(false);
        mockMvc.perform(get("/api/v1/admin/dashboard").cookie(learner.session()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/dashboard").param("soNgay", "14").cookie(admin.session()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void fr13_dashboardAggregatesUsersLearningRevenueAndQueue() throws Exception {
        Actor admin = actor(true);
        JsonNode before = dashboard(admin, 30);
        assertThat(before.get("soNgay").asInt()).isEqualTo(30);
        assertThat(before.get("theoNgay").size()).isEqualTo(30);
        assertThat(before.get("doanhThuTheoThang").size()).isEqualTo(12);
        assertThat(before.get("heThong").get("redis").asString()).isEqualTo("UP");
        assertThat(before.get("dichVuHomNay").get("dichVu").size()).isPositive();

        Actor learner = actor(false);
        LocalDate today = LocalDate.now(ZONE);
        jdbc.update("INSERT INTO su_dung_hoc_ngay (nguoi_dung_id, ngay_dia_phuong, so_the_moi, so_luot_hop_le, diem) "
                + "VALUES (?, ?, 2, 9, 0)", learner.id(), today);
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        jdbc.update("INSERT INTO giao_dich_thanh_toan (ma_don, nguoi_dung_id, goi_ma, chu_ky, so_tien, cong, trang_thai, "
                        + "tao_at, hoan_tat_at) VALUES (?, ?, 'PRO', 'THANG', 299000, 'MO_PHONG', 'THANH_CONG', ?, ?)",
                "T" + UUID.randomUUID().toString().substring(0, 20), learner.id(), now, now);
        jdbc.update("INSERT INTO giao_dich_thanh_toan (ma_don, nguoi_dung_id, goi_ma, chu_ky, so_tien, cong, trang_thai, "
                        + "tao_at) VALUES (?, ?, 'PRO', 'THANG', 299000, 'MO_PHONG', 'CHO_THANH_TOAN', ?)",
                "T" + UUID.randomUUID().toString().substring(0, 20), learner.id(), now.minusHours(1));

        JsonNode after = dashboard(admin, 30);
        JsonNode b = before.get("chiSo");
        JsonNode a = after.get("chiSo");
        assertThat(a.get("tongNguoiDung").asLong()).isEqualTo(b.get("tongNguoiDung").asLong() + 1);
        assertThat(a.get("nguoiDungMoi").asLong()).isEqualTo(b.get("nguoiDungMoi").asLong() + 1);
        assertThat(a.get("hoatDongHomNay").asLong()).isEqualTo(b.get("hoatDongHomNay").asLong() + 1);
        assertThat(a.get("luotOnTrongKy").asLong()).isEqualTo(b.get("luotOnTrongKy").asLong() + 9);
        assertThat(a.get("doanhThuThangNay").asLong()).isEqualTo(b.get("doanhThuThangNay").asLong() + 299000);
        JsonNode lastDay = after.get("theoNgay").get(29);
        assertThat(lastDay.get("ngay").asString()).isEqualTo(today.toString());
        assertThat(lastDay.get("dangKy").asLong()).isPositive();
        assertThat(after.get("canXuLy").get("giaoDichTreo").asLong())
                .isEqualTo(before.get("canXuLy").get("giaoDichTreo").asLong() + 1);
        assertThat(after.get("nguoiDungMoi").get(0).get("id").asString()).isEqualTo(String.valueOf(learner.id()));
    }

    private JsonNode dashboard(Actor admin, int soNgay) throws Exception {
        return jsonMapper.readTree(mockMvc.perform(get("/api/v1/admin/dashboard")
                        .param("soNgay", String.valueOf(soNgay)).cookie(admin.session()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
    }

    private Actor actor(boolean admin) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Dashboard tester", passwordEncoder.encode(PASSWORD),
                "Asia/Ho_Chi_Minh", roles.findByMa(VaiTro.USER).orElseThrow());
        if (admin) {
            user.replaceRoles(Set.of(roles.findByMa(VaiTro.USER).orElseThrow(), roles.findByMa(VaiTro.ADMIN).orElseThrow()));
        }
        user.verifyEmail(Instant.now());
        Long id = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return new Actor(id, session);
    }
}
