package com.do_an_tot_nghiep.k28.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

class FR01LoginTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";

    @Autowired
    NguoiDungRepository users;

    @Autowired
    VaiTroRepository roles;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void tc01_loginAndLogoutClearCsrfCookie() throws Exception {
        Cookie csrf = mockMvc.perform(get("/api/v1/auth/csrf")).andReturn().getResponse().getCookie("XSRF-TOKEN");
        var response = mockMvc.perform(post("/api/v1/auth/login").cookie(csrf)
                        .header("X-XSRF-TOKEN", csrf.getValue()).contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(Map.of("email", newUser(true), "password", PASSWORD))))
                .andExpect(status().isOk()).andExpect(cookie().maxAge("XSRF-TOKEN", 0))
                .andReturn().getResponse();
        Cookie session = response.getCookie("SESSION");
        Cookie refreshed = mockMvc.perform(get("/api/v1/auth/csrf").cookie(session))
                .andReturn().getResponse().getCookie("XSRF-TOKEN");
        assertThat(refreshed.getValue()).isNotEqualTo(csrf.getValue());
        mockMvc.perform(post("/api/v1/auth/logout").cookie(session, refreshed)
                        .header("X-XSRF-TOKEN", csrf.getValue())).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/v1/auth/logout").cookie(session, refreshed)
                        .header("X-XSRF-TOKEN", refreshed.getValue()))
                .andExpect(status().isNoContent()).andExpect(cookie().maxAge("XSRF-TOKEN", 0));
    }

    @Test
    void tc01_loginReturnsUserAndHttpOnlySessionCookie() throws Exception {
        String email = newUser(true);

        login(email, PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isString())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.trangThai").value("HOAT_DONG"))
                .andExpect(jsonPath("$.vaiTro[0]").value("USER"))
                .andExpect(cookie().exists("SESSION"))
                .andExpect(cookie().httpOnly("SESSION", true));

        assertThat(users.findByEmail(email).orElseThrow().getDangNhapCuoiAt()).isNotNull();
    }

    @Test
    void tc01_meWithSessionReturnsCurrentUser() throws Exception {
        String email = newUser(true);
        Cookie session = sessionOf(email);

        mockMvc.perform(get("/api/v1/me").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.tenHienThi").value("Minh Anh"));
    }

    @Test
    void tc01_loginChangesSessionId() throws Exception {
        String email = newUser(true);
        Cookie first = sessionOf(email);

        Cookie second = login(email, PASSWORD, first)
                .andExpect(status().isOk())
                .andReturn().getResponse().getCookie("SESSION");

        assertThat(second).isNotNull();
        assertThat(second.getValue()).isNotEqualTo(first.getValue());
        mockMvc.perform(get("/api/v1/me").cookie(first)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/me").cookie(second)).andExpect(status().isOk());
    }

    @Test
    void tc01_logoutInvalidatesSession() throws Exception {
        Cookie session = sessionOf(newUser(true));

        mockMvc.perform(post("/api/v1/auth/logout").cookie(session).with(xsrf()))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/me").cookie(session))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
    }

    @Test
    void tc01_anonymousRequestDoesNotCreateSession() throws Exception {
        mockMvc.perform(get("/api/v1/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(cookie().doesNotExist("SESSION"));
    }

    @Test
    void tc01_wrongPasswordAndUnknownEmailReturnSame401() throws Exception {
        String email = newUser(true);

        login(email, "saimatkhau999")
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("Sai email hoặc mật khẩu"));

        login("khongtontai" + UUID.randomUUID() + "@vocab.local", PASSWORD)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("Sai email hoặc mật khẩu"));
    }

    @Test
    void tc01_unverifiedReturns403() throws Exception {
        login(newUser(false), PASSWORD)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("EMAIL_NOT_VERIFIED"))
                .andExpect(cookie().doesNotExist("SESSION"));
    }

    @Test
    void tc01_lockedReturns403() throws Exception {
        String email = newUser(true);
        jdbc.update("UPDATE nguoi_dung SET trang_thai = 'BI_KHOA' WHERE email = ?", email);

        login(email, PASSWORD)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
    }

    @Test
    void tc01_tooManyFailuresReturns429() throws Exception {
        String email = newUser(true);
        for (int i = 0; i < 5; i++) {
            login(email, "saimatkhau999").andExpect(status().isUnauthorized());
        }

        login(email, PASSWORD)
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    private ResultActions login(String email, String password, Cookie... cookies) throws Exception {
        MockHttpServletRequestBuilder request = post("/api/v1/auth/login").with(xsrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("email", email, "password", password)));
        if (cookies.length > 0) {
            request.cookie(cookies);
        }
        return mockMvc.perform(request);
    }

    private Cookie sessionOf(String email) throws Exception {
        Cookie session = login(email, PASSWORD)
                .andExpect(status().isOk())
                .andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return session;
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
