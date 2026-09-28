package com.do_an_tot_nghiep.k28.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    public static final String SESSION_SCHEME = "sessionCookie";
    public static final String CSRF_SCHEME = "csrfHeader";

    @Bean
    OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("VocabLearning API")
                        .version("v1")
                        .description("Xác thực bằng cookie SESSION. Request ghi (POST/PUT/PATCH/DELETE) cần header X-XSRF-TOKEN lấy từ GET /api/v1/auth/csrf."))
                .components(new Components()
                        .addSecuritySchemes(SESSION_SCHEME, new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.COOKIE)
                                .name("SESSION"))
                        .addSecuritySchemes(CSRF_SCHEME, new SecurityScheme()
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)
                                .name("X-XSRF-TOKEN")))
                .addSecurityItem(new SecurityRequirement()
                        .addList(SESSION_SCHEME)
                        .addList(CSRF_SCHEME));
    }

    @Bean
    GroupedOpenApi allApi() {
        return group("all", "/api/v1/**");
    }

    @Bean
    GroupedOpenApi accountApi() {
        return group("account", "/api/v1/auth/**", "/api/v1/me/**");
    }

    @Bean
    GroupedOpenApi contentApi() {
        return group("content", "/api/v1/decks/**", "/api/v1/cards/**", "/api/v1/library/**",
                "/api/v1/imports/**", "/api/v1/files/**");
    }

    @Bean
    GroupedOpenApi learningApi() {
        return group("learning", "/api/v1/learning/**", "/api/v1/notebook/**");
    }

    @Bean
    GroupedOpenApi practiceApi() {
        return group("practice", "/api/v1/practice/**");
    }

    @Bean
    GroupedOpenApi aiSpeakingApi() {
        return group("ai-speaking", "/api/v1/ai/**", "/api/v1/pronunciation/**");
    }

    @Bean
    GroupedOpenApi engagementApi() {
        return group("engagement", "/api/v1/statistics/**", "/api/v1/rewards/**", "/api/v1/badges/**",
                "/api/v1/challenges/**", "/api/v1/notifications/**", "/api/v1/reports/**");
    }

    @Bean
    GroupedOpenApi adminApi() {
        return group("admin", "/api/v1/admin/**");
    }

    @Bean
    GroupedOpenApi publicApi() {
        return group("public", "/api/v1/public/**");
    }

    private static GroupedOpenApi group(String name, String... paths) {
        return GroupedOpenApi.builder().group(name).pathsToMatch(paths).build();
    }
}