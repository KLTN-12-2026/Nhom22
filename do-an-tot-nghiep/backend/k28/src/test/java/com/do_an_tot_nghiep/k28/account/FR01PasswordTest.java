package com.do_an_tot_nghiep.k28.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.enums.LoaiToken;
import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.account.service.TokenService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;

class FR01PasswordTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String NEW_PASSWORD = "matkhaumoi456";

    @Autowired
    NguoiDungRepository users;

    @Autowired
    VaiTroRepository roles;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    TokenService tokenService;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void tc01_forgotAlwaysReturns200() throws Exception {
        String email = newUser(true);

        forgot(email).andExpect(status().isOk());
        forgot("khongtontai" + UUID.randomUUID() + "@vocab.local").andExpect(status().isOk());

        assertThat(resetTokenCount(email)).isEqualTo(1);
    }

    @Test
    void tc01_resetChangesPasswordAndRevokesAllSessions() throws Exception {
        String email = newUser(true);
        Cookie session = sessionOf(email, PASSWORD);

        reset(resetToken(email, Duration.ofMinutes(30)), NEW_PASSWORD).andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/me").cookie(session)).andExpect(status().isUnauthorized());
        login(email, PASSWORD).andExpect(status().isUnauthorized());
        login(email, NEW_PASSWORD).andExpect(status().isOk());
    }

    @Test
    void tc01_resetTokenCannotBeReused() throws Exception {
        String token = resetToken(newUser(true), Duration.ofMinutes(30));

        reset(token, NEW_PASSWORD).andExpect(status().isNoContent());
        reset(token, "matkhaukhac789")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("TOKEN_INVALID"))
                .andExpect(jsonPath("$.message").value("Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn"));
    }

    @Test
    void tc01_invalidExpiredOrWrongTypeTokenRejected() throws Exception {
        String email = newUser(false);
        Long userId = users.findByEmail(email).orElseThrow().getId();
        String expired = resetToken(email, Duration.ofSeconds(-1));
        String verifyToken = tokenService.issue(userId, LoaiToken.XAC_THUC_EMAIL, Duration.ofHours(1));

        for (String token : new String[]{"tokensai" + UUID.randomUUID(), expired, verifyToken}) {
            reset(token, NEW_PASSWORD)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("TOKEN_INVALID"));
        }

        reset(resetToken(email, Duration.ofMinutes(30)), "ngan")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'password')]").exists());
    }

    @Test
    void tc01_resetVerifiesUnverifiedUser() throws Exception {
        String email = newUser(false);

        reset(resetToken(email, Duration.ofMinutes(30)), NEW_PASSWORD).andExpect(status().isNoContent());

        NguoiDung user = users.findByEmail(email).orElseThrow();
        assertThat(user.getTrangThai()).isEqualTo(TrangThaiNguoiDung.HOAT_DONG);
        assertThat(user.getEmailXacThucAt()).isNotNull();
    }

    @Test
    void tc01_changeKeepsCurrentSessionAndRevokesOthers() throws Exception {
        String email = newUser(true);
        Cookie current = sessionOf(email, PASSWORD);
        Cookie other = sessionOf(email, PASSWORD);

        change(current, PASSWORD, NEW_PASSWORD).andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/me").cookie(current)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/me").cookie(other)).andExpect(status().isUnauthorized());
        login(email, NEW_PASSWORD).andExpect(status().isOk());
    }

    @Test
    void tc01_wrongCurrentPasswordReturns400() throws Exception {
        String email = newUser(true);
        Cookie session = sessionOf(email, PASSWORD);

        change(session, "saimatkhau999", NEW_PASSWORD)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.message").value("Mật khẩu hiện tại không đúng"))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'currentPassword')]").exists());

        change(session, PASSWORD, PASSWORD)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Mật khẩu mới phải khác mật khẩu hiện tại"))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'newPassword')]").exists());

        mockMvc.perform(get("/api/v1/me").cookie(session)).andExpect(status().isOk());
    }

    @Test
    void tc01_changeRequiresLogin() throws Exception {
        mockMvc.perform(put("/api/v1/me/password").with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("currentPassword", PASSWORD, "newPassword", NEW_PASSWORD))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    private ResultActions forgot(String email) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/forgot-password").with(xsrf()).with(randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("email", email))));
    }

    private ResultActions reset(String token, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/reset-password").with(xsrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("token", token, "password", password))));
    }

    private ResultActions change(Cookie session, String current, String next) throws Exception {
        return mockMvc.perform(put("/api/v1/me/password").cookie(session).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("currentPassword", current, "newPassword", next))));
    }

    private ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login").with(xsrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("email", email, "password", password))));
    }

    private Cookie sessionOf(String email, String password) throws Exception {
        Cookie session = login(email, password)
                .andExpect(status().isOk())
                .andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return session;
    }

    private String resetToken(String email, Duration ttl) {
        Long userId = users.findByEmail(email).orElseThrow().getId();
        return tokenService.issue(userId, LoaiToken.DAT_LAI_MAT_KHAU, ttl);
    }

    private int resetTokenCount(String email) {
        Integer count = jdbc.queryForObject("""
                SELECT COUNT(*) FROM token_tai_khoan t
                JOIN nguoi_dung u ON u.id = t.nguoi_dung_id
                WHERE u.email = ? AND t.loai = 'DAT_LAI_MAT_KHAU'
                """, Integer.class, email);
        return count == null ? 0 : count;
    }

    private String newUser(boolean verified) {
        String email = "u" + UUID.randomUUID().toString().substring(0, 12) + "@vocab.local";
        VaiTro role = roles.findByMa(VaiTro.USER).orElseThrow();
        NguoiDung user = NguoiDung.register(email, "Minh Anh", passwordEncoder.encode(PASSWORD), "Asia/Ho_Chi_Minh", role);
        if (verified) {
            user.verifyEmail(Instant.now());
        }
        users.save(user);
        return email;
    }
}