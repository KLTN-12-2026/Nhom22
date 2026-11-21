package com.do_an_tot_nghiep.k28.common;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.entity.VaiTro;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.common.realtime.LoaiSuKien;
import com.do_an_tot_nghiep.k28.common.realtime.RealtimeService;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.BooleanSupplier;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class FR12RealtimeTest extends AbstractIntegrationTest {

    private static final String PASSWORD = "matkhau123";

    @Autowired
    private NguoiDungRepository users;

    @Autowired
    private VaiTroRepository roles;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private RealtimeService realtime;

    @Autowired
    private PlatformTransactionManager txManager;

    private record Actor(Long id, Cookie session) {
    }

    @Test
    void tc26_streamNeedsLoginAndSendsReady() throws Exception {
        mockMvc.perform(get("/api/v1/events/stream")).andExpect(status().isUnauthorized());
        MockHttpServletResponse stream = open(actor(false));
        assertThat(stream.getContentType()).startsWith(MediaType.TEXT_EVENT_STREAM_VALUE);
        assertThat(stream.getHeader("Cache-Control")).contains("no-cache");
        waitFor(() -> body(stream).contains("event:SAN_SANG"));
    }

    @Test
    void tc26_eventsReachOnlyTheTargetUserOrAdmins() throws Exception {
        Actor a = actor(false);
        Actor b = actor(false);
        Actor admin = actor(true);
        MockHttpServletResponse sa = open(a);
        MockHttpServletResponse sb = open(b);
        MockHttpServletResponse sAdmin = open(admin);

        realtime.toUser(a.id(), LoaiSuKien.THONG_BAO_MOI, 42L);
        waitFor(() -> body(sa).contains("event:THONG_BAO_MOI"));
        assertThat(body(sa)).contains("\"id\":\"42\"");

        realtime.toAdmins(LoaiSuKien.HANG_CHO_QUAN_TRI);
        waitFor(() -> body(sAdmin).contains("event:HANG_CHO_QUAN_TRI"));

        realtime.toEveryone(LoaiSuKien.THONG_BAO_HE_THONG);
        waitFor(() -> body(sb).contains("event:THONG_BAO_HE_THONG") && body(sa).contains("event:THONG_BAO_HE_THONG"));

        assertThat(body(sb)).doesNotContain("THONG_BAO_MOI").doesNotContain("HANG_CHO_QUAN_TRI");
        assertThat(body(sa)).doesNotContain("HANG_CHO_QUAN_TRI");
        assertThat(body(sAdmin)).doesNotContain("THONG_BAO_MOI");
    }

    @Test
    void tc26_rolledBackWorkSendsNothing() throws Exception {
        Actor a = actor(false);
        MockHttpServletResponse stream = open(a);
        new TransactionTemplate(txManager).executeWithoutResult(status -> {
            realtime.toUser(a.id(), LoaiSuKien.GOI_THAY_DOI, null);
            status.setRollbackOnly();
        });
        realtime.toUser(a.id(), LoaiSuKien.THANH_TOAN, "M1");
        waitFor(() -> body(stream).contains("event:THANH_TOAN"));
        assertThat(body(stream)).doesNotContain("GOI_THAY_DOI");
    }

    @Test
    void tc26_lockingAccountPushesLockEventAndAdminQueueCounts() throws Exception {
        Actor learner = actor(false);
        Actor admin = actor(true);
        MockHttpServletResponse stream = open(learner);

        mockMvc.perform(get("/api/v1/admin/dashboard/queue").cookie(learner.session()))
                .andExpect(status().isForbidden());
        String queue = mockMvc.perform(get("/api/v1/admin/dashboard/queue").cookie(admin.session()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(jsonMapper.readTree(queue).has("baoCaoChoXuLy")).isTrue();

        mockMvc.perform(patch("/api/v1/admin/users/" + learner.id() + "/status").with(xsrf()).cookie(admin.session())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of("trangThai", "BI_KHOA", "lyDo", "Kiểm thử realtime"))))
                .andExpect(status().isOk());
        waitFor(() -> body(stream).contains("event:TAI_KHOAN_BI_KHOA"));
    }

    private MockHttpServletResponse open(Actor actor) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/events/stream").cookie(actor.session())
                        .accept(MediaType.TEXT_EVENT_STREAM))
                .andExpect(request().asyncStarted())
                .andReturn();
        return result.getResponse();
    }

    private static String body(MockHttpServletResponse response) {
        try {
            return response.getContentAsString();
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static void waitFor(BooleanSupplier condition) throws InterruptedException {
        long deadline = System.currentTimeMillis() + 5_000;
        while (!condition.getAsBoolean()) {
            if (System.currentTimeMillis() > deadline) {
                throw new AssertionError("Realtime event did not arrive in 5 s");
            }
            Thread.sleep(50);
        }
    }

    private Actor actor(boolean admin) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        NguoiDung user = NguoiDung.register(email, "Realtime tester", passwordEncoder.encode(PASSWORD),
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
