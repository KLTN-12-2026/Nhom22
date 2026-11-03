package com.do_an_tot_nghiep.k28.admin;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR13AdminTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String REASON = "Vi phạm quy định nội dung nhiều lần";

    @Autowired
    private NguoiDungRepository users;

    @Autowired
    private VaiTroRepository roles;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbc;

    private record Actor(Long id, String email, Cookie session) {
    }

    @Test
    void fr13_adminEndpointsRequireAdminRole() throws Exception {
        Actor learner = actor(false);
        Actor admin = actor(true);

        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/admin/audit-logs").cookie(learner.session()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/decks").cookie(learner.session()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/users").cookie(admin.session())
                        .param("q", learner.email()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(String.valueOf(learner.id())))
                .andExpect(jsonPath("$.items[0].soBoThe").value(0))
                .andExpect(jsonPath("$.items[0].dangNhapCuoiAt").isNotEmpty())
                .andExpect(jsonPath("$.items[0].soPhienDaHuy").doesNotExist());
        mockMvc.perform(get("/api/v1/admin/users").cookie(admin.session()).param("q", "library-editor@vocab.local"))
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void fr13_lockRevokesSessionsBlocksLoginAndUnlockRestores() throws Exception {
        Actor admin = actor(true);
        Actor learner = actor(false);
        long before = auditCount(learner.id());

        changeStatus(admin, learner.id(), "BI_KHOA", REASON)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("BI_KHOA"))
                .andExpect(jsonPath("$.soPhienDaHuy").value(1));
        mockMvc.perform(get("/api/v1/me").cookie(learner.session()))
                .andExpect(status().isUnauthorized());
        login(learner.email()).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));

        changeStatus(admin, learner.id(), "BI_KHOA", REASON)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soPhienDaHuy").value(0));
        assertThat(auditCount(learner.id())).isEqualTo(before + 1);

        changeStatus(admin, learner.id(), "HOAT_DONG", "Đã xác minh và mở lại tài khoản")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("HOAT_DONG"));
        login(learner.email()).andExpect(status().isOk());

        JsonNode logs = body(mockMvc.perform(get("/api/v1/admin/audit-logs").cookie(admin.session())
                        .param("loai", "NGUOI_DUNG").param("q", REASON))
                .andExpect(status().isOk()).andReturn());
        JsonNode lock = find(logs, learner.id(), "KHOA_TAI_KHOAN");
        assertThat(lock.get("nguoiThucHien").get("id").asText()).isEqualTo(String.valueOf(admin.id()));
        assertThat(lock.get("lyDo").asText()).isEqualTo(REASON);
        assertThat(lock.get("truoc").get("trangThai").asText()).isEqualTo("HOAT_DONG");
        assertThat(lock.get("sau").get("trangThai").asText()).isEqualTo("BI_KHOA");
        assertThat(lock.get("createdAt").asText()).isNotBlank();
        String raw = jdbc.queryForObject(
                "SELECT CONCAT(ten_doi_tuong, COALESCE(truoc_json, ''), COALESCE(sau_json, '')) FROM nhat_ky_quan_tri "
                        + "WHERE doi_tuong_id = ? AND hanh_dong = 'KHOA_TAI_KHOAN'", String.class, learner.id());
        assertThat(raw).doesNotContain(learner.email()).doesNotContain("password").doesNotContain("$2a$");
    }

    @Test
    void fr13_statusRulesRejectInvalidTransitions() throws Exception {
        Actor admin = actor(true);
        Actor learner = actor(false);
        NguoiDung unverified = users.saveAndFlush(NguoiDung.register(UUID.randomUUID() + "@test.local", "Chưa xác thực",
                passwordEncoder.encode(PASSWORD), "Asia/Ho_Chi_Minh", roles.findByMa(VaiTro.USER).orElseThrow()));

        changeStatus(admin, admin.id(), "BI_KHOA", REASON).andExpect(status().isUnprocessableContent());
        changeStatus(admin, unverified.getId(), "HOAT_DONG", REASON).andExpect(status().isUnprocessableContent());
        changeStatus(admin, unverified.getId(), "BI_KHOA", REASON).andExpect(status().isUnprocessableContent());
        changeStatus(admin, learner.id(), "DANG_XOA", REASON)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("trangThai"));
        changeStatus(admin, learner.id(), "BI_KHOA", "ngắn")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("lyDo"));
        changeStatus(admin, Long.MAX_VALUE, "BI_KHOA", REASON).andExpect(status().isNotFound());
        assertThat(auditCount(learner.id())).isZero();
    }

    @Test
    void tc17_lastActiveAdminCannotDropOwnRoleOrLockSelf() throws Exception {
        Actor admin = actor(true);
        onlyAdmins(admin.id());

        roles(admin, admin.id(), List.of("USER"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("BUSINESS_RULE"));
        changeStatus(admin, admin.id(), "BI_KHOA", REASON).andExpect(status().isUnprocessableContent());
        assertThat(auditCount(admin.id())).isZero();
        mockMvc.perform(get("/api/v1/admin/users").cookie(admin.session()))
                .andExpect(status().isOk());
    }

    @Test
    void tc17_twoAdminsRevokingEachOtherConcurrentlyLeavesOneAdmin() throws Exception {
        Actor first = actor(true);
        Actor second = actor(true);
        onlyAdmins(first.id(), second.id());

        CountDownLatch start = new CountDownLatch(1);
        List<Integer> statuses;
        try (var pool = Executors.newFixedThreadPool(2)) {
            Callable<Integer> firstTask = () -> {
                start.await();
                return roles(first, second.id(), List.of("USER")).andReturn().getResponse().getStatus();
            };
            Callable<Integer> secondTask = () -> {
                start.await();
                return roles(second, first.id(), List.of("USER")).andReturn().getResponse().getStatus();
            };
            Future<Integer> a = pool.submit(firstTask);
            Future<Integer> b = pool.submit(secondTask);
            start.countDown();
            statuses = List.of(a.get(), b.get());
        }

        assertThat(statuses).containsExactlyInAnyOrder(200, 422);
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM nguoi_dung u
                JOIN nguoi_dung_vai_tro ur ON ur.nguoi_dung_id = u.id
                JOIN vai_tro r ON r.id = ur.vai_tro_id
                WHERE r.ma = 'ADMIN' AND u.trang_thai = 'HOAT_DONG'
                """, Long.class)).isEqualTo(1L);
    }

    @Test
    void fr13_roleChangesTakeEffectImmediately() throws Exception {
        Actor admin = actor(true);
        Actor learner = actor(false);

        roles(admin, learner.id(), List.of("USER", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.vaiTro.length()").value(2))
                .andExpect(jsonPath("$.soPhienDaHuy").value(1))
                .andExpect(jsonPath("$.banThanMatQuyen").value(false));
        mockMvc.perform(get("/api/v1/me").cookie(learner.session()))
                .andExpect(status().isUnauthorized());
        Cookie promoted = session(learner.email());
        mockMvc.perform(get("/api/v1/admin/users").cookie(promoted)).andExpect(status().isOk());

        roles(new Actor(learner.id(), learner.email(), promoted), learner.id(), List.of("USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.banThanMatQuyen").value(true));
        mockMvc.perform(get("/api/v1/admin/users").cookie(promoted)).andExpect(status().isUnauthorized());
        Cookie demoted = session(learner.email());
        mockMvc.perform(get("/api/v1/admin/users").cookie(demoted)).andExpect(status().isForbidden());

        roles(admin, learner.id(), List.of("ADMIN")).andExpect(status().isBadRequest());
        changeStatus(admin, learner.id(), "BI_KHOA", REASON).andExpect(status().isOk());
        roles(admin, learner.id(), List.of("USER", "ADMIN")).andExpect(status().isUnprocessableContent());

        JsonNode logs = body(mockMvc.perform(get("/api/v1/admin/audit-logs").cookie(admin.session())
                .param("loai", "NGUOI_DUNG").param("size", "100")).andReturn());
        JsonNode grant = find(logs, learner.id(), "CAP_QUYEN_QUAN_TRI");
        assertThat(grant.get("sau").get("vaiTro").toString()).isEqualTo("[\"ADMIN\",\"USER\"]");
        JsonNode revoke = find(logs, learner.id(), "THU_QUYEN_QUAN_TRI");
        assertThat(revoke.get("nguoiThucHien").get("id").asText()).isEqualTo(String.valueOf(learner.id()));
    }

    @Test
    void fr13_sampleDeckLifecycleIsReflectedInLibraryAndKeepsCopies() throws Exception {
        Actor admin = actor(true);
        Actor learner = actor(false);
        String name = "Bộ mẫu " + UUID.randomUUID();

        JsonNode deck = body(send(admin, post("/api/v1/admin/decks"), Map.of(
                "ten", name, "trinhDo", "CO_BAN", "mucTieu", "TOEIC"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.quyenTruyCap").value("RIENG_TU"))
                .andExpect(jsonPath("$.soThe").value(0))
                .andReturn());
        String id = deck.get("id").asText();
        mockMvc.perform(get("/api/v1/library/decks/" + id)).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/decks").cookie(admin.session()))
                .andExpect(jsonPath("$.totalElements").value(0));

        send(admin, patch("/api/v1/admin/decks/" + id), Map.of("quyenTruyCap", "CONG_KHAI", "version", 0))
                .andExpect(status().isUnprocessableContent());

        JsonNode card = body(send(admin, post("/api/v1/admin/decks/" + id + "/cards"),
                Map.of("tu", "invoice", "nghiaVi", "hóa đơn"))
                .andExpect(status().isCreated()).andReturn());
        send(admin, patch("/api/v1/admin/decks/" + id), Map.of("quyenTruyCap", "CONG_KHAI", "version", 0))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.soThe").value(1));
        mockMvc.perform(get("/api/v1/library/decks/" + id)).andExpect(status().isOk());
        send(admin, patch("/api/v1/admin/decks/" + id), Map.of("ten", "Tên cũ", "version", 0))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VERSION_CONFLICT"));

        String copyId = body(mockMvc.perform(post("/api/v1/decks/" + id + "/copy").cookie(learner.session())
                        .with(xsrf()).header("Idempotency-Key", UUID.randomUUID().toString()))
                .andExpect(status().isCreated()).andReturn()).get("id").asText();
        mockMvc.perform(get("/api/v1/admin/decks/" + id).cookie(admin.session()))
                .andExpect(jsonPath("$.soBanSao").value(1));

        send(admin, patch("/api/v1/admin/decks/" + id), Map.of("trangThaiKiemDuyet", "DA_AN", "version", 1))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("lyDo"));
        send(admin, patch("/api/v1/admin/decks/" + id), Map.of(
                "trangThaiKiemDuyet", "DA_AN", "version", 1, "lyDo", "Nội dung cần rà soát lại nguồn"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/library/decks/" + id)).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/decks/" + copyId).cookie(learner.session())).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/admin/decks").cookie(admin.session()).param("trangThai", "DA_AN").param("q", name))
                .andExpect(jsonPath("$.totalElements").value(1));

        mockMvc.perform(delete("/api/v1/admin/cards/" + card.get("id").asText()).cookie(admin.session()).with(xsrf())
                        .param("version", "0"))
                .andExpect(status().isUnprocessableContent());
        send(admin, patch("/api/v1/admin/cards/" + card.get("id").asText()),
                Map.of("nghiaVi", "hóa đơn thanh toán", "version", 0))
                .andExpect(status().isOk());

        send(admin, delete("/api/v1/admin/decks/" + id), Map.of("version", 2, "lyDo", "Bộ trùng với bộ mẫu khác"))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/admin/decks/" + id).cookie(admin.session())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/decks/" + copyId).cookie(learner.session())).andExpect(status().isOk());

        List<String> actions = jdbc.queryForList(
                "SELECT hanh_dong FROM nhat_ky_quan_tri WHERE nguoi_thuc_hien_id = ? ORDER BY id", String.class, admin.id());
        assertThat(actions).containsExactly("TAO_BO_MAU", "TAO_THE_MAU", "XUAT_BAN_BO_MAU", "AN_BO_MAU",
                "SUA_THE_MAU", "XOA_BO_MAU");
        String cardAudit = jdbc.queryForObject(
                "SELECT CONCAT(truoc_json, sau_json) FROM nhat_ky_quan_tri WHERE hanh_dong = 'SUA_THE_MAU' AND nguoi_thuc_hien_id = ?",
                String.class, admin.id());
        assertThat(cardAudit).contains("nghiaVi").doesNotContain("\"tu\"");
    }

    @Test
    void tc17_adminCannotReadOrEditLearnerDecks() throws Exception {
        Actor admin = actor(true);
        Actor learner = actor(false);
        String deckId = body(send(learner, post("/api/v1/decks"), Map.of("ten", "Bộ riêng", "trinhDo", "CO_BAN"))
                .andExpect(status().isCreated()).andReturn()).get("id").asText();
        String cardId = body(send(learner, post("/api/v1/decks/" + deckId + "/cards"),
                Map.of("tu", "secret", "nghiaVi", "bí mật"))
                .andExpect(status().isCreated()).andReturn()).get("id").asText();

        mockMvc.perform(get("/api/v1/admin/decks/" + deckId).cookie(admin.session())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/admin/decks/" + deckId + "/cards").cookie(admin.session()))
                .andExpect(status().isNotFound());
        send(admin, patch("/api/v1/admin/decks/" + deckId), Map.of("ten", "Đổi", "version", 0))
                .andExpect(status().isNotFound());
        send(admin, patch("/api/v1/admin/cards/" + cardId), Map.of("tu", "đổi", "version", 0))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/decks/" + deckId).cookie(admin.session())).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/admin/users").cookie(admin.session()).param("q", learner.email()))
                .andExpect(jsonPath("$.items[0].soBoThe").value(1));
    }

    @Test
    void fr13_auditLogsFilterByAdminLocalDate() throws Exception {
        Actor admin = actor(true);
        String marker = "Marker " + UUID.randomUUID();
        insertAudit(admin.id(), marker + " sau nửa đêm", LocalDateTime.of(2026, 3, 1, 17, 30));
        insertAudit(admin.id(), marker + " trước nửa đêm", LocalDateTime.of(2026, 3, 1, 16, 30));

        mockMvc.perform(get("/api/v1/admin/audit-logs").cookie(admin.session())
                        .param("q", marker).param("tuNgay", "2026-03-02").param("denNgay", "2026-03-02"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].doiTuong.ten").value(marker + " sau nửa đêm"))
                .andExpect(jsonPath("$.items[0].createdAt").value("2026-03-01T17:30:00Z"));
        mockMvc.perform(get("/api/v1/admin/audit-logs").cookie(admin.session())
                        .param("q", marker).param("hanhDong", "SUA_BO_MAU"))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.items[0].doiTuong.ten").value(marker + " sau nửa đêm"));
        mockMvc.perform(get("/api/v1/admin/audit-logs").cookie(admin.session())
                        .param("tuNgay", "2026-03-03").param("denNgay", "2026-03-02"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/admin/audit-logs").cookie(admin.session()).param("hanhDong", "XOA_TAT_CA"))
                .andExpect(status().isBadRequest());
    }

    private void insertAudit(Long actorId, String name, LocalDateTime createdAt) {
        jdbc.update("""
                INSERT INTO nhat_ky_quan_tri
                    (nguoi_thuc_hien_id, hanh_dong, loai_doi_tuong, doi_tuong_id, ten_doi_tuong, created_at)
                VALUES (?, 'SUA_BO_MAU', 'BO_THE', 1, ?, ?)
                """, actorId, name, createdAt);
    }

    private void onlyAdmins(Long... ids) {
        String keep = String.join(",", java.util.Arrays.stream(ids).map(String::valueOf).toList());
        jdbc.update("DELETE ur FROM nguoi_dung_vai_tro ur JOIN vai_tro r ON r.id = ur.vai_tro_id "
                + "WHERE r.ma = 'ADMIN' AND ur.nguoi_dung_id NOT IN (" + keep + ")");
    }

    private long auditCount(Long targetId) {
        return jdbc.queryForObject(
                "SELECT COUNT(*) FROM nhat_ky_quan_tri WHERE loai_doi_tuong = 'NGUOI_DUNG' AND doi_tuong_id = ?",
                Long.class, targetId);
    }

    private JsonNode find(JsonNode page, Long targetId, String action) {
        for (JsonNode item : page.get("items")) {
            if (item.get("hanhDong").asText().equals(action)
                    && item.get("doiTuong").get("id").asText().equals(String.valueOf(targetId))) {
                return item;
            }
        }
        throw new AssertionError("Missing audit " + action);
    }

    private ResultActions changeStatus(Actor admin, Long id, String trangThai, String lyDo) throws Exception {
        return send(admin, patch("/api/v1/admin/users/" + id + "/status"), Map.of("trangThai", trangThai, "lyDo", lyDo));
    }

    private ResultActions roles(Actor admin, Long id, List<String> vaiTro) throws Exception {
        return send(admin, put("/api/v1/admin/users/" + id + "/roles"),
                Map.of("vaiTro", vaiTro, "lyDo", "Điều chỉnh quyền quản trị theo phân công"));
    }

    private ResultActions send(Actor actor, MockHttpServletRequestBuilder request, Object body) throws Exception {
        return mockMvc.perform(request.cookie(actor.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private JsonNode body(MvcResult result) throws Exception {
        return jsonMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private Actor actor(boolean admin) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Admin tester", passwordEncoder.encode(PASSWORD),
                "Asia/Ho_Chi_Minh", roles.findByMa(VaiTro.USER).orElseThrow());
        if (admin) {
            user.replaceRoles(Set.of(roles.findByMa(VaiTro.USER).orElseThrow(), roles.findByMa(VaiTro.ADMIN).orElseThrow()));
        }
        user.verifyEmail(Instant.now());
        Long id = users.saveAndFlush(user).getId();
        return new Actor(id, email, session(email));
    }

    private Cookie session(String email) throws Exception {
        Cookie session = login(email).andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return session;
    }

    private ResultActions login(String email) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("email", email, "password", PASSWORD))));
    }
}
