package com.do_an_tot_nghiep.k28.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.allOf;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.dto.GoogleProfile;
import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrangThaiNguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.account.service.GoogleLoginService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

class FR01GoogleLoginTest extends AbstractIntegrationTest {

    @Autowired
    GoogleLoginService google;

    @Autowired
    NguoiDungRepository users;

    @Autowired
    VaiTroRepository roles;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void tc01_startRedirectsToGoogleWithCallback() throws Exception {
        mockMvc.perform(get("/api/v1/auth/google/start").param("next", "/bo-the"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/api/v1/auth/oauth2/google"));

        mockMvc.perform(get("/api/v1/auth/oauth2/google"))
                .andExpect(status().is3xxRedirection())
                .andExpect(header().string("Location", allOf(
                        startsWith("https://accounts.google.com/o/oauth2/v2/auth"),
                        containsString("/api/v1/auth/google/callback"),
                        containsString("state="))));
    }

    @Test
    void tc01_forgedCallbackRedirectsToErrorPage() throws Exception {
        mockMvc.perform(get("/api/v1/auth/google/callback").param("code", "gia").param("state", "gia"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("http://localhost:3000/dang-nhap?loi=GOOGLE_THAT_BAI"));
    }

    @Test
    void tc01_newGoogleUserIsActiveWithoutPassword() {
        String email = randomEmail();
        String subject = UUID.randomUUID().toString();

        var result = google.login(profile(subject, email, true, Instant.now()));

        NguoiDung user = users.findByEmail(email).orElseThrow();
        assertThat(user.getTrangThai()).isEqualTo(TrangThaiNguoiDung.HOAT_DONG);
        assertThat(user.getPasswordHash()).isNull();
        assertThat(user.getEmailXacThucAt()).isNotNull();
        assertThat(result.user().daHoanTatKhoiDau()).isFalse();
        assertThat(identityCount(subject)).isEqualTo(1);
    }

    @Test
    void tc01_sameSubjectLogsIntoSameUser() {
        GoogleProfile p = profile(UUID.randomUUID().toString(), randomEmail(), true, Instant.now());

        Long first = google.login(p).principal().id();
        Long second = google.login(p).principal().id();

        assertThat(second).isEqualTo(first);
        assertThat(identityCount(p.subject())).isEqualTo(1);
    }

    @Test
    void tc01_existingEmailIsNotAutoLinked() {
        String email = randomEmail();
        newPasswordUser(email);
        GoogleProfile p = profile(UUID.randomUUID().toString(), email, true, Instant.now());

        assertThatThrownBy(() -> google.login(p))
                .isInstanceOf(ApiException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.OAUTH_LINK_REQUIRED);
        assertThat(identityCount(p.subject())).isZero();
    }

    @Test
    void tc01_linkAfterPasswordProof() {
        String email = randomEmail();
        Long userId = newPasswordUser(email);
        GoogleProfile p = profile(UUID.randomUUID().toString(), email, true, Instant.now());

        assertThat(google.link(userId, p)).isTrue();
        assertThat(google.login(p).principal().id()).isEqualTo(userId);
    }

    @Test
    void tc01_linkRejectsOtherEmailOrExpiredProfile() {
        Long userId = newPasswordUser(randomEmail());
        GoogleProfile otherEmail = profile(UUID.randomUUID().toString(), randomEmail(), true, Instant.now());
        GoogleProfile expired = profile(UUID.randomUUID().toString(),
                users.findById(userId).orElseThrow().getEmail(), true, Instant.now().minus(Duration.ofMinutes(11)));

        assertThat(google.link(userId, otherEmail)).isFalse();
        assertThat(google.link(userId, expired)).isFalse();
        assertThat(identityCount(otherEmail.subject()) + identityCount(expired.subject())).isZero();
    }

    @Test
    void tc01_unverifiedGoogleEmailRejected() {
        GoogleProfile p = profile(UUID.randomUUID().toString(), randomEmail(), false, Instant.now());

        assertThatThrownBy(() -> google.login(p))
                .extracting("errorCode").isEqualTo(ErrorCode.EMAIL_NOT_VERIFIED);
        assertThat(users.existsByEmail(p.email())).isFalse();
    }

    @Test
    void tc01_lockedUserRejected() {
        GoogleProfile p = profile(UUID.randomUUID().toString(), randomEmail(), true, Instant.now());
        google.login(p);
        jdbc.update("UPDATE nguoi_dung SET trang_thai = 'BI_KHOA' WHERE email = ?", p.email());

        assertThatThrownBy(() -> google.login(p))
                .extracting("errorCode").isEqualTo(ErrorCode.ACCOUNT_LOCKED);
    }

    private static GoogleProfile profile(String subject, String email, boolean verified, Instant at) {
        return new GoogleProfile(subject, email, verified, "Minh Anh Google", at);
    }

    private static String randomEmail() {
        return "g" + UUID.randomUUID().toString().substring(0, 12) + "@vocab.local";
    }

    private Long newPasswordUser(String email) {
        VaiTro role = roles.findByMa(VaiTro.USER).orElseThrow();
        NguoiDung user = NguoiDung.register(email, "Minh Anh", passwordEncoder.encode("matkhau123"), "Asia/Ho_Chi_Minh", role);
        user.verifyEmail(Instant.now());
        return users.save(user).getId();
    }

    private int identityCount(String subject) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM danh_tinh_oauth WHERE nha_cung_cap = 'GOOGLE' AND subject = ?", Integer.class, subject);
        return count == null ? 0 : count;
    }
}