package com.do_an_tot_nghiep.k28.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.LoaiToken;
import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.TokenTaiKhoan;
import com.do_an_tot_nghiep.k28.account.entity.TrangThaiNguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.HoSoHocTapRepository;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.TokenTaiKhoanRepository;
import com.do_an_tot_nghiep.k28.account.service.TokenService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;

class FR01RegisterTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final Pattern MESSAGE_ID = Pattern.compile("\"ID\":\"([^\"]+)\"");
    private static final Pattern TOKEN = Pattern.compile("token=([A-Za-z0-9_-]{20,})");

    private final HttpClient http = HttpClient.newHttpClient();

    @Autowired
    NguoiDungRepository users;

    @Autowired
    HoSoHocTapRepository profiles;

    @Autowired
    TokenTaiKhoanRepository tokens;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Test
    void tc01_registerCreatesUnverifiedUserWithBcryptPassword() throws Exception {
        String email = newEmail();

        register("  " + email.toUpperCase() + " ")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isString())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.tenHienThi").value("Minh Anh"))
                .andExpect(jsonPath("$.trangThai").value("CHUA_XAC_THUC"))
                .andExpect(jsonPath("$.muiGio").value("Asia/Bangkok"))
                .andExpect(jsonPath("$.vaiTro[0]").value("USER"))
                .andExpect(jsonPath("$.daHoanTatKhoiDau").value(false));

        NguoiDung user = users.findByEmail(email).orElseThrow();
        assertThat(user.getTrangThai()).isEqualTo(TrangThaiNguoiDung.CHUA_XAC_THUC);
        assertThat(user.getPasswordHash()).startsWith("$2").isNotEqualTo(PASSWORD);
        assertThat(passwordEncoder.matches(PASSWORD, user.getPasswordHash())).isTrue();
        assertThat(profiles.existsById(user.getId())).isTrue();
        assertThat(awaitToken(email)).isNotBlank();
    }

    @Test
    void tc01_duplicateEmailReturns409() throws Exception {
        String email = newEmail();
        register(email).andExpect(status().isCreated());

        register(email.toUpperCase())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
    }

    @Test
    void tc01_invalidRegisterReturnsFieldErrors() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("tenHienThi", "", "email", "sai", "password", "short", "acceptTerms", false))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors.length()").value(4));
    }

    @Test
    void tc01_verifyTokenActivatesOnceThenRejectsReuse() throws Exception {
        String email = newEmail();
        register(email).andExpect(status().isCreated());
        String token = awaitToken(email);

        verify(token).andExpect(status().isNoContent());
        NguoiDung user = users.findByEmail(email).orElseThrow();
        assertThat(user.getTrangThai()).isEqualTo(TrangThaiNguoiDung.HOAT_DONG);
        assertThat(user.getEmailXacThucAt()).isNotNull();

        verify(token)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("TOKEN_INVALID"));
    }

    @Test
    void tc01_wrongTokenRejected() throws Exception {
        verify("khong-phai-token-that-" + UUID.randomUUID())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("TOKEN_INVALID"));
    }

    @Test
    void tc01_expiredTokenRejected() throws Exception {
        String email = newEmail();
        register(email).andExpect(status().isCreated());
        Long userId = users.findByEmail(email).orElseThrow().getId();
        String raw = "expired-" + UUID.randomUUID();
        Instant past = Instant.now().minus(Duration.ofDays(2));
        tokens.save(TokenTaiKhoan.issue(userId, TokenService.sha256(raw), LoaiToken.XAC_THUC_EMAIL, past, Duration.ofHours(24)));

        verify(raw)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("TOKEN_INVALID"));
        assertThat(users.findById(userId).orElseThrow().isUnverified()).isTrue();
    }

    @Test
    void tc01_resendInvalidatesOldTokenAndHidesUnknownEmail() throws Exception {
        String email = newEmail();
        register(email).andExpect(status().isCreated());
        String first = awaitToken(email);

        resend(email).andExpect(status().isNoContent());
        await().atMost(Duration.ofSeconds(10)).until(() -> messageIds(email).size() >= 2);
        verify(first).andExpect(status().isBadRequest());

        resend(newEmail()).andExpect(status().isNoContent());
    }

    @Test
    void tc01_resendRateLimited() throws Exception {
        String email = newEmail();
        for (int i = 0; i < 3; i++) {
            resend(email).andExpect(status().isNoContent());
        }
        resend(email)
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("RATE_LIMITED"));
    }

    private ResultActions register(String email) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/register").with(xsrf()).with(randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("tenHienThi", "Minh Anh", "email", email,
                        "password", PASSWORD, "muiGio", "Asia/Bangkok", "acceptTerms", true))));
    }

    private ResultActions verify(String token) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/verify-email").with(xsrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("token", token))));
    }

    private ResultActions resend(String email) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/resend-verification").with(xsrf()).with(randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("email", email))));
    }

    private static String newEmail() {
        return "u" + UUID.randomUUID().toString().substring(0, 12) + "@vocab.local";
    }

    private String awaitToken(String email) {
        await().atMost(Duration.ofSeconds(10)).until(() -> !messageIds(email).isEmpty());
        String html = get("/message/" + messageIds(email).getFirst());
        Matcher m = TOKEN.matcher(html);
        assertThat(m.find()).isTrue();
        return m.group(1);
    }

    private java.util.List<String> messageIds(String email) {
        String body = get("/search?query=" + URLEncoder.encode("to:" + email, StandardCharsets.UTF_8));
        return MESSAGE_ID.matcher(body).results().map(r -> r.group(1)).toList();
    }

    private String get(String path) {
        try {
            return http.send(HttpRequest.newBuilder(URI.create(mailpitApi() + path)).GET().build(),
                    HttpResponse.BodyHandlers.ofString()).body();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
