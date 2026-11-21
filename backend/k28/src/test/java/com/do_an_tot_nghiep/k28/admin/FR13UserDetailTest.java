package com.do_an_tot_nghiep.k28.admin;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR13UserDetailTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

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
    void fr13_userDetailIsAdminOnlyAndReturns404ForUnknownUser() throws Exception {
        Actor admin = actor(true);
        Actor learner = actor(false);
        mockMvc.perform(get("/api/v1/admin/users/{id}", admin.id()).cookie(learner.session()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/users/{id}", 999_999_999L).cookie(admin.session()))
                .andExpect(status().isNotFound());
    }

    @Test
    void fr13_userDetailAggregatesLearningPaymentsAndAudit() throws Exception {
        Actor admin = actor(true);
        Actor learner = actor(false);
        LocalDate today = LocalDate.now(ZONE);
        jdbc.update("INSERT INTO su_dung_hoc_ngay (nguoi_dung_id, ngay_dia_phuong, so_the_moi, so_luot_hop_le, diem) "
                + "VALUES (?, ?, 3, 12, 0)", learner.id(), today);
        jdbc.update("INSERT INTO su_dung_hoc_ngay (nguoi_dung_id, ngay_dia_phuong, so_the_moi, so_luot_hop_le, diem) "
                + "VALUES (?, ?, 1, 6, 0)", learner.id(), today.minusDays(1));
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        jdbc.update("INSERT INTO giao_dich_thanh_toan (ma_don, nguoi_dung_id, goi_ma, chu_ky, so_tien, cong, trang_thai, "
                        + "tao_at, hoan_tat_at) VALUES (?, ?, 'PRO', 'THANG', 299000, 'MO_PHONG', 'THANH_CONG', ?, ?)",
                "T" + UUID.randomUUID().toString().substring(0, 20), learner.id(), now, now);
        jdbc.update("INSERT INTO giao_dich_thanh_toan (ma_don, nguoi_dung_id, goi_ma, chu_ky, so_tien, cong, trang_thai, "
                        + "tao_at) VALUES (?, ?, 'PRO', 'THANG', 299000, 'MO_PHONG', 'THAT_BAI', ?)",
                "T" + UUID.randomUUID().toString().substring(0, 20), learner.id(), now.minusHours(1));
        jdbc.update("INSERT INTO dang_ky_goi (nguoi_dung_id, goi_ma, bat_dau_at, het_han_at, trang_thai) "
                + "VALUES (?, 'PRO', ?, ?, 'HIEU_LUC')", learner.id(), now, now.plusDays(30));

        JsonNode detail = detail(admin, learner.id());
        assertThat(detail.get("nguoiDung").get("id").asString()).isEqualTo(String.valueOf(learner.id()));
        assertThat(detail.get("muiGio").asString()).isEqualTo("Asia/Ho_Chi_Minh");
        JsonNode hocTap = detail.get("hocTap");
        assertThat(hocTap.get("theoNgay").size()).isEqualTo(30);
        assertThat(hocTap.get("theoNgay").get(29).get("luotOn").asLong()).isEqualTo(12);
        assertThat(hocTap.get("soNgayHoc").asInt()).isEqualTo(2);
        assertThat(hocTap.get("chuoiNgay").asInt()).isEqualTo(2);
        assertThat(hocTap.get("hocCuoiNgay").asString()).isEqualTo(today.toString());
        assertThat(detail.get("goiHienTai").get("goiMa").asString()).isEqualTo("PRO");
        JsonNode thanhToan = detail.get("thanhToan");
        assertThat(thanhToan.get("tongDaChi").asLong()).isEqualTo(299000);
        assertThat(thanhToan.get("soThanhCong").asLong()).isEqualTo(1);
        assertThat(thanhToan.get("soThatBai").asLong()).isEqualTo(1);
        assertThat(thanhToan.get("ganDay").get(0).get("trangThai").asString()).isEqualTo("THANH_CONG");
        assertThat(detail.get("baoCao").get("daGui").asLong()).isZero();

        mockMvc.perform(patch("/api/v1/admin/users/{id}/status", learner.id()).with(xsrf()).cookie(admin.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("trangThai", "BI_KHOA", "lyDo", "Khóa để kiểm thử chi tiết"))))
                .andExpect(status().isOk());
        JsonNode logs = jsonMapper.readTree(mockMvc.perform(get("/api/v1/admin/audit-logs")
                        .param("loai", "NGUOI_DUNG").param("doiTuongId", String.valueOf(learner.id()))
                        .cookie(admin.session()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
        assertThat(logs.get("totalElements").asLong()).isEqualTo(1);
        assertThat(logs.get("items").get(0).get("hanhDong").asString()).isEqualTo("KHOA_TAI_KHOAN");
    }

    private JsonNode detail(Actor admin, Long id) throws Exception {
        return jsonMapper.readTree(mockMvc.perform(get("/api/v1/admin/users/{id}", id).cookie(admin.session()))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
    }

    private Actor actor(boolean admin) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Detail tester", passwordEncoder.encode(PASSWORD),
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
