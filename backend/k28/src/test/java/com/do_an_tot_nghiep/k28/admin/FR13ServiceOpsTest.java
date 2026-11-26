package com.do_an_tot_nghiep.k28.admin;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
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
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR13ServiceOpsTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final String REASON = "Tăng hạn mức AI cho đợt thi thử";

    @Autowired
    private NguoiDungRepository users;

    @Autowired
    private VaiTroRepository roles;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbc;

    private record Actor(Long id, Cookie session) {
    }

    @Test
    void fr13_updateQuotasIsAtomicVersionedAuditedAndAppliesImmediately() throws Exception {
        Actor admin = actor(true);
        Actor learner = actor(false);
        int proAi = limit("PRO", "AI");
        int proTts = limit("PRO", "TTS");
        try {
            mockMvc.perform(get("/api/v1/admin/service-quotas").cookie(learner.session()))
                    .andExpect(status().isForbidden());
            JsonNode list = jsonMapper.readTree(mockMvc.perform(get("/api/v1/admin/service-quotas")
                            .cookie(admin.session()))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString());
            assertThat(list.size()).isEqualTo(15);
            JsonNode ai = find(list, "PRO", "AI");
            JsonNode tts = find(list, "PRO", "TTS");
            assertThat(ai.get("soLuotNgay").asInt()).isEqualTo(proAi);

            update(admin, List.of(item("PRO", "AI", proAi + 5, ai.get("version").asLong()),
                    item("PRO", "TTS", proTts + 1, tts.get("version").asLong() + 7)), REASON)
                    .andExpect(status().isConflict());
            assertThat(limit("PRO", "AI")).isEqualTo(proAi);

            update(admin, List.of(item("PRO", "AI", proAi + 5, ai.get("version").asLong()),
                    item("PRO", "TTS", proTts, tts.get("version").asLong())), REASON)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$[?(@.goiMa == 'PRO' && @.loai == 'AI')].soLuotNgay").value(proAi + 5));
            assertThat(auditCount()).isEqualTo(1);
            String raw = jdbc.queryForObject("SELECT CONCAT(ten_doi_tuong, '|', ly_do, '|', truoc_json, '|', sau_json) "
                    + "FROM nhat_ky_quan_tri WHERE hanh_dong = 'SUA_HAN_MUC' AND nguoi_thuc_hien_id = ?",
                    String.class, admin.id());
            assertThat(raw).contains("PRO · AI").contains(REASON)
                    .contains("\"soLuotNgay\": " + proAi).contains("\"soLuotNgay\": " + (proAi + 5));

            mockMvc.perform(get("/api/v1/me/service-quota").cookie(learner.session()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.hanMuc[?(@.loai == 'AI')].gioiHan").value(proAi + 5));

            update(admin, List.of(item("PRO", "AI", 1, ai.get("version").asLong())), REASON)
                    .andExpect(status().isConflict());
            update(admin, List.of(item("PRO", "AI", 1, 0), item("PRO", "AI", 2, 0)), REASON)
                    .andExpect(status().isBadRequest());
            update(admin, List.of(item("KHONG", "AI", 1, 0)), REASON).andExpect(status().isNotFound());
            update(admin, List.of(item("PRO", "AI", 10001, 0)), REASON).andExpect(status().isBadRequest());
            update(admin, List.of(item("PRO", "AI", 1, 0)), "ngắn")
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors[0].field").value("lyDo"));
            assertThat(auditCount()).isEqualTo(1);
        } finally {
            jdbc.update("UPDATE han_muc_dich_vu SET so_luot_ngay = ? WHERE goi_ma = 'PRO' AND loai = 'AI'", proAi);
            jdbc.update("UPDATE han_muc_dich_vu SET so_luot_ngay = ? WHERE goi_ma = 'PRO' AND loai = 'TTS'", proTts);
        }
    }

    @Test
    void fr13_serviceUsageSumsCountersAndAiFailuresInRange() throws Exception {
        Actor admin = actor(true);
        Actor first = actor(false);
        Actor second = actor(false);
        usageRow(first.id(), "2020-03-02", "AI", 3, 1);
        usageRow(second.id(), "2020-03-03", "AI", 2, 0);
        usageRow(first.id(), "2020-03-03", "TTS", 4, 0);
        usageRow(first.id(), "2020-03-10", "AI", 50, 0);
        aiRow(first.id(), "AI", "2020-03-02", "LOI");
        aiRow(first.id(), "AI", "2020-03-02", "LOI");
        aiRow(first.id(), "AI", "2020-03-03", "KHONG_XAC_DINH");
        aiRow(second.id(), "AI", "2020-03-03", "HOAN_TAT");
        aiRow(second.id(), "ANH", "2020-03-04", "LOI");
        aiRow(second.id(), "AI", "2020-03-12", "LOI");

        JsonNode body = jsonMapper.readTree(mockMvc.perform(get("/api/v1/admin/service-usage").cookie(admin.session())
                        .param("tuNgay", "2020-03-01").param("denNgay", "2020-03-07"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.muiGio").value("Asia/Ho_Chi_Minh"))
                .andReturn().getResponse().getContentAsString());
        JsonNode ai = service(body, "AI");
        assertThat(ai.get("soLuotDung").asLong()).isEqualTo(5);
        assertThat(ai.get("soDangGiu").asLong()).isEqualTo(1);
        assertThat(ai.get("soNguoiDung").asLong()).isEqualTo(2);
        assertThat(ai.get("soLoi").asLong()).isEqualTo(2);
        assertThat(ai.get("soKhongXacDinh").asLong()).isEqualTo(1);
        assertThat(service(body, "ANH").get("soLoi").asLong()).isEqualTo(1);
        JsonNode tts = service(body, "TTS");
        assertThat(tts.get("soLuotDung").asLong()).isEqualTo(4);
        assertThat(tts.get("soLoi").isNull()).isTrue();
        assertThat(service(body, "PHAT_AM").get("soLuotDung").asLong()).isZero();

        mockMvc.perform(get("/api/v1/admin/service-usage").cookie(admin.session()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dichVu.length()").value(5));
        mockMvc.perform(get("/api/v1/admin/service-usage").cookie(admin.session())
                        .param("tuNgay", "2020-01-01").param("denNgay", "2020-06-01"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("tuNgay"));
        mockMvc.perform(get("/api/v1/admin/service-usage").cookie(admin.session())
                        .param("tuNgay", "2020-03-07").param("denNgay", "2020-03-01"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/admin/service-usage").cookie(admin.session()).param("tuNgay", "2020-02-30"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/v1/admin/service-usage").cookie(first.session()))
                .andExpect(status().isForbidden());
    }

    private void usageRow(Long userId, String ngay, String loai, int soDung, int soGiu) {
        jdbc.update("INSERT INTO su_dung_dich_vu (nguoi_dung_id, ngay, loai, so_giu, so_dung) VALUES (?, ?, ?, ?, ?)",
                userId, ngay, loai, soGiu, soDung);
    }

    private void aiRow(Long userId, String hanMucLoai, String ngay, String trangThai) {
        jdbc.update("INSERT INTO yeu_cau_ai (nguoi_dung_id, loai, trang_thai, input_ref, han_muc_loai, han_muc_ngay, "
                        + "han_muc_trang_thai) VALUES (?, ?, ?, 'demo', ?, ?, ?)",
                userId, "ANH".equals(hanMucLoai) ? "ANH_THE" : "NGU_CANH", trangThai, hanMucLoai, ngay,
                "LOI".equals(trangThai) ? "DA_HOAN" : "DA_DUNG");
    }

    private int limit(String goiMa, String loai) {
        return jdbc.queryForObject("SELECT so_luot_ngay FROM han_muc_dich_vu WHERE goi_ma = ? AND loai = ?",
                Integer.class, goiMa, loai);
    }

    private long auditCount() {
        return jdbc.queryForObject("SELECT COUNT(*) FROM nhat_ky_quan_tri WHERE hanh_dong = 'SUA_HAN_MUC' "
                + "AND ly_do = ?", Long.class, REASON);
    }

    private static Map<String, Object> item(String goiMa, String loai, int soLuotNgay, long version) {
        return Map.of("goiMa", goiMa, "loai", loai, "soLuotNgay", soLuotNgay, "version", version);
    }

    private ResultActions update(Actor admin, List<Map<String, Object>> items, String lyDo) throws Exception {
        return mockMvc.perform(put("/api/v1/admin/service-quotas").cookie(admin.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("hanMuc", items, "lyDo", lyDo))));
    }

    private static JsonNode find(JsonNode list, String goiMa, String loai) {
        for (JsonNode item : list) {
            if (item.get("goiMa").asString().equals(goiMa) && item.get("loai").asString().equals(loai)) {
                return item;
            }
        }
        throw new AssertionError(goiMa + " " + loai);
    }

    private static JsonNode service(JsonNode body, String loai) {
        for (JsonNode item : body.get("dichVu")) {
            if (item.get("loai").asString().equals(loai)) {
                return item;
            }
        }
        throw new AssertionError(loai);
    }

    private Actor actor(boolean admin) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Ops tester", passwordEncoder.encode(PASSWORD),
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
        return new Actor(id, session);
    }
}
