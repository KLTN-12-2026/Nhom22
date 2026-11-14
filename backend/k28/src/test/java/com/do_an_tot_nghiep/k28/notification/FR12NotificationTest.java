package com.do_an_tot_nghiep.k28.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.account.dto.NotificationSettingsRequest;
import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.account.service.SettingsService;
import com.do_an_tot_nghiep.k28.common.mail.MailService;
import com.do_an_tot_nghiep.k28.notification.service.ReminderService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalTime;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.ResultActions;

class FR12NotificationTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String HCM = "Asia/Ho_Chi_Minh";
    private static final Instant MORNING_HCM = Instant.parse("2030-01-15T02:00:00Z");

    @Autowired
    NguoiDungRepository users;
    @Autowired
    VaiTroRepository roles;
    @Autowired
    PasswordEncoder passwords;
    @Autowired
    Clock clock;
    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    ReminderService reminderService;
    @MockitoBean
    MailService mail;
    @Autowired
    SettingsService settingsService;

    @Test
    void tc15_rerunningReminderJobCreatesOneNotificationAndOneEmail() throws Exception {
        Learner learner = learner(HCM);
        settings(learner, true, true, true, "08:00");
        reminderService.run(MORNING_HCM);
        reminderService.run(MORNING_HCM.plusSeconds(900));
        reminderService.run(MORNING_HCM.plusSeconds(3600));

        assertThat(count(learner)).isEqualTo(1);
        verify(mail, times(1)).send(eq(learner.email()), anyString(), anyString());
        mockMvc.perform(get("/api/v1/notifications").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuaDoc").value(1))
                .andExpect(jsonPath("$.thongBao.totalElements").value(1))
                .andExpect(jsonPath("$.thongBao.items[0].id").isString())
                .andExpect(jsonPath("$.thongBao.items[0].loai").value("NHAC_HOC"))
                .andExpect(jsonPath("$.thongBao.items[0].lienKet").value("/hom-nay"))
                .andExpect(jsonPath("$.thongBao.items[0].ngayDiaPhuong").value("2030-01-15"))
                .andExpect(jsonPath("$.thongBao.items[0].daDocAt").doesNotExist());

        reminderService.run(MORNING_HCM.plusSeconds(86_400));
        assertThat(count(learner)).isEqualTo(2);
        verify(mail, times(2)).send(eq(learner.email()), anyString(), anyString());
    }

    @Test
    void tc15_skipsBeforeReminderTimeAfterGoalOrWhenDisabled() throws Exception {
        Learner early = learner(HCM);
        settings(early, true, true, true, "10:00");
        Learner studied = learner(HCM);
        settings(studied, true, true, true, "08:00");
        jdbc.update("INSERT INTO su_dung_hoc_ngay (nguoi_dung_id, ngay_dia_phuong, so_luot_hop_le) VALUES (?, '2030-01-15', 5)",
                studied.id());
        Learner off = learner(HCM);
        settings(off, false, true, true, "08:00");
        Learner deleting = learner(HCM);
        settings(deleting, true, true, true, "08:00");
        jdbc.update("UPDATE nguoi_dung SET trang_thai = 'DANG_XOA' WHERE id = ?", deleting.id());

        reminderService.run(MORNING_HCM);

        for (Learner learner : new Learner[]{early, studied, off, deleting}) {
            assertThat(count(learner)).isZero();
            verify(mail, never()).send(eq(learner.email()), anyString(), anyString());
        }
    }

    @Test
    void tc15_respectsChannelsAndLocalTimezone() throws Exception {
        Learner emailOnly = learner(HCM);
        settings(emailOnly, true, false, true, "08:00");
        Learner inAppOnly = learner(HCM);
        settings(inAppOnly, true, true, false, "08:00");
        Learner newYork = learner("America/New_York");
        settings(newYork, true, true, false, "20:00");

        reminderService.run(MORNING_HCM);

        verify(mail, times(1)).send(eq(emailOnly.email()), anyString(), anyString());
        verify(mail, never()).send(eq(inAppOnly.email()), anyString(), anyString());
        assertThat(count(emailOnly)).isEqualTo(1);
        mockMvc.perform(get("/api/v1/notifications").cookie(emailOnly.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuaDoc").value(0))
                .andExpect(jsonPath("$.thongBao.items.length()").value(0));
        assertThat(count(inAppOnly)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT ngay_dia_phuong FROM thong_bao WHERE nguoi_dung_id = ?",
                String.class, newYork.id())).isEqualTo("2030-01-14");
    }

    @Test
    void fr12_markReadOwnNotificationOnly() throws Exception {
        Learner owner = learner(HCM);
        settings(owner, true, true, false, "08:00");
        Learner other = learner(HCM);
        reminderService.run(MORNING_HCM);
        String id = jdbc.queryForObject("SELECT id FROM thong_bao WHERE nguoi_dung_id = ?", String.class, owner.id());

        mockMvc.perform(get("/api/v1/notifications")).andExpect(status().isUnauthorized());
        markRead(other.session(), id, Map.of("daDoc", true)).andExpect(status().isNotFound());
        markRead(owner.session(), id, Map.of()).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'daDoc')]").exists());
        markRead(owner.session(), id, Map.of("daDoc", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.daDocAt").isString());
        mockMvc.perform(get("/api/v1/notifications").param("chuaDoc", "true").cookie(owner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuaDoc").value(0))
                .andExpect(jsonPath("$.thongBao.items.length()").value(0));
        markRead(owner.session(), id, Map.of("daDoc", false))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.daDocAt").doesNotExist());
        mockMvc.perform(get("/api/v1/notifications").param("size", "0").cookie(owner.session()))
                .andExpect(status().isBadRequest());
    }

    private ResultActions markRead(Cookie session, String id, Object body)
            throws Exception {
        return mockMvc.perform(patch("/api/v1/notifications/" + id).cookie(session).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private void settings(Learner learner, boolean nhacHoc, boolean trongUngDung, boolean email, String gio) {
        long version = settingsService.notification(learner.id()).version();
        settingsService.updateNotification(learner.id(), new NotificationSettingsRequest(
                trongUngDung, email, nhacHoc, LocalTime.parse(gio), version));
    }

    private int count(Learner learner) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM thong_bao WHERE nguoi_dung_id = ?", Integer.class,
                learner.id());
    }

    private Learner learner(String zone) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Reminder <tester>", passwords.encode(PASSWORD),
                zone, roles.findByMa("USER").orElseThrow());
        user.verifyEmail(clock.instant());
        Long userId = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return new Learner(userId, email, session);
    }

    private record Learner(Long id, String email, Cookie session) {
    }
}
