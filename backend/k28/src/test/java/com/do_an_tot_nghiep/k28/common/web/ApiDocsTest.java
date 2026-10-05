package com.do_an_tot_nghiep.k28.common.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.do_an_tot_nghiep.k28.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;

class ApiDocsTest extends AbstractIntegrationTest {

    @Test
    void pingIsPublic() throws Exception {
        mockMvc.perform(get("/api/v1/public/ping"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.serverTime").isNotEmpty());
    }

    @Test
    void openApiDocumentsPingAndSecurity() throws Exception {
        mockMvc.perform(get("/v3/api-docs/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/v1/public/ping'].get").exists())
                .andExpect(jsonPath("$.components.securitySchemes.sessionCookie.in").value("cookie"))
                .andExpect(jsonPath("$.components.securitySchemes.csrfHeader.name").value("X-XSRF-TOKEN"));
    }

    @Test
    void operationSecurityMatchesAnonymousAndAuthenticatedRequests() throws Exception {
        mockMvc.perform(get("/v3/api-docs/all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paths['/api/v1/public/topics'].get.security").isEmpty())
                .andExpect(jsonPath("$.paths['/api/v1/auth/csrf'].get.security").isEmpty())
                .andExpect(jsonPath("$.paths['/api/v1/auth/register'].post.security[0].csrfHeader").exists())
                .andExpect(jsonPath("$.paths['/api/v1/auth/register'].post.security[0].sessionCookie").doesNotExist())
                .andExpect(jsonPath("$.paths['/api/v1/me'].get.security[0].sessionCookie").exists())
                .andExpect(jsonPath("$.paths['/api/v1/me'].get.security[0].csrfHeader").doesNotExist())
                .andExpect(jsonPath("$.paths['/api/v1/decks'].post.security[0].sessionCookie").exists())
                .andExpect(jsonPath("$.paths['/api/v1/decks'].post.security[0].csrfHeader").exists());
    }

    @Test
    void swaggerUiIsReachable() throws Exception {
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk());
    }
}
