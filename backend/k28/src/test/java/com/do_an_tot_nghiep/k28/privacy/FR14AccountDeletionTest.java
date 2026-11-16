package com.do_an_tot_nghiep.k28.privacy;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.common.job.JobWorker;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
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

class FR14AccountDeletionTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";

    @Autowired JdbcTemplate jdbc;
    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired JobWorker worker;

    @Test
    void tc16_deletionErasesPrivateDataAnonymizesSharedDecksAndRevokesFiles() throws Exception {
        Actor author = actor();
        Actor other = actor();

        String privateDeck = deck(author, "Bộ riêng");
        String privateCard = card(author, privateDeck, "invoice");
        String publicDeck = deck(author, "Bộ chia sẻ");
        card(author, publicDeck, "receipt");
        send(author, patch("/api/v1/decks/" + publicDeck), Map.of("quyenTruyCap", "CONG_KHAI", "version", 0))
                .andExpect(status().isOk());
        String copy = body(mockMvc.perform(post("/api/v1/decks/" + publicDeck + "/copy").cookie(other.session())
                        .with(xsrf()).header("Idempotency-Key", UUID.randomUUID().toString()))
                .andExpect(status().isCreated())).get("id").asString();
        String sourceOfPrivate = body(mockMvc.perform(post("/api/v1/decks/" + publicDeck + "/copy")
                        .cookie(other.session()).with(xsrf()).header("Idempotency-Key", UUID.randomUUID().toString()))
                .andExpect(status().isCreated())).get("id").asString();
        jdbc.update("UPDATE bo_the SET bo_nguon_id = ? WHERE id = ?", Long.valueOf(privateDeck), Long.valueOf(sourceOfPrivate));
        send(other, put("/api/v1/decks/" + publicDeck + "/favorite"), Map.of()).andExpect(status().is2xxSuccessful());

        Long file = file(author);
        Long avatar = file(author);
        jdbc.update("INSERT INTO the_tep (the_id, tep_id, vai_tro) VALUES (?, ?, 'ANH')", Long.valueOf(privateCard), file);
        Long otherCard = jdbc.queryForObject("SELECT MIN(id) FROM the_tu_vung WHERE bo_the_id = ?", Long.class,
                Long.valueOf(copy));
        jdbc.update("INSERT INTO the_tep (the_id, tep_id, vai_tro) VALUES (?, ?, 'ANH')", otherCard, file);
        jdbc.update("UPDATE nguoi_dung SET anh_dai_dien_id = ? WHERE id = ?", avatar, author.id());
        jdbc.update("""
                INSERT INTO thong_bao (nguoi_dung_id, loai, ngay_dia_phuong, tieu_de, noi_dung, lien_ket, hien_thi, gui_email, created_at, updated_at)
                VALUES (?, 'NHAC_HOC', CURRENT_DATE, 'Nhắc', 'Nội dung', '/hom-nay', TRUE, FALSE, UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))
                """, author.id());
        jdbc.update("""
                INSERT INTO dang_ky_goi (nguoi_dung_id, goi_ma, bat_dau_at, het_han_at, trang_thai)
                VALUES (?, 'PRO', UTC_TIMESTAMP(3) - INTERVAL 1 DAY, UTC_TIMESTAMP(3) + INTERVAL 30 DAY, 'HIEU_LUC')
                """, author.id());
        jdbc.update("""
                INSERT INTO giao_dich_thanh_toan (ma_don, nguoi_dung_id, goi_ma, chu_ky, so_tien, cong, trang_thai, tao_at, hoan_tat_at)
                VALUES (?, ?, 'PRO', 'THANG', 299000, 'MO_PHONG', 'THANH_CONG', UTC_TIMESTAMP(3), UTC_TIMESTAMP(3))
                """, "DX" + UUID.randomUUID().toString().replace("-", "").substring(0, 16), author.id());

        send(author, post("/api/v1/me/deletion-requests"), Map.of("xacNhan", "sai@test.local", "matKhau", PASSWORD))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("xacNhan"));
        send(author, post("/api/v1/me/deletion-requests"), Map.of("xacNhan", author.email(), "matKhau", "saimatkhau"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("matKhau"));
        assertThat(userStatus(author.id())).isEqualTo("HOAT_DONG");

        send(author, post("/api/v1/me/deletion-requests"),
                Map.of("xacNhan", author.email().toUpperCase(), "matKhau", PASSWORD))
                .andExpect(status().isAccepted())
                .andExpect(jsonPath("$.trangThai").value("CHO_XU_LY"))
                .andExpect(jsonPath("$.phamVi").value("TAI_KHOAN"));
        assertThat(userStatus(author.id())).isEqualTo("DANG_XOA");
        mockMvc.perform(get("/api/v1/me").cookie(author.session())).andExpect(status().isUnauthorized());
        login(author.email()).andExpect(status().isForbidden());

        for (int i = 0; i < 5 && worker.runOnce("test-worker") > 0; i++) {
        }

        assertThat(jdbc.queryForObject("SELECT trang_thai FROM yeu_cau_xoa_du_lieu WHERE nguoi_dung_id = ?",
                String.class, author.id())).isEqualTo("HOAN_TAT");
        Map<String, Object> user = jdbc.queryForMap(
                "SELECT email, ten_hien_thi, password_hash, anh_dai_dien_id FROM nguoi_dung WHERE id = ?", author.id());
        assertThat(user.get("email")).isEqualTo("deleted-" + author.id() + "@deleted.invalid");
        assertThat(user.get("ten_hien_thi")).isEqualTo("Người dùng đã xóa");
        assertThat(user.get("password_hash")).isNull();
        assertThat(user.get("anh_dai_dien_id")).isNull();
        assertThat(count("SELECT COUNT(*) FROM bo_the WHERE id = ?", Long.valueOf(privateDeck))).isZero();
        assertThat(count("SELECT COUNT(*) FROM the_tu_vung WHERE id = ?", Long.valueOf(privateCard))).isZero();
        assertThat(count("SELECT COUNT(*) FROM thong_bao WHERE nguoi_dung_id = ?", author.id())).isZero();
        assertThat(count("SELECT COUNT(*) FROM nguoi_dung_vai_tro WHERE nguoi_dung_id = ?", author.id())).isZero();
        assertThat(count("SELECT COUNT(*) FROM tep_tin WHERE id IN (?, ?) AND trang_thai_xoa = 'DA_XOA'", file, avatar))
                .isEqualTo(2);
        assertThat(count("SELECT COUNT(*) FROM the_tep WHERE the_id = ?", otherCard)).isZero();
        assertThat(jdbc.queryForObject("SELECT bo_nguon_id FROM bo_the WHERE id = ?", Long.class,
                Long.valueOf(sourceOfPrivate))).isNull();
        assertThat(count("SELECT COUNT(*) FROM the_tu_vung WHERE bo_the_id = ?", Long.valueOf(copy))).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT trang_thai FROM dang_ky_goi WHERE nguoi_dung_id = ?", String.class,
                author.id())).isEqualTo("HET_HAN");
        assertThat(count("SELECT COUNT(*) FROM giao_dich_thanh_toan WHERE nguoi_dung_id = ?", author.id())).isEqualTo(1);
        assertThat(count("""
                SELECT COUNT(*) FROM nhat_ky_quan_tri WHERE hanh_dong = 'XOA_TAI_KHOAN' AND doi_tuong_id = ?
                """, author.id())).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM nguoi_dung WHERE email = ?", author.email())).isZero();

        mockMvc.perform(get("/api/v1/library/decks/" + publicDeck))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.boThe.tenTacGia").value("Người dùng đã xóa"));
    }

    @Test
    void tc16_oauthOnlyAccountConfirmsByEmailAndRequestIsIdempotent() throws Exception {
        Actor actor = actor();
        jdbc.update("UPDATE nguoi_dung SET password_hash = NULL WHERE id = ?", actor.id());
        send(actor, post("/api/v1/me/deletion-requests"), Map.of("xacNhan", actor.email()))
                .andExpect(status().isAccepted());
        assertThat(count("SELECT COUNT(*) FROM yeu_cau_xoa_du_lieu WHERE nguoi_dung_id = ?", actor.id())).isEqualTo(1);
        assertThat(count("""
                SELECT COUNT(*) FROM tac_vu_nen
                WHERE loai = 'XOA_TAI_KHOAN' AND JSON_EXTRACT(payload_json, '$.nguoiDungId') = ?
                """, actor.id())).isEqualTo(1);
        mockMvc.perform(post("/api/v1/me/deletion-requests").with(xsrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("xacNhan", actor.email()))))
                .andExpect(status().isUnauthorized());
    }

    private Long file(Actor actor) {
        String key = "files/" + actor.id() + "/" + UUID.randomUUID();
        jdbc.update("""
                INSERT INTO tep_tin (chu_so_huu_id, object_key, mime_type, kich_thuoc, checksum, loai, hoan_tat_at)
                VALUES (?, ?, 'image/png', 10, REPEAT('a', 64), 'ANH', UTC_TIMESTAMP(3))
                """, actor.id(), key);
        return jdbc.queryForObject("SELECT id FROM tep_tin WHERE object_key = ?", Long.class, key);
    }

    private String deck(Actor actor, String ten) throws Exception {
        return body(send(actor, post("/api/v1/decks"), Map.of("ten", ten, "trinhDo", "CO_BAN"))
                .andExpect(status().isCreated())).get("id").asString();
    }

    private String card(Actor actor, String deckId, String tu) throws Exception {
        return body(send(actor, post("/api/v1/decks/" + deckId + "/cards"), Map.of("tu", tu, "nghiaVi", "nghĩa"))
                .andExpect(status().isCreated())).get("id").asString();
    }

    private Integer count(String sql, Object... args) {
        return jdbc.queryForObject(sql, Integer.class, args);
    }

    private String userStatus(Long id) {
        return jdbc.queryForObject("SELECT trang_thai FROM nguoi_dung WHERE id = ?", String.class, id);
    }

    private ResultActions send(Actor actor, MockHttpServletRequestBuilder request, Object body) throws Exception {
        return mockMvc.perform(request.cookie(actor.session()).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private JsonNode body(ResultActions result) throws Exception {
        return jsonMapper.readTree(result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private ResultActions login(String email) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("email", email, "password", PASSWORD))));
    }

    private Actor actor() throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Deletion tester", passwords.encode(PASSWORD),
                "Asia/Ho_Chi_Minh", roles.findByMa(VaiTro.USER).orElseThrow());
        user.verifyEmail(Instant.now());
        Long id = users.saveAndFlush(user).getId();
        Cookie session = login(email).andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return new Actor(id, email, session);
    }

    private record Actor(Long id, String email, Cookie session) {
    }
}
