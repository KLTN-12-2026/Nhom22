package com.do_an_tot_nghiep.k28.engagement;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.JsonNode;

class AdminMotivationTest extends AbstractIntegrationTest {

    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired JdbcTemplate jdbc;

    @AfterEach
    void cleanDefinitions() {
        jdbc.update("DELETE p FROM tien_do_thu_thach p JOIN thu_thach c ON c.id = p.thu_thach_id WHERE c.ma LIKE 'QA_MOT_%'");
        jdbc.update("DELETE e FROM nguoi_dung_huy_hieu e JOIN huy_hieu b ON b.id = e.huy_hieu_id WHERE b.ma LIKE 'QA_MOT_%'");
        jdbc.update("DELETE FROM thu_thach WHERE ma LIKE 'QA_MOT_%'");
        jdbc.update("DELETE FROM huy_hieu WHERE ma LIKE 'QA_MOT_%'");
    }

    @Test
    void endpointsRequireAdminAndCsrf() throws Exception {
        Actor user = actor(false), admin = actor(true);
        for (String path : new String[]{"/api/v1/admin/badges", "/api/v1/admin/challenges"}) {
            mockMvc.perform(get(path)).andExpect(status().isUnauthorized());
            mockMvc.perform(get(path).cookie(user.session())).andExpect(status().isForbidden());
            mockMvc.perform(post(path).cookie(user.session()).with(xsrf())
                            .contentType(MediaType.APPLICATION_JSON).content(toJson(badge())))
                    .andExpect(status().isForbidden());
            mockMvc.perform(put(path + "/1").cookie(user.session()).with(xsrf())
                            .contentType(MediaType.APPLICATION_JSON).content(toJson(badge())))
                    .andExpect(status().isForbidden());
            mockMvc.perform(post(path).cookie(admin.session())
                            .contentType(MediaType.APPLICATION_JSON).content(toJson(badge())))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get(path).cookie(admin.session())).andExpect(status().isOk())
                    .andExpect(jsonPath("$.page").value(0)).andExpect(jsonPath("$.size").value(20));
            mockMvc.perform(get(path).cookie(admin.session()).param("size", "101"))
                    .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors[0].field").value("size"));
            mockMvc.perform(get(path).cookie(admin.session()).param("page", "-1"))
                    .andExpect(status().isBadRequest());
        }
    }

    @Test
    void badgeCreateUpdateConflictAuditAndExistingAwardsRemainIntact() throws Exception {
        Actor admin = actor(true), learner = actor(false);
        Map<String, Object> body = badge();
        JsonNode created = create(admin, "badges", body);
        String id = created.get("id").asString();
        assertThat(created.get("version").asLong()).isZero();
        jdbc.update("INSERT INTO nguoi_dung_huy_hieu (nguoi_dung_id, huy_hieu_id, nhan_at, created_at, updated_at) "
                + "VALUES (?, ?, NOW(3), NOW(3), NOW(3))", learner.id(), id);
        Instant awarded = jdbc.queryForObject("SELECT nhan_at FROM nguoi_dung_huy_hieu WHERE huy_hieu_id = ?", java.sql.Timestamp.class, id).toInstant();
        int ledgerBefore = jdbc.queryForObject("SELECT COUNT(*) FROM so_diem_thuong", Integer.class);

        write(admin, "badges", null, body).andExpect(status().isConflict())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("ma"));
        body.put("ten", "Tên sau khi sửa"); body.put("nguong", 9); body.put("hoatDong", false); body.put("version", 0);
        write(admin, "badges", id, body).andExpect(status().isOk()).andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.hoatDong").value(false)).andExpect(jsonPath("$.nguong").value(9));
        write(admin, "badges", id, body).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("VERSION_CONFLICT"));
        body.put("version", 1);body.put("ma", "QA_MOT_DIFFERENT");
        write(admin, "badges", id, body).andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("ma"));
        assertThat(jdbc.queryForObject("SELECT nhan_at FROM nguoi_dung_huy_hieu WHERE huy_hieu_id = ?", java.sql.Timestamp.class, id).toInstant()).isEqualTo(awarded);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM so_diem_thuong", Integer.class)).isEqualTo(ledgerBefore);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM nhat_ky_quan_tri WHERE loai_doi_tuong='HUY_HIEU' AND doi_tuong_id=?", Integer.class, id)).isEqualTo(2);
        assertThat(jdbc.queryForObject("SELECT truoc_json FROM nhat_ky_quan_tri WHERE hanh_dong='SUA_HUY_HIEU' AND doi_tuong_id=?", String.class, id)).contains("hoatDong", "true");
        mockMvc.perform(get("/api/v1/admin/badges").cookie(admin.session()).param("size", "1"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.totalPages").isNumber());
    }

    @Test
    void challengeGoalCanChangeUntilParticipationThenMetadataTogglePreservesProgress() throws Exception {
        Actor admin = actor(true), learner = actor(false);
        Map<String, Object> body = challenge();
        JsonNode created = create(admin, "challenges", body);
        String id = created.get("id").asString();
        write(admin, "challenges", null, body).andExpect(status().isConflict());
        body.put("mucTieu", 50); body.put("version", 0);
        write(admin, "challenges", id, body).andExpect(status().isOk()).andExpect(jsonPath("$.mucTieu").value(50))
                .andExpect(jsonPath("$.version").value(1));
        jdbc.update("INSERT INTO tien_do_thu_thach (nguoi_dung_id, thu_thach_id, tuan_bat_dau, gia_tri, hoan_thanh_at, created_at, updated_at) "
                + "VALUES (?, ?, '2026-11-16', 50, '2026-11-17 12:00:00', NOW(3), NOW(3))", learner.id(), id);
        body.put("mucTieu", 60);body.put("version", 1);
        write(admin, "challenges", id, body).andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("mucTieu"));
        body.put("mucTieu", 50);body.put("ten", "Thử thách đã chỉnh sửa");body.put("hoatDong", false);
        write(admin, "challenges", id, body).andExpect(status().isOk()).andExpect(jsonPath("$.version").value(2))
                .andExpect(jsonPath("$.hoatDong").value(false));
        write(admin, "challenges", id, body).andExpect(status().isConflict());
        assertThat(jdbc.queryForObject("SELECT gia_tri FROM tien_do_thu_thach WHERE thu_thach_id=?", Integer.class, id)).isEqualTo(50);
        assertThat(jdbc.queryForObject("SELECT hoan_thanh_at FROM tien_do_thu_thach WHERE thu_thach_id=?", java.sql.Timestamp.class, id).toLocalDateTime().toString()).isEqualTo("2026-11-17T12:00");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM nhat_ky_quan_tri WHERE loai_doi_tuong='THU_THACH' AND doi_tuong_id=?", Integer.class, id)).isEqualTo(3);
    }

    @Test
    void validatesFieldsEnumsMissingVersionAndNotFound() throws Exception {
        Actor admin = actor(true);
        Map<String, Object> body = badge();
        body.put("ma", "bad code");body.put("ten", " ");body.put("moTa", "x".repeat(256));body.put("nguong", 0);body.put("thuTu", -1);
        write(admin, "badges", null, body).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'ma')]").exists())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'ten')]").exists())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'moTa')]").exists())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'nguong')]").exists());
        body = badge();JsonNode created = create(admin, "badges", body);
        write(admin, "badges", created.get("id").asString(), body).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("version"));
        body.put("version", 0);
        write(admin, "badges", "9223372036854775807", body).andExpect(status().isNotFound());
        body.put("loaiDieuKien", "INVALID");
        write(admin, "badges", null, body).andExpect(status().isBadRequest());
        body = challenge();body.put("mucTieu", 0);
        write(admin, "challenges", null, body).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[?(@.field == 'mucTieu')]").exists());
        body.put("mucTieu", 40);body.put("chuKy", "THANG");
        write(admin, "challenges", null, body).andExpect(status().isBadRequest());
    }

    private Map<String, Object> badge() {
        return new LinkedHashMap<>(Map.of("ma", code(), "ten", "Huy hiệu kiểm thử", "moTa", "Ghi nhận sự kiên trì",
                "loaiDieuKien", "TONG_LUOT_ON", "nguong", 3, "thuTu", 99, "hoatDong", true));
    }

    private Map<String, Object> challenge() {
        return new LinkedHashMap<>(Map.of("ma", code(), "ten", "Thử thách kiểm thử", "moTa", "Ôn tập đều đặn",
                "loaiDieuKien", "LUOT_ON", "chuKy", "TUAN", "mucTieu", 40, "hoatDong", true));
    }

    private String code() { return "QA_MOT_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16).toUpperCase(); }

    private JsonNode create(Actor admin, String type, Map<String, Object> body) throws Exception {
        return jsonMapper.readTree(write(admin, type, null, body).andExpect(status().isCreated())
                .andExpect(header().exists("Location")).andReturn().getResponse().getContentAsString());
    }

    private ResultActions write(Actor admin, String type, String id, Map<String, Object> body) throws Exception {
        String path = "/api/v1/admin/" + type;
        return mockMvc.perform((id == null ? post(path) : put(path + "/" + id)).cookie(admin.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private Actor actor(boolean admin) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Motivation tester", passwords.encode("matkhau123"),
                "Asia/Ho_Chi_Minh", roles.findByMa("USER").orElseThrow());
        if (admin) user.replaceRoles(Set.of(roles.findByMa("USER").orElseThrow(), roles.findByMa("ADMIN").orElseThrow()));
        user.verifyEmail(Instant.now());
        Long id = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("email", email, "password", "matkhau123"))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        return new Actor(id, session);
    }

    private record Actor(Long id, Cookie session) {}
}
