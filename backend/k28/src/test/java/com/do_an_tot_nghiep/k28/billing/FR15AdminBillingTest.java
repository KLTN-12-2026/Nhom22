package com.do_an_tot_nghiep.k28.billing;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR15AdminBillingTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";

    @Autowired JdbcTemplate jdbc;
    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;

    @BeforeEach
    void testPlan() {
        jdbc.update("""
                INSERT IGNORE INTO goi_dich_vu (ma, ten, gia_thang, gia_nam, gioi_han_the, phat_am, hoat_dong)
                VALUES ('SUA', 'Gói sửa', 1000, 10000, 10, FALSE, FALSE)
                """);
    }

    @Test
    void tc24_revenueUsesVietnamTimeAndTotalsAgree() throws Exception {
        Actor admin = actor(true);
        Actor learner = actor(false);
        order(learner, "PRO", 299000, "THANH_CONG", "2031-03-31 16:30:00");
        order(learner, "PRO", 299000, "THANH_CONG", "2031-03-31 17:30:00");
        order(learner, "PREMIUM", 9990000, "THANH_CONG", "2031-12-31 16:59:59");
        order(learner, "PRO", 299000, "THAT_BAI", "2031-05-10 03:00:00");
        order(learner, "PRO", 299000, "CHO_THANH_TOAN", "2031-06-10 03:00:00");
        order(learner, "PRO", 299000, "THANH_CONG", "2031-12-31 17:00:00");
        order(learner, "PREMIUM", 999000, "THANH_CONG", "2030-08-01 03:00:00");

        JsonNode thang = body(send(admin, get("/api/v1/admin/revenue").param("ky", "THANG").param("nam", "2031"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cacKy.length()").value(12))
                .andExpect(jsonPath("$.cacKy[2].nhan").value("Tháng 3"))
                .andExpect(jsonPath("$.cacKy[2].doanhThu").value(299000))
                .andExpect(jsonPath("$.cacKy[2].denNgay").value("2031-03-31"))
                .andExpect(jsonPath("$.cacKy[3].doanhThu").value(299000))
                .andExpect(jsonPath("$.cacKy[0].doanhThu").value(0))
                .andExpect(jsonPath("$.cacKy[11].doanhThu").value(9990000))
                .andExpect(jsonPath("$.cacKy[11].theoGoi.PREMIUM").value(9990000))
                .andExpect(jsonPath("$.cacKy[11].theoGoi.PRO").value(0))
                .andExpect(jsonPath("$.tongDoanhThu").value(10588000))
                .andExpect(jsonPath("$.soGiaoDich").value(3))
                .andExpect(jsonPath("$.soVoiKyTruocPhanTram").value(959.9))
                .andExpect(jsonPath("$.tongQuan.tyLeThanhCong").value(75.0)));
        long tongThang = 0;
        for (JsonNode ky : thang.get("cacKy")) {
            tongThang += ky.get("doanhThu").asLong();
        }

        JsonNode quy = body(send(admin, get("/api/v1/admin/revenue").param("ky", "QUY").param("nam", "2031"))
                .andExpect(jsonPath("$.cacKy.length()").value(4))
                .andExpect(jsonPath("$.cacKy[0].nhan").value("Quý 1"))
                .andExpect(jsonPath("$.cacKy[0].doanhThu").value(299000))
                .andExpect(jsonPath("$.cacKy[1].doanhThu").value(299000))
                .andExpect(jsonPath("$.cacKy[1].tuNgay").value("2031-04-01")));
        long tongQuy = 0;
        for (JsonNode ky : quy.get("cacKy")) {
            tongQuy += ky.get("doanhThu").asLong();
        }

        send(admin, get("/api/v1/admin/revenue").param("ky", "NAM").param("tuNam", "2030").param("denNam", "2032"))
                .andExpect(jsonPath("$.cacKy.length()").value(3))
                .andExpect(jsonPath("$.cacKy[0].doanhThu").value(999000))
                .andExpect(jsonPath("$.cacKy[1].nhan").value("2031"))
                .andExpect(jsonPath("$.cacKy[1].doanhThu").value(tongThang))
                .andExpect(jsonPath("$.cacKy[2].doanhThu").value(299000));
        assertThat(tongQuy).isEqualTo(tongThang).isEqualTo(10588000L);

        send(admin, get("/api/v1/admin/revenue").param("ky", "NAM").param("tuNam", "2033").param("denNam", "2032"))
                .andExpect(status().isBadRequest());
        send(admin, get("/api/v1/admin/revenue").param("ky", "THANG").param("nam", "2045"))
                .andExpect(jsonPath("$.tongDoanhThu").value(0))
                .andExpect(jsonPath("$.soVoiKyTruocPhanTram").isEmpty())
                .andExpect(jsonPath("$.tongQuan.tyLeThanhCong").isEmpty());
        send(learner, get("/api/v1/admin/revenue").param("ky", "THANG")).andExpect(status().isForbidden());
    }

    @Test
    void tc23_demoToolsShortenExpiryAndRunCheckNow() throws Exception {
        Actor admin = actor(true);
        Actor learner = actor(false);
        Long id = subscription(learner, 30);

        send(admin, get("/api/v1/admin/subscriptions").param("email", learner.email()))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].goiMa").value("PRO"))
                .andExpect(jsonPath("$.items[0].tenGoi").value("Pro"));
        send(admin, get("/api/v1/admin/subscriptions").param("email", learner.email()).param("sapHetHan", "7"))
                .andExpect(jsonPath("$.totalElements").value(0));

        String moi = Instant.now().plus(3, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS).toString();
        send(admin, patch("/api/v1/admin/subscriptions/" + id + "/expiry"), Map.of("hetHanAt", moi, "version", 0))
                .andExpect(status().isBadRequest());
        send(admin, patch("/api/v1/admin/subscriptions/" + id + "/expiry"),
                Map.of("hetHanAt", moi, "lyDo", "Demo nhắc sắp hết hạn", "version", 5))
                .andExpect(status().isConflict());
        send(admin, patch("/api/v1/admin/subscriptions/" + id + "/expiry"),
                Map.of("hetHanAt", moi, "lyDo", "Demo nhắc sắp hết hạn", "version", 0))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hetHanAt").value(moi))
                .andExpect(jsonPath("$.version").value(1));
        send(admin, get("/api/v1/admin/subscriptions").param("email", learner.email()).param("sapHetHan", "7"))
                .andExpect(jsonPath("$.totalElements").value(1));

        String qua = Instant.now().minus(1, ChronoUnit.MINUTES).truncatedTo(ChronoUnit.SECONDS).toString();
        send(admin, patch("/api/v1/admin/subscriptions/" + id + "/expiry"),
                Map.of("hetHanAt", qua, "lyDo", "Demo khóa khi hết hạn", "version", 1))
                .andExpect(status().isOk());
        send(admin, post("/api/v1/admin/subscriptions/expiry-check"), Map.of())
                .andExpect(status().isBadRequest());
        send(admin, post("/api/v1/admin/subscriptions/expiry-check"), Map.of("lyDo", "Chạy kiểm tra hết hạn demo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.soChuyenHetHan").isNumber());

        assertThat(jdbc.queryForObject("SELECT trang_thai FROM dang_ky_goi WHERE id = ?", String.class, id))
                .isEqualTo("HET_HAN");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM thong_bao WHERE nguoi_dung_id = ? AND loai = 'GOI_DA_HET_HAN'",
                Integer.class, learner.id())).isEqualTo(1);
        assertThat(jdbc.queryForObject("""
                SELECT COUNT(*) FROM nhat_ky_quan_tri WHERE nguoi_thuc_hien_id = ?
                  AND hanh_dong IN ('SUA_HAN_GOI', 'CHAY_KIEM_TRA_HET_HAN')
                """, Integer.class, admin.id())).isEqualTo(3);
        send(admin, patch("/api/v1/admin/subscriptions/" + id + "/expiry"),
                Map.of("hetHanAt", moi, "lyDo", "Mở lại gói đã hết hạn", "version", 2))
                .andExpect(status().isUnprocessableContent());
        send(learner, get("/api/v1/admin/subscriptions")).andExpect(status().isForbidden());
    }

    @Test
    void fr15_adminPaymentsFilterAndHideSignature() throws Exception {
        Actor admin = actor(true);
        Actor learner = actor(false);
        String maDon = order(learner, "PRO", 299000, "THANH_CONG", "2026-11-10 03:00:00");
        jdbc.update("UPDATE giao_dich_thanh_toan SET du_lieu_cong_json = ? WHERE ma_don = ?",
                "{\"vnp_TxnRef\":\"" + maDon + "\",\"vnp_ResponseCode\":\"00\",\"vnp_SecureHash\":\"abc\"}", maDon);
        order(learner, "PREMIUM", 999000, "THAT_BAI", "2026-11-12 03:00:00");

        send(admin, get("/api/v1/admin/payments").param("email", learner.email().toUpperCase()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.items[0].goiMa").value("PREMIUM"))
                .andExpect(jsonPath("$.items[0].email").value(learner.email()));
        send(admin, get("/api/v1/admin/payments").param("email", learner.email())
                .param("trangThai", "THANH_CONG").param("goiMa", "PRO")
                .param("tuNgay", "2026-11-10").param("denNgay", "2026-11-10"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].maDon").value(maDon));
        send(admin, get("/api/v1/admin/payments").param("email", learner.email()).param("tuNgay", "2026-11-11"))
                .andExpect(jsonPath("$.totalElements").value(1));
        send(admin, get("/api/v1/admin/payments").param("tuNgay", "2026-11-12").param("denNgay", "2026-11-11"))
                .andExpect(status().isBadRequest());
        send(admin, get("/api/v1/admin/payments/" + maDon))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.giaoDich.tenGoi").value("Pro"))
                .andExpect(jsonPath("$.duLieuCong.vnp_ResponseCode").value("00"))
                .andExpect(jsonPath("$.duLieuCong.vnp_SecureHash").doesNotExist());
        send(admin, get("/api/v1/admin/payments/DH-KHONG-CO")).andExpect(status().isNotFound());
        send(learner, get("/api/v1/admin/payments")).andExpect(status().isForbidden());
    }

    @Test
    void fr15_adminUpdatesPlanWithVersionAndAudit() throws Exception {
        Actor admin = actor(true);
        JsonNode plan = null;
        for (JsonNode item : body(send(admin, get("/api/v1/admin/plans")).andExpect(status().isOk()))) {
            if (item.get("ma").asString().equals("SUA")) {
                plan = item;
            }
        }
        assertThat(plan).isNotNull();
        long version = plan.get("version").asLong();
        Map<String, Object> body = new java.util.HashMap<>(Map.of(
                "ten", "Gói sửa", "giaThang", 2000, "giaNam", 20000, "phatAm", true,
                "hoatDong", false, "lyDo", "Điều chỉnh giá thử nghiệm"));
        body.put("version", version + 9);
        send(admin, put("/api/v1/admin/plans/SUA"), body).andExpect(status().isConflict());
        body.put("version", version);
        send(admin, put("/api/v1/admin/plans/SUA"), body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.giaThang").value(2000))
                .andExpect(jsonPath("$.gioiHanThe").isEmpty())
                .andExpect(jsonPath("$.phatAm").value(true))
                .andExpect(jsonPath("$.version").value(version + 1));
        assertThat(jdbc.queryForObject("""
                SELECT sau_json FROM nhat_ky_quan_tri
                WHERE nguoi_thuc_hien_id = ? AND hanh_dong = 'SUA_GOI_DICH_VU'
                """, String.class, admin.id())).contains("giaThang", "gioiHanThe").doesNotContain("\"ten\"");
        body.put("giaThang", 0);
        body.put("version", version + 1);
        send(admin, put("/api/v1/admin/plans/SUA"), body).andExpect(status().isUnprocessableContent());
        body.put("giaThang", -1);
        send(admin, put("/api/v1/admin/plans/SUA"), body).andExpect(status().isBadRequest());
        send(admin, put("/api/v1/admin/plans/KHONG"), Map.of("ten", "x", "giaThang", 2000, "giaNam", 20000,
                "phatAm", true, "hoatDong", true, "version", 0))
                .andExpect(status().isNotFound());
    }

    private String order(Actor learner, String goiMa, long soTien, String trangThai, String utc) {
        String maDon = "T" + UUID.randomUUID().toString().replace("-", "").substring(0, 20).toUpperCase();
        jdbc.update("""
                INSERT INTO giao_dich_thanh_toan (ma_don, nguoi_dung_id, goi_ma, chu_ky, so_tien, cong, trang_thai, tao_at, hoan_tat_at)
                VALUES (?, ?, ?, 'THANG', ?, 'MO_PHONG', ?, ?, IF(? IN ('THANH_CONG', 'THAT_BAI'), ?, NULL))
                """, maDon, learner.id(), goiMa, soTien, trangThai, utc, trangThai, utc);
        return maDon;
    }

    private Long subscription(Actor learner, int ngay) {
        jdbc.update("""
                INSERT INTO dang_ky_goi (nguoi_dung_id, goi_ma, bat_dau_at, het_han_at, trang_thai)
                VALUES (?, 'PRO', UTC_TIMESTAMP(3) - INTERVAL 1 DAY, UTC_TIMESTAMP(3) + INTERVAL ? DAY, 'HIEU_LUC')
                """, learner.id(), ngay);
        return jdbc.queryForObject("SELECT id FROM dang_ky_goi WHERE nguoi_dung_id = ?", Long.class, learner.id());
    }

    private ResultActions send(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.cookie(actor.session()));
    }

    private ResultActions send(Actor actor, MockHttpServletRequestBuilder request, Object body) throws Exception {
        return mockMvc.perform(request.cookie(actor.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private JsonNode body(ResultActions result) throws Exception {
        return jsonMapper.readTree(result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private Actor actor(boolean admin) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Admin billing tester", passwords.encode(PASSWORD),
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

    private record Actor(Long id, String email, Cookie session) {
    }
}
