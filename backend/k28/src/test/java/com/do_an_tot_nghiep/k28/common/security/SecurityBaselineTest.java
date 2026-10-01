package com.do_an_tot_nghiep.k28.common.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.common.web.RequestIdFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(controllers = CsrfController.class)
@Import({SecurityConfig.class, JsonAuthHandlers.class, RequestIdFilter.class})
class SecurityBaselineTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    AuthenticationSuccessHandler googleLoginSuccessHandler;

    @Test
    void tc01_protectedApiWithoutLoginReturns401Json() throws Exception {
        mockMvc.perform(get("/api/v1/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHENTICATED"))
                .andExpect(jsonPath("$.requestId").isNotEmpty());
    }

    @Test
    void tc02_postWithoutCsrfReturns403Json() throws Exception {
        mockMvc.perform(post("/api/v1/auth/csrf"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }

    @Test
    void tc03_csrfEndpointIssuesCookie() throws Exception {
        mockMvc.perform(get("/api/v1/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.headerName").value("X-XSRF-TOKEN"))
                .andExpect(cookie().exists("XSRF-TOKEN"));
    }

    @Test
    @WithMockUser(roles = "USER")
    void tc04_userOnAdminApiReturns403Json() throws Exception {
        mockMvc.perform(get("/api/v1/admin/users"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
    }
}