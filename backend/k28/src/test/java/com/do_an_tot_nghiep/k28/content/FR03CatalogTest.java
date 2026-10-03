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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
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
