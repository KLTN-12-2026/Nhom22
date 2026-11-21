package com.do_an_tot_nghiep.k28.billing.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(BillingProperties.class)
public class BillingConfig implements WebMvcConfigurer {

    private final SubscriptionGuard subscriptionGuard;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(subscriptionGuard)
                .addPathPatterns("/api/v1/**")
                .excludePathPatterns(
                        "/api/v1/auth/**",
                        "/api/v1/public/**",
                        "/api/v1/library/**",
                        "/api/v1/admin/**",
                        "/api/v1/me",
                        "/api/v1/me/**",
                        "/api/v1/billing/**",
                        "/api/v1/notifications/**",
                        "/api/v1/events/**",
                        "/api/v1/reports",
                        "/api/v1/files/**",
                        "/api/v1/decks/*/export",
                        "/api/v1/ping");
    }
}
