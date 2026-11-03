package com.do_an_tot_nghiep.k28.common.config;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class RequiredSettingsConfigTest {

    @Test
    void acceptsEverySettingWhenPresent() {
        assertThatCode(() -> RequiredSettingsConfig.check(complete())).doesNotThrowAnyException();
    }

    @Test
    void rejectsMissingBlankOrUnresolvedSecrets() {
        assertThatThrownBy(() -> RequiredSettingsConfig.check(complete().withProperty("app.s3.secret-key", " ")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("app.s3.secret-key");
        assertThatThrownBy(() -> RequiredSettingsConfig.check(
                complete().withProperty("spring.datasource.password", "${DB_PASSWORD}")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("spring.datasource.password");
        MockEnvironment withoutGoogle = new MockEnvironment();
        RequiredSettingsConfig.REQUIRED.stream()
                .filter(key -> !key.endsWith("client-secret"))
                .forEach(key -> withoutGoogle.setProperty(key, "x"));
        assertThatThrownBy(() -> RequiredSettingsConfig.check(withoutGoogle))
                .hasMessageContaining("google.client-secret");
    }

    private MockEnvironment complete() {
        MockEnvironment environment = new MockEnvironment();
        RequiredSettingsConfig.REQUIRED.forEach(key -> environment.setProperty(key, "value"));
        return environment;
    }
}
