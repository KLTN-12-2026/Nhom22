package com.do_an_tot_nghiep.k28.notification;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR12AnnouncementTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String ADMIN_PATH = "/api/v1/admin/announcements";

    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JdbcTemplate jdbc;
    @Autowired Clock clock;

    private record Actor(Long id, Cookie session) {
    }

    @Test
    void fr12_adminManagesAnnouncementsAndLearnersSeeActiveOnes() throws Exception {
        Actor admin = actor(true);
        Actor learner = actor(false);
        String tag = UUID.randomUUID().toString();
        Instant now = clock.instant();

        mockMvc.perform(get("/api/v1/announcements")).andExpect(status().isUnauthorized());
        create(learner, body("x " + tag, "THONG_TIN", now.minus(1, ChronoUnit.HOURS), null, true))
                .andExpect(status().isForbidden());

        JsonNode info = read(create(admin, body("Info " + tag, "THONG_TIN",
                now.minus(2, ChronoUnit.HOURS), now.plus(1, ChronoUnit.DAYS), true)).andExpect(status().isCreated()));
        JsonNode urgent = read(create(admin, body("Urgent " + tag, "QUAN_TRONG",
                now.minus(3, ChronoUnit.HOURS), null, true)).andExpect(status().isCreated()));
        create(admin, body("Hidden " + tag, "QUAN_TRONG", now.minus(1, ChronoUnit.HOURS), null, false))
                .andExpect(status().isCreated());
        create(admin, body("Future " + tag, "THONG_TIN", now.plus(1, ChronoUnit.DAYS), null, true))
                .andExpect(status().isCreated());
        create(admin, body("Expired " + tag, "THONG_TIN", now.minus(3, ChronoUnit.DAYS),
                now.minus(1, ChronoUnit.DAYS), true)).andExpect(status().isCreated());

        create(admin, body("Bad " + tag, "THONG_TIN", now, now.minus(1, ChronoUnit.HOURS), true))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("ketThucAt"));
        Map<String, Object> external = body("Link " + tag, "THONG_TIN", now, null, true);
        external.put("lienKet", "https://evil.example");
        create(admin, external).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("lienKet"));

        JsonNode active = activeFor(learner, tag);
        assertThat(active.size()).isEqualTo(2);
        assertThat(active.get(0).get("tieuDe").asString()).startsWith("Urgent");
        assertThat(active.get(1).get("tieuDe").asString()).startsWith("Info");
        assertThat(active.get(0).has("version")).isFalse();

        Map<String, Object> edit = body("Info edited " + tag, "THONG_TIN",
                now.minus(2, ChronoUnit.HOURS), now.plus(1, ChronoUnit.DAYS), false);
        edit.put("version", info.get("version").asLong() + 5);
        update(admin, info.get("id").asString(), edit).andExpect(status().isConflict());
        edit.put("version", info.get("version").asLong());
        update(admin, info.get("id").asString(), edit).andExpect(status().isOk())
                .andExpect(jsonPath("$.hienThi").value(false));
        assertThat(activeFor(learner, tag).size()).isEqualTo(1);

        mockMvc.perform(delete(ADMIN_PATH + "/" + urgent.get("id").asString())
                        .cookie(admin.session()).with(xsrf()))
                .andExpect(status().isNoContent());
        assertThat(activeFor(learner, tag).size()).isZero();
        mockMvc.perform(delete(ADMIN_PATH + "/" + urgent.get("id").asString())
                        .cookie(admin.session()).with(xsrf()))
                .andExpect(status().isNotFound());

        mockMvc.perform(get(ADMIN_PATH).cookie(admin.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray());
        Long audits = jdbc.queryForObject("SELECT COUNT(*) FROM nhat_ky_quan_tri WHERE nguoi_thuc_hien_id = ? "
                + "AND loai_doi_tuong = 'THONG_BAO_HE_THONG'", Long.class, admin.id());
        assertThat(audits).isEqualTo(7);
    }

    private JsonNode activeFor(Actor actor, String tag) throws Exception {
        JsonNode all = read(mockMvc.perform(get("/api/v1/announcements").cookie(actor.session()))
                .andExpect(status().isOk()));
        var filtered = jsonMapper.createArrayNode();
        for (JsonNode item : all) {
            if (item.get("tieuDe").asString().endsWith(tag)) {
                filtered.add(item);
            }
        }
        return filtered;
    }

    private Map<String, Object> body(String tieuDe, String mucDo, Instant batDauAt, Instant ketThucAt,
                                     boolean hienThi) {
        Map<String, Object> map = new HashMap<>();
        map.put("tieuDe", tieuDe);
        map.put("noiDung", "Hệ thống bảo trì lúc 22:00");
        map.put("mucDo", mucDo);
        map.put("lienKet", "/thong-bao");
        map.put("batDauAt", batDauAt.toString());
        map.put("ketThucAt", ketThucAt == null ? null : ketThucAt.toString());
        map.put("hienThi", hienThi);
        return map;
    }

    private ResultActions create(Actor actor, Map<String, Object> body) throws Exception {
        return mockMvc.perform(post(ADMIN_PATH).cookie(actor.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private ResultActions update(Actor actor, String id, Map<String, Object> body) throws Exception {
        return mockMvc.perform(put(ADMIN_PATH + "/" + id).cookie(actor.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private JsonNode read(ResultActions actions) throws Exception {
        return jsonMapper.readTree(actions.andReturn().getResponse().getContentAsString());
    }

    private Actor actor(boolean admin) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Announcement tester", passwordEncoder.encode(PASSWORD),
                "Asia/Ho_Chi_Minh", roles.findByMa(VaiTro.USER).orElseThrow());
        if (admin) {
            user.replaceRoles(Set.of(roles.findByMa(VaiTro.USER).orElseThrow(),
                    roles.findByMa(VaiTro.ADMIN).orElseThrow()));
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
