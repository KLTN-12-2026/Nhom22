package com.do_an_tot_nghiep.k28.content;

import com.do_an_tot_nghiep.k28.account.entity.NguoiDung;
import com.do_an_tot_nghiep.k28.account.repository.NguoiDungRepository;
import com.do_an_tot_nghiep.k28.account.repository.VaiTroRepository;
import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.concurrent.Executors;
import java.util.concurrent.CountDownLatch;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class FR03CatalogTest extends AbstractIntegrationTest {
    private static final String PASSWORD = "matkhau123";

    @Autowired
    NguoiDungRepository users;

    @Autowired
    VaiTroRepository roles;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JdbcTemplate jdbc;

    @ParameterizedTest
    @ValueSource(strings = {"topics", "tags"})
    void fr03_referencedCatalogCannotBeDeleted(String resource) throws Exception {
        String catalogId = create(path(resource), "Referenced " + UUID.randomUUID());
        String userBody = mockMvc.perform(get("/api/v1/me").cookie(learner))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        long ownerId = Long.parseLong(jsonMapper.readTree(userBody).get("id").asString());
        jdbc.update("insert into bo_the(chu_so_huu_id,ten,trinh_do,chu_de_id) values (?,?,?,?)",
                ownerId, "Catalog FK", "CO_BAN", resource.equals("topics") ? Long.valueOf(catalogId) : null);
        Long deckId = jdbc.queryForObject("select max(id) from bo_the where chu_so_huu_id=?", Long.class, ownerId);
        if (resource.equals("tags")) {
            jdbc.update("insert into the_tu_vung(bo_the_id,tu,nghia_vi) values (?,?,?)", deckId, "word", "tu");
            Long cardId = jdbc.queryForObject("select max(id) from the_tu_vung where bo_the_id=?", Long.class, deckId);
            jdbc.update("insert into the_nhan(the_id,nhan_id) values (?,?)", cardId, Long.valueOf(catalogId));
        }
        mockMvc.perform(delete(path(resource) + "/" + catalogId).cookie(admin).with(xsrf()))
                .andExpect(status().isConflict());
        mockMvc.perform(get(path(resource) + "/" + catalogId).cookie(admin)).andExpect(status().isOk());
    }

    @ParameterizedTest
    @ValueSource(strings = {"topics", "tags"})
    void fr03_concurrentDuplicateAndVersionUpdatesPreserveData(String resource) throws Exception {
        String name = "Concurrent " + UUID.randomUUID();
        CountDownLatch start = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            java.util.concurrent.Callable<Integer> createTask = () -> {
                start.await();
                return send(post(path(resource)), Map.of("ten", name)).andReturn().getResponse().getStatus();
            };
            var first = pool.submit(createTask);
            var second = pool.submit(createTask);
            start.countDown();
            assertThat(List.of(first.get(), second.get())).containsExactlyInAnyOrder(201, 409);
        }
        String id = create(path(resource), "Version race " + UUID.randomUUID());
        CountDownLatch updateStart = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            java.util.concurrent.Callable<Integer> updateTask = () -> {
                updateStart.await();
                return send(put(path(resource) + "/" + id), Map.of("ten", "Changed " + UUID.randomUUID(), "version", 0))
                        .andReturn().getResponse().getStatus();
            };
            var first = pool.submit(updateTask);
            var second = pool.submit(updateTask);
            updateStart.countDown();
            assertThat(List.of(first.get(), second.get())).containsExactlyInAnyOrder(200, 409);
        }
        CountDownLatch deleteStart = new CountDownLatch(1);
        try (var pool = Executors.newFixedThreadPool(2)) {
            java.util.concurrent.Callable<Integer> deleteTask = () -> {
                deleteStart.await();
                return mockMvc.perform(delete(path(resource) + "/" + id).cookie(admin).with(xsrf()))
                        .andReturn().getResponse().getStatus();
            };
            var first = pool.submit(deleteTask);
            var second = pool.submit(deleteTask);
            deleteStart.countDown();
            var results = List.of(first.get(), second.get());
            assertThat(results).contains(204);
            assertThat(results).allMatch(code -> code == 204 || code == 404 || code == 409);
        }
        mockMvc.perform(get(path(resource) + "/" + id).cookie(admin)).andExpect(status().isNotFound());
    }

    Cookie admin;
    Cookie learner;

    @BeforeEach
    void loginUsers() throws Exception {
        admin = login("ADMIN");
        learner = login("USER");
    }

    @ParameterizedTest
    @ValueSource(strings = {"topics", "tags"})
    void fr03_createReadUpdateDelete(String resource) throws Exception {
        String path = path(resource);
        String name = "Catalog-" + UUID.randomUUID().toString().replace("-", "");

        var created = send(post(path), Map.of("ten", "  " + name + "  "))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isString())
                .andExpect(jsonPath("$.ten").value(name))
                .andExpect(jsonPath("$.version").value(0))
                .andReturn();

        String id = jsonMapper.readTree(
                created.getResponse().getContentAsString()
        ).get("id").asText();

        assertThat(created.getResponse().getHeader("Location"))
                .isEqualTo(path + "/" + id);

        mockMvc.perform(get(path + "/" + id).cookie(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten").value(name));

        send(put(path + "/" + id), Map.of(
                "ten", name + "-updated", "version", 0
        ))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten").value(name + "-updated"))
                .andExpect(jsonPath("$.version").value(1));

        mockMvc.perform(delete(path + "/" + id).cookie(admin).with(xsrf()))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        mockMvc.perform(get(path + "/" + id).cookie(admin))
                .andExpect(status().isNotFound());
    }

    @ParameterizedTest
    @ValueSource(strings = {"topics", "tags"})
    void fr03_duplicateNameReturns409(String resource) throws Exception {
        String path = path(resource);
        String name = "Duplicate-" + UUID.randomUUID();
        create(path, name);

        send(post(path), Map.of("ten", name))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"))
                .andExpect(jsonPath(
                        "$.fieldErrors[?(@.field == 'ten')]"
                ).exists());

        String otherId = create(path, "Other-" + UUID.randomUUID());
        send(put(path + "/" + otherId), Map.of(
                "ten", name, "version", 0
        ))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"topics", "tags"})
    void fr03_staleVersionDoesNotOverwrite(String resource) throws Exception {
        String path = path(resource);
        String name = "Version-" + UUID.randomUUID();
        String id = create(path, name);

        send(put(path + "/" + id), Map.of(
                "ten", name + "-first", "version", 0
        )).andExpect(status().isOk());

        send(put(path + "/" + id), Map.of(
                "ten", name + "-stale", "version", 0
        ))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VERSION_CONFLICT"));

        mockMvc.perform(get(path + "/" + id).cookie(admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ten").value(name + "-first"))
                .andExpect(jsonPath("$.version").value(1));
    }

    @ParameterizedTest
    @ValueSource(strings = {"topics", "tags"})
    void fr03_invalidNameReturns400(String resource) throws Exception {
        String path = path(resource);
        int maxLength = resource.equals("topics") ? 100 : 50;

        for (String name : List.of("   ", "a".repeat(maxLength + 1))) {
            send(post(path), Map.of("ten", name))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                    .andExpect(jsonPath(
                            "$.fieldErrors[?(@.field == 'ten')]"
                    ).exists());
        }
    }

    @ParameterizedTest
    @ValueSource(strings = {"topics", "tags"})
    void fr13_adminEndpointsRejectGuestAndLearner(String resource)
            throws Exception {
        String path = path(resource);

        for (var request : adminRequests(path)) {
            mockMvc.perform(request.with(xsrf())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isUnauthorized());
        }

        for (var request : adminRequests(path)) {
            mockMvc.perform(request.cookie(learner).with(xsrf())
                            .contentType(MediaType.APPLICATION_JSON))
                    .andExpect(status().isForbidden());
        }
    }

    @Test
    void fr03_publicTagsCanBeReadByGuestAndLearner() throws Exception {
        create(path("tags"), "Public tag " + UUID.randomUUID());

        for (var request : List.of(
                get("/api/v1/public/tags"),
                get("/api/v1/public/tags").cookie(learner)
        )) {
            mockMvc.perform(request)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.page").value(0))
                    .andExpect(jsonPath("$.size").value(20))
                    .andExpect(jsonPath("$.items[0].id").isString())
                    .andExpect(jsonPath("$.items[0].ten").isString())
                    .andExpect(jsonPath("$.items[0].version").isNumber());
        }
    }

    @Test
    void fr03_publicTagsRejectInvalidPagination() throws Exception {
        for (var request : List.of(
                get("/api/v1/public/tags").param("page", "-1"),
                get("/api/v1/public/tags").param("size", "0"),
                get("/api/v1/public/tags").param("size", "101")
        )) {
            mockMvc.perform(request)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        }
    }

    private List<MockHttpServletRequestBuilder> adminRequests(String path) {
        return List.of(
                get(path),
                get(path + "/1"),
                post(path).content(toJson(Map.of("ten", "Denied"))),
                put(path + "/1").content(toJson(Map.of(
                        "ten", "Denied", "version", 0
                ))),
                delete(path + "/1")
        );
    }

    private String create(String path, String name) throws Exception {
        var result = send(post(path), Map.of("ten", name))
                .andExpect(status().isCreated())
                .andReturn();
        return jsonMapper.readTree(
                result.getResponse().getContentAsString()
        ).get("id").asText();
    }

    private ResultActions send(
            MockHttpServletRequestBuilder request, Object body
    ) throws Exception {
        return mockMvc.perform(request.cookie(admin).with(xsrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(toJson(body)));
    }

    private Cookie login(String roleCode) throws Exception {
        String email = UUID.randomUUID() + "@test.local";
        var role = roles.findByMa(roleCode).orElseThrow();
        NguoiDung user = NguoiDung.register(
                email, "Catalog tester", passwordEncoder.encode(PASSWORD),
                "Asia/Ho_Chi_Minh", role
        );
        user.verifyEmail(Instant.now());
        users.saveAndFlush(user);

        Cookie session = mockMvc.perform(post("/api/v1/auth/login")
                        .with(xsrf()).with(randomIp())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(toJson(Map.of(
                                "email", email, "password", PASSWORD
                        ))))
                .andExpect(status().isOk())
                .andReturn().getResponse().getCookie("SESSION");

        assertThat(session).isNotNull();
        return session;
    }

    private String path(String resource) {
        return "/api/v1/admin/" + resource;
    }
}
