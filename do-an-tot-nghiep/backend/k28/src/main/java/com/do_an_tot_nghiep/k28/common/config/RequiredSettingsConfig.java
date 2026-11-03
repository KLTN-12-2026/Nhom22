package com.do_an_tot_nghiep.k28.common.config;

import java.util.List;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration(proxyBeanMethods = false)
public class RequiredSettingsConfig {

    static final List<String> REQUIRED = List.of(
            "spring.datasource.username",
            "spring.datasource.password",
            "spring.security.oauth2.client.registration.google.client-id",
            "spring.security.oauth2.client.registration.google.client-secret",
            "app.s3.access-key",
            "app.s3.secret-key"
    );

    @Bean
    static BeanFactoryPostProcessor requiredSettings(Environment environment) {
        return beanFactory -> check(environment);
    }

    static void check(Environment environment) {
        for (String key : REQUIRED) {
            String value;
            try {
                value = environment.getProperty(key);
            } catch (IllegalArgumentException e) {
                throw missing(key);
            }
            if (value == null || value.isBlank()) {
                throw missing(key);
            }
        }
    }

    private static IllegalStateException missing(String key) {
        return new IllegalStateException("Missing required setting " + key
                + ": set its environment variable or run with SPRING_PROFILES_ACTIVE=dev");
    }
}
