package com.do_an_tot_nghiep.k28.engagement;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.engagement.service.WeeklyHonorService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.LocalDate;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR12LeaderboardTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";

    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired Clock clock;
    @Autowired JdbcTemplate jdbc;
    @Autowired WeeklyHonorService weeklyHonors;

    @Test
    void privacySettingsDefaultOnAndCanBeChanged() throws Exception {
        Learner learner = learner(false);
        mockMvc.perform(get("/api/v1/me/privacy-settings").cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.congKhaiHoatDong").value(true))
                .andExpect(jsonPath("$.thamGiaXepHang").value(true))
                .andExpect(jsonPath("$.version").value(0));
        privacy(learner, false, false, 0L)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.congKhaiHoatDong").value(false))
                .andExpect(jsonPath("$.thamGiaXepHang").value(false));
        privacy(learner, true, true, 0L).andExpect(status().isConflict());
        mockMvc.perform(get("/api/v1/me/privacy-settings")).andExpect(status().isUnauthorized());
    }

    @Test
    void publicActivityHidesPrivateMetricsAndRespectsSetting() throws Exception {
        Learner learner = learner(false);
        JsonNode open = json(mockMvc.perform(get("/api/v1/library/authors/{id}/activity", learner.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.congKhai").value(true))
                .andReturn().getResponse().getContentAsString());
        assertThat(open.get("theoNgay").size()).isGreaterThan(300);
        open.get("theoNgay").forEach(day -> {
            assertThat(day.get("soPhut").asInt()).isZero();
            assertThat(day.get("soCauLuyen").asInt()).isZero();
        });

        privacy(learner, false, true, 0L).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/library/authors/{id}/activity", learner.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.congKhai").value(false))
                .andExpect(jsonPath("$.theoNgay").isEmpty());
        mockMvc.perform(get("/api/v1/library/authors/{id}/activity", 999_999_999L))
                .andExpect(status().isNotFound());
    }

    @Test
    void leaderboardRanksByStudyDaysThenReviewsAndKeepsMeBelowTop() throws Exception {
        LocalDate today = LocalDate.ofInstant(clock.instant(), ZoneOffset.UTC);
        Learner first = learner(false);
        Learner second = learner(false);
        Learner third = learner(false);
        Learner hidden = learner(false);
        Learner admin = learner(true);
        usage(first, today, 9);
        usage(second, today, 6);
        usage(third, today, 3);
        usage(hidden, today, 40);
        usage(admin, today, 50);
        privacy(hidden, true, false, 0L).andExpect(status().isOk());

        JsonNode board = json(mockMvc.perform(get("/api/v1/leaderboard").param("gioiHan", "100").cookie(third.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ky").value("TUAN"))
                .andExpect(jsonPath("$.thamGia").value(true))
                .andExpect(jsonPath("$.luotToiThieu").value(5))
                .andReturn().getResponse().getContentAsString());
        int firstRank = rank(board, first);
        int secondRank = rank(board, second);
        int thirdRank = rank(board, third);
        assertThat(firstRank).isPositive().isLessThan(secondRank);
        assertThat(secondRank).isLessThan(thirdRank);
        assertThat(rank(board, hidden)).isZero();
        assertThat(rank(board, admin)).isZero();
        assertThat(board.get("toi").get("hang").asInt()).isEqualTo(thirdRank);
        assertThat(board.get("toi").get("laToi").asBoolean()).isTrue();
        assertThat(board.get("toi").get("soNgay").asInt()).isZero();
        assertThat(board.get("truocToi").get("hang").asInt()).isEqualTo(thirdRank - 1);

        JsonNode month = json(mockMvc.perform(get("/api/v1/leaderboard").param("ky", "THANG").param("gioiHan", "10")
                        .cookie(admin.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.thamGia").value(false))
                .andExpect(jsonPath("$.toi").isEmpty())
                .andReturn().getResponse().getContentAsString());
        assertThat(month.get("top").size()).isLessThanOrEqualTo(10);

        mockMvc.perform(get("/api/v1/leaderboard").param("gioiHan", "20").cookie(first.session()))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/leaderboard")).andExpect(status().isUnauthorized());
    }

    @Test
    void finishedWeekAwardsTopBadgesOnceAndShowsHonors() throws Exception {
        LocalDate week = LocalDate.of(2020, 1, 6);
        Learner champion = learner(false);
        Learner runnerUp = learner(false);
        Learner casual = learner(false);
        for (int i = 0; i < 3; i++) {
            usage(champion, week.plusDays(i), 8);
        }
        usage(runnerUp, week, 6);
        usage(runnerUp, week.plusDays(1), 5);
        usage(casual, week.plusDays(2), 3);
        usage(champion, week.plusDays(7), 50);

        assertThat(weeklyHonors.finalizeWeek(week)).isEqualTo(2);
        assertThat(weeklyHonors.finalizeWeek(week)).isZero();

        assertThat(badges(champion)).contains("QUAN_QUAN_TUAN", "TOP_3_TUAN", "TOP_10_TUAN");
        assertThat(badges(runnerUp)).contains("TOP_3_TUAN", "TOP_10_TUAN").doesNotContain("QUAN_QUAN_TUAN");
        assertThat(badges(casual)).doesNotContain("TOP_10_TUAN");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM thong_bao WHERE nguoi_dung_id = ? AND loai = 'VINH_DANH_TUAN'",
                Integer.class, champion.id())).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM thong_bao WHERE nguoi_dung_id = ? AND loai = 'VINH_DANH_TUAN'",
                Integer.class, casual.id())).isZero();

        mockMvc.perform(get("/api/v1/leaderboard/weekly-honors").cookie(casual.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tuanBatDau").value("2020-01-06"))
                .andExpect(jsonPath("$.tuanKetThuc").value("2020-01-12"))
                .andExpect(jsonPath("$.vinhDanh.length()").value(2))
                .andExpect(jsonPath("$.vinhDanh[0].nguoiDungId").value(champion.id().toString()))
                .andExpect(jsonPath("$.vinhDanh[0].soNgay").value(3))
                .andExpect(jsonPath("$.vinhDanh[0].soLanTop3").value(1))
                .andExpect(jsonPath("$.vinhDanh[1].hang").value(2));
        assertThat(WeeklyHonorService.lastFinishedWeek(LocalDate.of(2026, 11, 22))).isEqualTo(LocalDate.of(2026, 11, 9));
        assertThat(WeeklyHonorService.lastFinishedWeek(LocalDate.of(2026, 11, 23))).isEqualTo(LocalDate.of(2026, 11, 16));
    }

    @Test
    void leaderboardProfileShowsPublicStatsOnlyForParticipants() throws Exception {
        LocalDate today = LocalDate.ofInstant(clock.instant(), ZoneOffset.UTC);
        Learner viewer = learner(false);
        Learner learner = learner(false);
        Learner hidden = learner(false);
        Learner admin = learner(true);
        usage(learner, today.minusDays(1), 7);
        usage(learner, today, 5);
        jdbc.update("INSERT INTO bo_the (chu_so_huu_id, ten, trinh_do, quyen_truy_cap) VALUES (?, 'Bộ riêng', 'CO_BAN', 'RIENG_TU')",
                learner.id());
        Long deckId = jdbc.queryForObject("SELECT MAX(id) FROM bo_the WHERE chu_so_huu_id = ?", Long.class, learner.id());
        jdbc.update("INSERT INTO the_tu_vung (bo_the_id, tu, nghia_vi, do_kho) VALUES (?, 'apple', 'quả táo', 1), (?, 'pear', 'quả lê', 2)",
                deckId, deckId);
        privacy(hidden, true, false, 0L).andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/leaderboard/users/" + learner.id()).cookie(viewer.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(learner.id().toString()))
                .andExpect(jsonPath("$.soNgayHoc").value(2))
                .andExpect(jsonPath("$.soLuotOn").value(12))
                .andExpect(jsonPath("$.chuoiNgay").value(2))
                .andExpect(jsonPath("$.soBoThe").value(1))
                .andExpect(jsonPath("$.soBoCongKhai").value(0))
                .andExpect(jsonPath("$.soThe").value(2))
                .andExpect(jsonPath("$.soBaiLuyen").value(0))
                .andExpect(jsonPath("$.huyHieu").isArray());
        mockMvc.perform(get("/api/v1/leaderboard/users/" + hidden.id()).cookie(viewer.session()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/leaderboard/users/" + admin.id()).cookie(viewer.session()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/leaderboard/users/" + learner.id())).andExpect(status().isUnauthorized());
    }

    private java.util.List<String> badges(Learner learner) {
        return jdbc.queryForList("""
                SELECT h.ma FROM nguoi_dung_huy_hieu n JOIN huy_hieu h ON h.id = n.huy_hieu_id WHERE n.nguoi_dung_id = ?
                """, String.class, learner.id());
    }

    private int rank(JsonNode board, Learner learner) {
        for (JsonNode entry : board.get("top")) {
            if (entry.get("nguoiDungId").asString().equals(learner.id().toString())) {
                return entry.get("hang").asInt();
            }
        }
        return 0;
    }

    private org.springframework.test.web.servlet.ResultActions privacy(Learner learner, boolean congKhai, boolean xepHang, Long version)
            throws Exception {
        return mockMvc.perform(put("/api/v1/me/privacy-settings").cookie(learner.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("congKhaiHoatDong", congKhai, "thamGiaXepHang", xepHang, "version", version))));
    }

    private void usage(Learner learner, LocalDate day, int validReviews) {
        jdbc.update("INSERT INTO su_dung_hoc_ngay (nguoi_dung_id, ngay_dia_phuong, so_the_moi, so_luot_hop_le) VALUES (?, ?, 0, ?)",
                learner.id(), day, validReviews);
    }

    private JsonNode json(String body) {
        return jsonMapper.readTree(body);
    }

    private Learner learner(boolean admin) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Xếp hạng " + email.substring(0, 6), passwords.encode(PASSWORD), "UTC",
                roles.findByMa(VaiTro.USER).orElseThrow());
        if (admin) {
            user.replaceRoles(Set.of(roles.findByMa(VaiTro.USER).orElseThrow(), roles.findByMa(VaiTro.ADMIN).orElseThrow()));
        }
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
