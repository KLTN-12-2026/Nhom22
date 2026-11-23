package com.do_an_tot_nghiep.k28.admin;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.common.mail.MailRequestedEvent;
import com.do_an_tot_nghiep.k28.common.realtime.LoaiSuKien;
import com.do_an_tot_nghiep.k28.common.realtime.SuKienRealtime;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@RecordApplicationEvents
class FR13UserReportTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String REASON = "Ảnh đại diện phản cảm, vi phạm quy định";

    @Autowired
    private NguoiDungRepository users;

    @Autowired
    private VaiTroRepository roles;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbc;

    @Autowired
    private ApplicationEvents events;

    private record Actor(Long id, String email, Cookie session) {
    }

    @Test
    void fr13_reportUserValidatesReasonsAndNotifiesAdminsInRealtime() throws Exception {
        Actor target = actor(false, "Người bị báo cáo");
        Actor reporter = actor(false, "Người báo cáo");
        Actor admin = actor(true, "Quản trị");

        report(reporter, target.id(), "SAI_NOI_DUNG")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("lyDo"));
        report(reporter, reporter.id(), "SPAM").andExpect(status().isUnprocessableContent());
        report(reporter, 999_999_999L, "SPAM").andExpect(status().isNotFound());
        send(reporter, post("/api/v1/reports"), Map.of("loaiDoiTuong", "NGUOI_DUNG",
                "doiTuongId", String.valueOf(target.id()), "lyDo", "KHAC", "moTa", "ngắn"))
                .andExpect(status().isBadRequest());

        events.clear();
        String reportId = id(report(reporter, target.id(), "TEN_KHONG_PHU_HOP")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.loaiDoiTuong").value("NGUOI_DUNG"))
                .andExpect(jsonPath("$.trangThai").value("CHO_XU_LY")));
        assertThat(realtime(LoaiSuKien.BAO_CAO_MOI))
                .anySatisfy(event -> {
                    assertThat(event.phamVi()).isEqualTo(SuKienRealtime.PhamVi.QUAN_TRI);
                    assertThat(event.id()).isEqualTo("BAO_CAO:" + reportId);
                });
        report(reporter, target.id(), "SPAM").andExpect(status().isConflict());

        JsonNode item = find(body(mockMvc.perform(get("/api/v1/admin/reports").cookie(admin.session())
                        .param("loaiDoiTuong", "NGUOI_DUNG").param("size", "100"))
                .andExpect(status().isOk())), reportId);
        assertThat(item.get("noiDung").get("tenHienThi").asString()).isEqualTo("Người bị báo cáo");
        assertThat(item.get("anhDaiDienUrl").isNull()).isTrue();

        resolve(admin, reportId, "AN").andExpect(status().isUnprocessableContent());

        String deckId = deck(target);
        String deckReport = id(send(reporter, post("/api/v1/reports"), Map.of("loaiDoiTuong", "BO_THE",
                "doiTuongId", deckId, "lyDo", "SPAM")).andExpect(status().isCreated()));
        resolve(admin, deckReport, "KHOA")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("quyetDinh"));

        events.clear();
        resolve(admin, reportId, "GIU")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_GIU"));
        assertThat(notifications(reporter, "KET_QUA_BAO_CAO")).hasSize(1);
        assertThat(realtime(LoaiSuKien.THONG_BAO_MOI))
                .anySatisfy(event -> assertThat(event.nguoiDungId()).isEqualTo(reporter.id()));
    }

    @Test
    void fr13_hideAvatarFromReportShowsDefaultEverywhereUntilNewUploadOrAdminRestores() throws Exception {
        Actor target = actor(false, "Người có ảnh");
        Actor reporter = actor(false, "Người báo cáo ảnh");
        Actor admin = actor(true, "Quản trị ảnh");
        deck(target);
        Long avatar = avatar(target);

        mockMvc.perform(get("/api/v1/library/authors/" + target.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.anhDaiDienUrl").isNotEmpty());
        String reportId = id(report(reporter, target.id(), "ANH_DAI_DIEN_NHAY_CAM").andExpect(status().isCreated()));
        JsonNode item = find(body(mockMvc.perform(get("/api/v1/admin/reports").cookie(admin.session())
                        .param("loaiDoiTuong", "NGUOI_DUNG").param("trangThai", "CHO_XU_LY").param("size", "100"))
                .andExpect(status().isOk())), reportId);
        assertThat(item.get("noiDung").get("anhDaiDienId").asString()).isEqualTo(String.valueOf(avatar));
        assertThat(item.get("anhDaiDienUrl").asString()).isNotBlank();

        resolve(admin, reportId, "AN")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_AN"));

        mockMvc.perform(get("/api/v1/library/authors/" + target.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.anhDaiDienUrl").value(org.hamcrest.Matchers.nullValue()));
        mockMvc.perform(get("/api/v1/me/avatar").cookie(target.session())).andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/me").cookie(target.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.anhDaiDienBiAn").value(true));
        assertThat(notifications(target, "ANH_DAI_DIEN_BI_AN")).hasSize(1);
        assertThat(notifications(reporter, "KET_QUA_BAO_CAO").getFirst().get("noiDung").asString())
                .contains("Ảnh đại diện");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM nhat_ky_quan_tri WHERE hanh_dong = 'AN_ANH_DAI_DIEN' "
                + "AND doi_tuong_id = ?", Long.class, target.id())).isEqualTo(1L);

        mockMvc.perform(get("/api/v1/admin/users/" + target.id()).cookie(admin.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nguoiDung.anhDaiDienBiAn").value(true));
        send(admin, patch("/api/v1/admin/users/" + target.id() + "/avatar"),
                Map.of("an", false, "lyDo", "Xem lại, ảnh không vi phạm"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.anhDaiDienBiAn").value(false));
        mockMvc.perform(get("/api/v1/library/authors/" + target.id()))
                .andExpect(jsonPath("$.anhDaiDienUrl").isNotEmpty());

        send(admin, patch("/api/v1/admin/users/" + target.id() + "/avatar"), Map.of("an", true, "lyDo", REASON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.anhDaiDienBiAn").value(true));
        Long next = avatar(target);
        assertThat(next).isNotEqualTo(avatar);
        mockMvc.perform(get("/api/v1/me").cookie(target.session()))
                .andExpect(jsonPath("$.anhDaiDienBiAn").value(false));
        mockMvc.perform(get("/api/v1/library/authors/" + target.id()))
                .andExpect(jsonPath("$.anhDaiDienUrl").isNotEmpty());
    }

    @Test
    void fr13_lockFromReportHidesPublicProfileBlocksLoginEmailsAndRestoresOnUnlock() throws Exception {
        Actor target = actor(false, "Người sẽ bị khóa");
        Actor reporter = actor(false, "Người báo cáo khóa");
        Actor other = actor(false, "Người báo cáo thứ hai");
        Actor admin = actor(true, "Quản trị khóa");
        String deckId = deck(target);

        String first = id(report(reporter, target.id(), "QUAY_ROI").andExpect(status().isCreated()));
        report(other, target.id(), "SPAM").andExpect(status().isCreated());

        events.clear();
        resolve(admin, first, "KHOA")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_KHOA"));

        assertThat(jdbc.queryForObject("SELECT trang_thai FROM nguoi_dung WHERE id = ?", String.class, target.id()))
                .isEqualTo("BI_KHOA");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM bao_cao_noi_dung WHERE loai_doi_tuong = 'NGUOI_DUNG' "
                + "AND doi_tuong_id = ? AND trang_thai = 'DA_KHOA'", Long.class, target.id())).isEqualTo(2L);
        assertThat(realtime(LoaiSuKien.TAI_KHOAN_BI_KHOA))
                .anySatisfy(event -> assertThat(event.nguoiDungId()).isEqualTo(target.id()));
        assertThat(events.stream(MailRequestedEvent.class).filter(mail -> mail.to().equals(target.email())))
                .hasSize(1);
        assertThat(notifications(reporter, "KET_QUA_BAO_CAO")).hasSize(1);
        assertThat(notifications(other, "KET_QUA_BAO_CAO")).hasSize(1);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM nhat_ky_quan_tri WHERE hanh_dong = 'KHOA_TAI_KHOAN' "
                + "AND doi_tuong_id = ?", Long.class, target.id())).isEqualTo(1L);

        mockMvc.perform(get("/api/v1/me").cookie(target.session())).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", target.email(), "password", PASSWORD))))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
        mockMvc.perform(get("/api/v1/library/decks/" + deckId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.details.lyDo").value("NGUOI_DUNG_KHONG_KHA_DUNG"));
        mockMvc.perform(get("/api/v1/library/authors/" + target.id()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.details.lyDo").value("NGUOI_DUNG_KHONG_KHA_DUNG"));
        mockMvc.perform(get("/api/v1/library/decks").param("q", "Bộ của " + target.id()).param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.id == '" + deckId + "')]").isEmpty());
        mockMvc.perform(get("/api/v1/library/search").param("q", "Bộ của " + target.id()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$..[?(@.id == '" + deckId + "')]").isEmpty());
        mockMvc.perform(post("/api/v1/decks/" + deckId + "/copy").cookie(reporter.session()).with(xsrf())
                        .header("Idempotency-Key", UUID.randomUUID().toString()))
                .andExpect(status().isNotFound());
        report(reporter, target.id(), "SPAM").andExpect(status().isNotFound());

        send(admin, patch("/api/v1/admin/users/" + target.id() + "/status"),
                Map.of("trangThai", "HOAT_DONG", "lyDo", "Đã xác minh, mở khóa tài khoản"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/library/decks/" + deckId)).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/library/authors/" + target.id())).andExpect(status().isOk());
    }

    private List<SuKienRealtime> realtime(LoaiSuKien loai) {
        return events.stream(SuKienRealtime.class).filter(event -> event.loai() == loai).toList();
    }

    private List<JsonNode> notifications(Actor actor, String loai) throws Exception {
        JsonNode page = body(mockMvc.perform(get("/api/v1/notifications").cookie(actor.session()).param("size", "50"))
                .andExpect(status().isOk())).get("thongBao").get("items");
        return java.util.stream.StreamSupport.stream(page.spliterator(), false)
                .filter(node -> node.get("loai").asString().equals(loai))
                .toList();
    }

    private Long avatar(Actor owner) {
        String key = "avatars/" + UUID.randomUUID() + ".png";
        jdbc.update("INSERT INTO tep_tin (chu_so_huu_id, object_key, mime_type, kich_thuoc, checksum, loai, hoan_tat_at) "
                + "VALUES (?, ?, 'image/png', 100, ?, 'ANH', CURRENT_TIMESTAMP(3))", owner.id(), key,
                "0".repeat(64));
        Long fileId = jdbc.queryForObject("SELECT id FROM tep_tin WHERE object_key = ?", Long.class, key);
        jdbc.update("UPDATE nguoi_dung SET anh_dai_dien_id = ? WHERE id = ?", fileId, owner.id());
        return fileId;
    }

    private String deck(Actor owner) throws Exception {
        String deckId = id(send(owner, post("/api/v1/decks"), Map.of("ten", "Bộ của " + owner.id(),
                "trinhDo", "CO_BAN", "quyenTruyCap", "CONG_KHAI")).andExpect(status().isCreated()));
        send(owner, post("/api/v1/decks/" + deckId + "/cards"), Map.of("tu", "harass", "nghiaVi", "quấy rối",
                "doKho", 2)).andExpect(status().isCreated());
        return deckId;
    }

    private ResultActions report(Actor actor, Long targetId, String lyDo) throws Exception {
        return send(actor, post("/api/v1/reports"), Map.of("loaiDoiTuong", "NGUOI_DUNG",
                "doiTuongId", String.valueOf(targetId), "lyDo", lyDo));
    }

    private ResultActions resolve(Actor admin, String reportId, String quyetDinh) throws Exception {
        return send(admin, post("/api/v1/admin/reports/" + reportId + "/resolve"),
                Map.of("quyetDinh", quyetDinh, "lyDo", REASON));
    }

    private JsonNode find(JsonNode page, String id) {
        for (JsonNode item : page.get("items")) {
            if (item.get("id").asString().equals(id)) {
                return item;
            }
        }
        throw new AssertionError("Report " + id + " not found");
    }

    private ResultActions send(Actor actor, MockHttpServletRequestBuilder request, Object body) throws Exception {
        return mockMvc.perform(request.cookie(actor.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private String id(ResultActions result) throws Exception {
        return jsonMapper.readTree(result.andReturn().getResponse().getContentAsString()).get("id").asString();
    }

    private JsonNode body(ResultActions result) throws Exception {
        return jsonMapper.readTree(result.andReturn().getResponse().getContentAsString());
    }

    private Actor actor(boolean admin, String name) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, name, passwordEncoder.encode(PASSWORD),
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
        return new Actor(id, email, session);
    }
}
