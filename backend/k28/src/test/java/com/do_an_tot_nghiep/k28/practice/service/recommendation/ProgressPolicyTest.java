package com.do_an_tot_nghiep.k28.practice.service.recommendation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;
import org.junit.jupiter.api.Test;

class ProgressPolicyTest {

    private static final Instant NOW = Instant.parse("2026-11-12T03:00:00Z");
    private final ProgressPolicy policy = new ProgressPolicy(
            new RecommendationProperties.TienBo(30, 7, 5, 3, 0.5, 5, 0));

    @Test
    void matchesExactlyAtEveryThreshold() {
        assertThat(policy.matches(5, 3, 5, 0)).isTrue();
    }

    @Test
    void rejectsTooFewOldObservations() {
        assertThat(policy.matches(4, 3, 5, 0)).isFalse();
    }

    @Test
    void rejectsTooFewOldMistakes() {
        assertThat(policy.matches(5, 2, 5, 0)).isFalse();
    }

    @Test
    void appliesOldMistakeRatio() {
        assertThat(policy.matches(6, 3, 5, 0)).isTrue();
        assertThat(policy.matches(7, 3, 5, 0)).isFalse();
    }

    @Test
    void rejectsTooFewRecentObservations() {
        assertThat(policy.matches(5, 3, 4, 0)).isFalse();
    }

    @Test
    void rejectsAnyRecentMistake() {
        assertThat(policy.matches(5, 3, 5, 1)).isFalse();
        assertThat(policy.matches(5, 3, 10, 1)).isFalse();
    }

    @Test
    void windowsEndAtNow() {
        assertThat(policy.oldFrom(NOW)).isEqualTo(NOW.minus(Duration.ofDays(30)));
        assertThat(policy.recentFrom(NOW)).isEqualTo(NOW.minus(Duration.ofDays(7)));
    }

    @Test
    void rejectsOverlappingWindowConfig() {
        assertThatThrownBy(() -> new RecommendationProperties.TienBo(7, 7, 5, 3, 0.5, 5, 0))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
