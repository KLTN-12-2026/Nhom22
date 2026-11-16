package com.do_an_tot_nghiep.k28.admin;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR13ModerationTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String DESCRIPTION = "Nghĩa của từ không khớp với câu ví dụ";
    private static final String REASON = "Nội dung sai nghĩa, ẩn khỏi thư viện";

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
    void fr13_reportDeckRejectsDuplicateAndHideResolvesAllPendingWithAudit() throws Exception {
        Actor author = actor(false);
        Actor reporter = actor(false);
        Actor other = actor(false);
        Actor admin = actor(true);
        String deckId = deck(author, "CONG_KHAI");
        String privateDeckId = deck(author, "RIENG_TU");

        report(author, "BO_THE", deckId).andExpect(status().isUnprocessableContent());
        report(reporter, "BO_THE", privateDeckId).andExpect(status().isNotFound());
        report(reporter, "BO_THE", "999999999").andExpect(status().isNotFound());
        String first = report(reporter, "BO_THE", deckId)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.trangThai").value("CHO_XU_LY"))
                .andExpect(jsonPath("$.doiTuongId").value(deckId))
                .andReturn().getResponse().getContentAsString();
        String firstId = jsonMapper.readTree(first).get("id").asString();
        report(reporter, "BO_THE", deckId)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
        report(other, "BO_THE", deckId).andExpect(status().isCreated());

        mockMvc.perform(get("/api/v1/admin/reports").cookie(reporter.session()))
                .andExpect(status().isForbidden());
        JsonNode queue = body(mockMvc.perform(get("/api/v1/admin/reports").cookie(admin.session())
                        .param("trangThai", "CHO_XU_LY").param("loaiDoiTuong", "BO_THE").param("size", "100"))
                .andExpect(status().isOk()).andReturn());
        JsonNode item = find(queue, firstId);
        assertThat(item.get("noiDung").get("ten").asString()).isEqualTo("Bộ báo cáo");
        assertThat(item.get("nguoiBaoCao").get("id").asString()).isEqualTo(String.valueOf(reporter.id()));
        assertThat(item.get("nguoiXuLy").isNull()).isTrue();

        resolve(admin, firstId, "AN", "ngắn").andExpect(status().isBadRequest());
        resolve(admin, firstId, "AN", REASON)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_AN"))
                .andExpect(jsonPath("$.nguoiXuLy.id").value(String.valueOf(admin.id())))
                .andExpect(jsonPath("$.lyDoXuLy").value(REASON));
        resolve(admin, firstId, "GIU", REASON).andExpect(status().isConflict());

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM bao_cao_noi_dung WHERE doi_tuong_id = ? "
                + "AND loai_doi_tuong = 'BO_THE' AND trang_thai = 'DA_AN'", Long.class, Long.valueOf(deckId)))
                .isEqualTo(2L);
        mockMvc.perform(get("/api/v1/library/decks/" + deckId).cookie(reporter.session()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/decks/" + deckId).cookie(author.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThaiKiemDuyet").value("DA_AN"));

        JsonNode logs = body(mockMvc.perform(get("/api/v1/admin/audit-logs").cookie(admin.session())
                        .param("hanhDong", "AN_NOI_DUNG").param("q", "Bộ báo cáo"))
                .andExpect(status().isOk()).andReturn());
        JsonNode log = null;
        for (JsonNode candidate : logs.get("items")) {
            if (candidate.get("doiTuong").get("id").asString().equals(deckId)) {
                log = candidate;
            }
        }
        assertThat(log).isNotNull();
        assertThat(log.get("nguoiThucHien").get("id").asString()).isEqualTo(String.valueOf(admin.id()));
        assertThat(log.get("lyDo").asString()).isEqualTo(REASON);
        assertThat(log.get("truoc").get("trangThai").asString()).isEqualTo("CHO_XU_LY");
        assertThat(log.get("truoc").get("anKiemDuyet").asBoolean()).isFalse();
        assertThat(log.get("sau").get("trangThai").asString()).isEqualTo("DA_AN");
        assertThat(log.get("sau").get("anKiemDuyet").asBoolean()).isTrue();
        assertThat(log.get("sau").get("baoCaoIds").size()).isEqualTo(2);

        report(reporter, "BO_THE", deckId).andExpect(status().isNotFound());
    }

    @Test
    void fr13_hiddenCardLeavesPublicViewsButOwnerKeepsIt() throws Exception {
        Actor author = actor(false);
        Actor reporter = actor(false);
        Actor admin = actor(true);
        String deckId = deck(author, "CONG_KHAI");
        String keep = card(author, deckId, "keep");
        String hide = card(author, deckId, "hide");

        String keepReport = id(report(reporter, "THE_TU_VUNG", keep).andExpect(status().isCreated()));
        String hideReport = id(report(reporter, "THE_TU_VUNG", hide).andExpect(status().isCreated()));
        resolve(admin, keepReport, "GIU", "Nghĩa đúng theo từ điển, giữ nguyên")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_GIU"));
        resolve(admin, hideReport, "AN", REASON).andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/library/decks/" + deckId).cookie(reporter.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.boThe.soThe").value(2))
                .andExpect(jsonPath("$.the.items.length()").value(2))
                .andExpect(jsonPath("$.the.items[?(@.id == '" + hide + "')]").isEmpty());
        mockMvc.perform(get("/api/v1/library/decks").cookie(reporter.session()).param("q", "Bộ báo cáo")
                        .param("size", "100"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[?(@.id == '" + deckId + "')].soThe").value(2));
        mockMvc.perform(get("/api/v1/decks/" + deckId + "/cards").cookie(author.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(3));
        report(reporter, "THE_TU_VUNG", hide).andExpect(status().isNotFound());
        report(reporter, "THE_TU_VUNG", keep).andExpect(status().isCreated());
    }

    @Test
    void fr13_reportAiOutputOnlyOwnCompletedAndHideClearsResult() throws Exception {
        Actor learner = actor(false);
        Actor other = actor(false);
        Actor admin = actor(true);
        Long done = aiRequest(learner.id(), "HOAN_TAT");
        Long running = aiRequest(learner.id(), "DANG_XU_LY");

        report(other, "YEU_CAU_AI", String.valueOf(done)).andExpect(status().isNotFound());
        report(learner, "YEU_CAU_AI", String.valueOf(running)).andExpect(status().isUnprocessableContent());
        String reportId = id(report(learner, "YEU_CAU_AI", String.valueOf(done)).andExpect(status().isCreated()));

        JsonNode queue = body(mockMvc.perform(get("/api/v1/admin/reports").cookie(admin.session())
                        .param("loaiDoiTuong", "YEU_CAU_AI").param("size", "100"))
                .andExpect(status().isOk()).andReturn());
        assertThat(find(queue, reportId).get("noiDung").get("ketQua").get("giaiThich").asString())
                .isEqualTo("Biên lai");

        resolve(admin, reportId, "AN", REASON).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/ai/requests/" + done).cookie(learner.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.anKiemDuyet").value(true))
                .andExpect(jsonPath("$.ketQua").value(org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void fr13_reportValidation() throws Exception {
        Actor learner = actor(false);
        send(learner, post("/api/v1/reports"), Map.of("loaiDoiTuong", "BO_THE", "doiTuongId", "1",
                "lyDo", "SAI_NOI_DUNG", "moTa", "ngắn"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("moTa"));
        send(learner, post("/api/v1/reports"), Map.of("loaiDoiTuong", "NGUOI_DUNG", "doiTuongId", "1",
                "lyDo", "SAI_NOI_DUNG", "moTa", DESCRIPTION))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/reports").with(xsrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    private Long aiRequest(Long userId, String trangThai) {
        jdbc.update("INSERT INTO yeu_cau_ai (nguoi_dung_id, loai, trang_thai, input_ref, ket_qua_json, "
                        + "phien_ban_prompt, nha_cung_cap, han_muc_trang_thai) VALUES (?, 'NGU_CANH', ?, 'receipt', "
                        + "'{\"giaiThich\": \"Biên lai\"}', 'ctx-v1', 'fake', 'DA_DUNG')",
                userId, trangThai);
        return jdbc.queryForObject("SELECT MAX(id) FROM yeu_cau_ai WHERE nguoi_dung_id = ?", Long.class, userId);
    }

    private String deck(Actor owner, String quyenTruyCap) throws Exception {
        String deckId = id(send(owner, post("/api/v1/decks"), Map.of("ten", "Bộ báo cáo", "trinhDo", "CO_BAN",
                "quyenTruyCap", quyenTruyCap)).andExpect(status().isCreated()));
        if ("CONG_KHAI".equals(quyenTruyCap)) {
            card(owner, deckId, "receipt");
        }
        return deckId;
    }

    private String card(Actor owner, String deckId, String tu) throws Exception {
        return id(send(owner, post("/api/v1/decks/" + deckId + "/cards"), Map.of("tu", tu, "nghiaVi", "biên lai",
                "doKho", 2)).andExpect(status().isCreated()));
    }

    private ResultActions report(Actor actor, String loai, String doiTuongId) throws Exception {
        return send(actor, post("/api/v1/reports"), Map.of("loaiDoiTuong", loai, "doiTuongId", doiTuongId,
                "lyDo", "SAI_NOI_DUNG", "moTa", DESCRIPTION));
    }

    private ResultActions resolve(Actor admin, String reportId, String quyetDinh, String lyDo) throws Exception {
        return send(admin, post("/api/v1/admin/reports/" + reportId + "/resolve"),
                Map.of("quyetDinh", quyetDinh, "lyDo", lyDo));
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

    private JsonNode body(MvcResult result) throws Exception {
        return jsonMapper.readTree(result.getResponse().getContentAsString());
    }

    private Actor actor(boolean admin) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Moderation tester", passwordEncoder.encode(PASSWORD),
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
