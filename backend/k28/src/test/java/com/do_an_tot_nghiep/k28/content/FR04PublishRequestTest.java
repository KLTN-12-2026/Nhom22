package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.entity.enums.TrinhDo;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.content.entity.BoThe;
import com.do_an_tot_nghiep.k28.content.entity.TheTuVung;
import com.do_an_tot_nghiep.k28.content.entity.enums.QuyenTruyCap;
import com.do_an_tot_nghiep.k28.content.repository.BoTheRepository;
import com.do_an_tot_nghiep.k28.content.repository.TheTuVungRepository;
import com.do_an_tot_nghiep.k28.content.service.DeckCopyService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@TestPropertySource(properties = "app.files.cleanup.enabled=false")
class FR04PublishRequestTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";

    @Autowired NguoiDungRepository users;
    @Autowired VaiTroRepository roles;
    @Autowired PasswordEncoder passwords;
    @Autowired BoTheRepository decks;
    @Autowired TheTuVungRepository cards;
    @Autowired DeckCopyService copies;
    @Autowired JdbcTemplate jdbc;
    @Autowired Clock clock;
    private Actor author;
    private Actor learner;
    private Long sourceId;

    @BeforeEach
    void fixtures() throws Exception {
        author = actor(false);
        learner = actor(false);
        sourceId = publicDeck(author.id(), "Bộ gốc của tác giả");
    }

    @Test
    void tc25_oneActiveCopyPerSourceUntilItIsDeleted() throws Exception {
        JsonNode first = json(copy(learner, sourceId, "k1").andExpect(status().isCreated()));
        assertThat(first.get("banSao").get("boGocId").asText()).isEqualTo(sourceId.toString());
        assertThat(first.get("banSao").get("boGocTen").asText()).isEqualTo("Bộ gốc của tác giả");
        assertThat(first.get("ten").asText()).isEqualTo("Bộ gốc của tác giả");

        copy(learner, sourceId, "k2").andExpect(status().isConflict())
                .andExpect(jsonPath("$.details.boTheId").value(first.get("id").asText()));
        copy(learner, sourceId, "k1").andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(first.get("id").asText()));

        send(learner, delete("/api/v1/decks/" + first.get("id").asText())
                .param("version", first.get("version").asText())).andExpect(status().isNoContent());
        copy(learner, sourceId, "k3").andExpect(status().isCreated());
    }

    @Test
    void tc25_concurrentCopiesWithDifferentKeysCreateOneCopy() throws Exception {
        CyclicBarrier barrier = new CyclicBarrier(2);
        var pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<Object>> results = new ArrayList<>();
            for (String key : List.of("race-a", "race-b")) {
                results.add(pool.submit(() -> {
                    barrier.await(10, TimeUnit.SECONDS);
                    try {
                        return copies.copy(learner.id(), sourceId, key);
                    } catch (ApiException e) {
                        return e.getErrorCode();
                    }
                }));
            }
            List<Object> outcomes = new ArrayList<>();
            for (Future<Object> result : results) {
                outcomes.add(result.get(30, TimeUnit.SECONDS));
            }
            assertThat(outcomes).filteredOn(ErrorCode.CONFLICT::equals).hasSize(1);
        } finally {
            pool.shutdownNow();
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM bo_the WHERE chu_so_huu_id = ? AND bo_nguon_id = ?",
                Integer.class, learner.id(), sourceId)).isEqualTo(1);
    }

    @Test
    void tc25_copyOfACopyIsRejectedAndPointsToTheOriginal() throws Exception {
        Long copyId = copyId(learner, sourceId);
        jdbc.update("UPDATE bo_the SET quyen_truy_cap = 'CONG_KHAI' WHERE id = ?", copyId);
        Actor other = actor(false);

        copy(other, copyId, "copy-of-copy").andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.details.lyDo").value("LA_BAN_SAO"))
                .andExpect(jsonPath("$.details.boGocId").value(sourceId.toString()));
    }

    @Test
    void tc25_copyCannotBePublishedThroughPatchButCanBeEdited() throws Exception {
        JsonNode copy = json(copy(learner, sourceId, "patch").andExpect(status().isCreated()));
        String path = "/api/v1/decks/" + copy.get("id").asText();

        patchDeck(learner, path, Map.of("quyenTruyCap", "CONG_KHAI", "version", copy.get("version").asLong()))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.details.lyDo").value("CAN_DUYET_CONG_KHAI"));
        patchDeck(learner, path, Map.of("ten", "Bản sao đã sửa", "version", copy.get("version").asLong()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten").value("Bản sao đã sửa"))
                .andExpect(jsonPath("$.quyenTruyCap").value("RIENG_TU"))
                .andExpect(jsonPath("$.banSao.boGocTen").value("Bộ gốc của tác giả"));
    }

    @Test
    void tc25_authorApprovesThenRevokesAndResubmitWaits24Hours() throws Exception {
        Long copyId = copyId(learner, sourceId);
        JsonNode pending = json(submit(learner, copyId).andExpect(status().isCreated()));
        assertThat(pending.get("trangThai").asText()).isEqualTo("CHO_DUYET");
        assertThat(pending.get("nguoiDuyet").asText()).isEqualTo("TAC_GIA");
        submit(learner, copyId).andExpect(status().isConflict());
        assertThat(notifications(author.id(), "YEU_CAU_CONG_KHAI")).isEqualTo(1);

        JsonNode inbox = json(send(author, get("/api/v1/me/publish-requests")).andExpect(status().isOk()));
        assertThat(inbox.get("items")).hasSize(1);
        assertThat(inbox.get("items").get(0).get("tenBoNguon").asText()).isEqualTo("Bộ gốc của tác giả");
        String requestId = pending.get("id").asText();

        Actor stranger = actor(false);
        send(author, get("/api/v1/publish-requests/" + requestId + "/cards")).andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].tu").value("apple"));
        send(stranger, get("/api/v1/publish-requests/" + requestId + "/cards")).andExpect(status().isNotFound());
        decide(stranger, requestId, "DUYET", null, 0).andExpect(status().isNotFound());
        decide(learner, requestId, "DUYET", null, 0).andExpect(status().isNotFound());
        JsonNode approved = json(decide(author, requestId, "DUYET", null, 0).andExpect(status().isOk()));
        assertThat(approved.get("trangThai").asText()).isEqualTo("DA_DUYET");
        decide(author, requestId, "DUYET", null, approved.get("version").asLong()).andExpect(status().isConflict());

        JsonNode deck = json(send(learner, get("/api/v1/decks/" + copyId)).andExpect(status().isOk()));
        assertThat(deck.get("quyenTruyCap").asText()).isEqualTo("CONG_KHAI");
        assertThat(deck.get("yeuCauCongKhai").get("trangThai").asText()).isEqualTo("DA_DUYET");
        mockMvc.perform(get("/api/v1/library/decks/" + copyId)).andExpect(status().isOk())
                .andExpect(jsonPath("$.boThe.banSao.boGocId").value(sourceId.toString()));

        decide(author, requestId, "THU_HOI", null, approved.get("version").asLong()).andExpect(status().isBadRequest());
        decide(author, requestId, "THU_HOI", "Bản sao chép nguyên văn không ghi nguồn", approved.get("version").asLong())
                .andExpect(status().isOk()).andExpect(jsonPath("$.trangThai").value("THU_HOI"));
        assertThat(decks.findById(copyId).orElseThrow().getQuyenTruyCap()).isEqualTo(QuyenTruyCap.RIENG_TU);
        assertThat(notifications(learner.id(), "KET_QUA_CONG_KHAI")).isEqualTo(2);

        submit(learner, copyId).andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.details.lyDo").value("CHO_GUI_LAI"));
        jdbc.update("UPDATE yeu_cau_cong_khai SET xu_ly_at = xu_ly_at - INTERVAL 25 HOUR WHERE id = ?", requestId);
        submit(learner, copyId).andExpect(status().isCreated());
    }

    @Test
    void tc25_withdrawAndRejectFollowTheirRules() throws Exception {
        Long copyId = copyId(learner, sourceId);
        String first = json(submit(learner, copyId).andExpect(status().isCreated())).get("id").asText();
        send(author, delete("/api/v1/publish-requests/" + first)).andExpect(status().isNotFound());
        send(learner, delete("/api/v1/publish-requests/" + first)).andExpect(status().isOk())
                .andExpect(jsonPath("$.trangThai").value("DA_RUT"));

        JsonNode second = json(submit(learner, copyId).andExpect(status().isCreated()));
        decide(author, second.get("id").asText(), "TU_CHOI", "ngắn", second.get("version").asLong())
                .andExpect(status().isBadRequest());
        decide(author, second.get("id").asText(), "TU_CHOI", "Nội dung chưa đủ khác bộ gốc",
                second.get("version").asLong()).andExpect(status().isOk());
        assertThat(decks.findById(copyId).orElseThrow().getQuyenTruyCap()).isEqualTo(QuyenTruyCap.RIENG_TU);
        submit(learner, copyId).andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.details.guiLaiSauAt").exists());
    }

    @Test
    void tc25_sampleCopiesGoToAdminAndPremiumCopiesNeverPublish() throws Exception {
        Actor admin = actor(true);
        Long sampleId = sampleDeck(admin.id(), false);
        Long copyId = copyId(learner, sampleId);
        JsonNode pending = json(submit(learner, copyId).andExpect(status().isCreated()));
        assertThat(pending.get("nguoiDuyet").asText()).isEqualTo("ADMIN");

        decide(admin, pending.get("id").asText(), "DUYET", null, 0).andExpect(status().isNotFound());
        JsonNode queue = json(send(admin, get("/api/v1/admin/publish-requests").param("trangThai", "CHO_DUYET"))
                .andExpect(status().isOk()));
        assertThat(queue.get("items").findValuesAsString("id")).contains(pending.get("id").asText());
        send(learner, get("/api/v1/admin/publish-requests")).andExpect(status().isForbidden());
        send(admin, post("/api/v1/admin/publish-requests/" + pending.get("id").asText() + "/decision")
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(Map.of("quyetDinh", "DUYET", "version", 0))))
                .andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM nhat_ky_quan_tri WHERE hanh_dong = 'DUYET_CONG_KHAI' "
                + "AND doi_tuong_id = ?", Integer.class, copyId)).isEqualTo(1);

        Long premiumId = sampleDeck(admin.id(), true);
        BoThe premiumCopy = decks.saveAndFlush(BoThe.createCopy(learner.id(), decks.findById(premiumId).orElseThrow()));
        submit(learner, premiumCopy.getId()).andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.details.lyDo").value("BO_CAO_CAP"));
    }

    @Test
    void tc25_adminPublishesSampleCopiesWithoutQueueing() throws Exception {
        Actor admin = actor(true);
        Long sampleId = sampleDeck(admin.id(), false);
        Long copyId = copyId(admin, sampleId);
        assertThat(json(send(admin, get("/api/v1/decks/" + copyId)).andExpect(status().isOk()))
                .get("banSao").get("tuCongKhai").asBoolean()).isTrue();

        JsonNode approved = json(submit(admin, copyId).andExpect(status().isCreated()));
        assertThat(approved.get("trangThai").asText()).isEqualTo("DA_DUYET");
        assertThat(decks.findById(copyId).orElseThrow().getQuyenTruyCap()).isEqualTo(QuyenTruyCap.CONG_KHAI);
        JsonNode queue = json(send(admin, get("/api/v1/admin/publish-requests")).andExpect(status().isOk()));
        assertThat(queue.get("items").findValuesAsString("id")).doesNotContain(approved.get("id").asText());

        Long otherCopy = copyId(admin, sourceId);
        assertThat(json(submit(admin, otherCopy).andExpect(status().isCreated()))
                .get("trangThai").asText()).isEqualTo("CHO_DUYET");
    }

    @Test
    void tc25_ownerPublishesCopyOfOwnDeckEvenWhenSourceIsPrivate() throws Exception {
        Long copyId = copyId(author, sourceId);
        jdbc.update("UPDATE bo_the SET quyen_truy_cap = 'RIENG_TU' WHERE id = ?", sourceId);
        assertThat(json(send(author, get("/api/v1/decks/" + copyId)).andExpect(status().isOk()))
                .get("banSao").get("tuCongKhai").asBoolean()).isTrue();

        JsonNode approved = json(submit(author, copyId).andExpect(status().isCreated()));
        assertThat(approved.get("trangThai").asText()).isEqualTo("DA_DUYET");
        assertThat(decks.findById(copyId).orElseThrow().getQuyenTruyCap()).isEqualTo(QuyenTruyCap.CONG_KHAI);

        Long learnerCopy = copyId(learner, publicDeck(author.id(), "Bộ khác"));
        assertThat(json(send(learner, get("/api/v1/decks/" + learnerCopy)).andExpect(status().isOk()))
                .get("banSao").get("tuCongKhai").asBoolean()).isFalse();
    }

    @Test
    void tc25_lockedAuthorAndExpiredRequestsMoveOn() throws Exception {
        Actor admin = actor(true);
        Long copyId = copyId(learner, sourceId);
        String requestId = json(submit(learner, copyId).andExpect(status().isCreated())).get("id").asText();

        jdbc.update("UPDATE nguoi_dung SET trang_thai = 'BI_KHOA' WHERE id = ?", author.id());
        JsonNode queue = json(send(admin, get("/api/v1/admin/publish-requests")).andExpect(status().isOk()));
        assertThat(queue.get("items").findValuesAsString("id")).contains(requestId);
        jdbc.update("UPDATE nguoi_dung SET trang_thai = 'HOAT_DONG' WHERE id = ?", author.id());

        jdbc.update("UPDATE yeu_cau_cong_khai SET het_han_at = UTC_TIMESTAMP(3) - INTERVAL 1 DAY WHERE id = ?",
                requestId);
        JsonNode inbox = json(send(author, get("/api/v1/me/publish-requests").param("trangThai", "HET_HAN"))
                .andExpect(status().isOk()));
        assertThat(inbox.get("items").findValuesAsString("id")).contains(requestId);
        assertThat(notifications(learner.id(), "KET_QUA_CONG_KHAI")).isEqualTo(1);
        submit(learner, copyId).andExpect(status().isCreated());
    }

    private Long publicDeck(Long ownerId, String ten) {
        BoThe deck = decks.saveAndFlush(BoThe.create(ownerId, null, ten, "Mô tả", TrinhDo.CO_BAN,
                QuyenTruyCap.CONG_KHAI));
        card(deck.getId());
        return deck.getId();
    }

    private Long sampleDeck(Long ownerId, boolean premium) {
        BoThe deck = BoThe.createSample(ownerId, null, "Bộ mẫu " + UUID.randomUUID(), "Mô tả", TrinhDo.CO_BAN, null);
        deck.updateDetails(null, deck.getTen(), deck.getMoTa(), deck.getTrinhDo(), QuyenTruyCap.CONG_KHAI);
        deck.markPremium(premium);
        Long id = decks.saveAndFlush(deck).getId();
        card(id);
        return id;
    }

    private void card(Long deckId) {
        cards.saveAndFlush(TheTuVung.create(deckId, "apple", "noun", "quả táo", "/ˈæpəl/", "An apple.",
                "Một quả táo.", 2, "Tài liệu tự soạn"));
    }

    private Long copyId(Actor actor, Long id) throws Exception {
        return json(copy(actor, id, UUID.randomUUID().toString()).andExpect(status().isCreated())).get("id").asLong();
    }

    private int notifications(Long userId, String loai) {
        return jdbc.queryForObject("SELECT COUNT(*) FROM thong_bao WHERE nguoi_dung_id = ? AND loai = ?",
                Integer.class, userId, loai);
    }

    private ResultActions copy(Actor actor, Long id, String key) throws Exception {
        return send(actor, post("/api/v1/decks/" + id + "/copy").header("Idempotency-Key", key));
    }

    private ResultActions submit(Actor actor, Long deckId) throws Exception {
        return send(actor, post("/api/v1/decks/" + deckId + "/publish-requests")
                .contentType(MediaType.APPLICATION_JSON).content(toJson(Map.of("loiNhan", "Mình đã bổ sung ví dụ"))));
    }

    private ResultActions decide(Actor actor, String requestId, String quyetDinh, String lyDo, long version)
            throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("quyetDinh", quyetDinh);
        body.put("version", version);
        if (lyDo != null) {
            body.put("lyDo", lyDo);
        }
        return send(actor, post("/api/v1/publish-requests/" + requestId + "/decision")
                .contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private ResultActions patchDeck(Actor actor, String path, Map<String, Object> body) throws Exception {
        return send(actor, patch(path).contentType(MediaType.APPLICATION_JSON).content(toJson(body)));
    }

    private ResultActions send(Actor actor, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.cookie(actor.session()).with(xsrf()));
    }

    private JsonNode json(ResultActions actions) throws Exception {
        return jsonMapper.readTree(actions.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private Actor actor(boolean admin) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Publish tester", passwords.encode(PASSWORD),
                "Asia/Ho_Chi_Minh", roles.findByMa(VaiTro.USER).orElseThrow());
        if (admin) {
            user.replaceRoles(Set.of(roles.findByMa(VaiTro.USER).orElseThrow(),
                    roles.findByMa(VaiTro.ADMIN).orElseThrow()));
        }
        user.verifyEmail(clock.instant());
        Long id = users.saveAndFlush(user).getId();
        Cookie session = mockMvc.perform(post("/api/v1/auth/login").with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("email", email, "password", PASSWORD))))
                .andExpect(status().isOk()).andReturn().getResponse().getCookie("SESSION");
        assertThat(session).isNotNull();
        return new Actor(id, session);
    }

    private record Actor(Long id, Cookie session) { }
}
