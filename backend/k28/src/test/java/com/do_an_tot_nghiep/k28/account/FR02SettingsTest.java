package com.do_an_tot_nghiep.k28.account;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

class FR02SettingsTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";

    @Autowired
    NguoiDungRepository users;

    @Autowired
    VaiTroRepository roles;

    @Autowired
    PasswordEncoder passwordEncoder;

    Cookie session;

    @BeforeEach
    void loginNewUser() throws Exception {
        String email = "s" + UUID.randomUUID().toString().substring(0, 12) + "@vocab.local";
        VaiTro role = roles.findByMa(VaiTro.USER).orElseThrow();
        NguoiDung user = NguoiDung.register(email, "Minh Anh", passwordEncoder.encode(PASSWORD), "Asia/Ho_Chi_Minh", role);
        user.verifyEmail(Instant.now());
        users.save(user);
        session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
    }

    @Test
    void fr02_learningDefaultsThenOnboardingDone() throws Exception {
        mockMvc.perform(get("/api/v1/me/learning-settings").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.phutMoiNgay").value(10))
                .andExpect(jsonPath("$.tuMoiMoiNgay").value(10))
                .andExpect(jsonPath("$.daHoanTatKhoiDau").value(false))
                .andExpect(jsonPath("$.version").value(0));

        send(put("/api/v1/me/learning-settings"), learning(15, 20, 0))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trinhDo").value("CO_BAN"))
                .andExpect(jsonPath("$.mucTieu").value("TOEIC"))
                .andExpect(jsonPath("$.phutMoiNgay").value(15))
                .andExpect(jsonPath("$.tuMoiMoiNgay").value(20))
                .andExpect(jsonPath("$.daHoanTatKhoiDau").value(true))
                .andExpect(jsonPath("$.version").value(1));

        mockMvc.perform(get("/api/v1/me").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.daHoanTatKhoiDau").value(true));
    }

    @Test
    void fr02_staleVersionReturns409() throws Exception {
        mockMvc.perform(get("/api/v1/me/learning-settings").cookie(session)).andExpect(status().isOk());
        send(put("/api/v1/me/learning-settings"), learning(15, 20, 0)).andExpect(status().isOk());

        send(put("/api/v1/me/learning-settings"), learning(30, 5, 0))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VERSION_CONFLICT"));
    }

    @Test
    void fr02_learningLimitsValidated() throws Exception {
        send(put("/api/v1/me/learning-settings"), learning(0, 101, 0))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'phutMoiNgay')]").exists())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'tuMoiMoiNgay')]").exists());

        Map<String, Object> missing = learning(15, 20, 0);
        missing.remove("mucTieu");
        send(put("/api/v1/me/learning-settings"), missing)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'mucTieu')]").exists());
    }

    @Test
    void fr02_updateProfileNameAndTimeZone() throws Exception {
        send(patch("/api/v1/me"), Map.of("tenHienThi", "  Minh Anh mới  ", "muiGio", "Asia/Tokyo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tenHienThi").value("Minh Anh mới"))
                .andExpect(jsonPath("$.muiGio").value("Asia/Tokyo"));

        send(patch("/api/v1/me"), Map.of())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tenHienThi").value("Minh Anh mới"))
                .andExpect(jsonPath("$.muiGio").value("Asia/Tokyo"));
    }

    @Test
    void fr02_invalidProfileRejected() throws Exception {
        send(patch("/api/v1/me"), Map.of("muiGio", "+07:00"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'muiGio')]").exists());

        send(patch("/api/v1/me"), Map.of("muiGio", "Mars/Olympus"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'muiGio')]").exists());

        send(patch("/api/v1/me"), Map.of("tenHienThi", "   "))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'tenHienThi')]").exists());

        send(patch("/api/v1/me"), Map.of("tenHienThi", "a".repeat(101)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'tenHienThi')]").exists());
    }

    @Test
    void fr02_notificationSettingsAndReminderTime() throws Exception {
        mockMvc.perform(get("/api/v1/me/notification-settings").cookie(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nhanTrongUngDung").value(true))
                .andExpect(jsonPath("$.nhanEmail").value(true))
                .andExpect(jsonPath("$.nhacHoc").value(true))
                .andExpect(jsonPath("$.version").value(0));

        send(put("/api/v1/me/notification-settings"), notification(true, null, 0))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'gioNhac')]").exists());

        send(put("/api/v1/me/notification-settings"), notification(true, "20:30", 0))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nhacHoc").value(true))
                .andExpect(jsonPath("$.nhanEmail").value(false))
                .andExpect(jsonPath("$.gioNhac").value("20:30"))
                .andExpect(jsonPath("$.version").value(1));

        send(put("/api/v1/me/notification-settings"), notification(false, null, 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nhacHoc").value(false))
                .andExpect(jsonPath("$.version").value(2));
    }

    @Test
    void fr02_settingsRequireLogin() throws Exception {
        mockMvc.perform(get("/api/v1/me/learning-settings"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"));
        mockMvc.perform(patch("/api/v1/me").with(xsrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("tenHienThi", "Ai đó"))))
                .andExpect(status().isUnauthorized());
    }

    private ResultActions send(MockHttpServletRequestBuilder request, Map<String, ?> body) throws Exception {
        return mockMvc.perform(request.cookie(session).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(body)));
    }

    private static Map<String, Object> learning(int phut, int tuMoi, long version) {
        Map<String, Object> body = new HashMap<>();
        body.put("trinhDo", "CO_BAN");
        body.put("mucTieu", "TOEIC");
        body.put("phutMoiNgay", phut);
        body.put("tuMoiMoiNgay", tuMoi);
        body.put("version", version);
        body.put("chuDeIds", java.util.List.of());
        return body;
    }

    private static Map<String, Object> notification(boolean nhacHoc, String gioNhac, long version) {
        Map<String, Object> body = new HashMap<>();
        body.put("nhanTrongUngDung", true);
        body.put("nhanEmail", false);
        body.put("nhacHoc", nhacHoc);
        body.put("gioNhac", gioNhac);
        body.put("version", version);
        return body;
    }
}
