package com.do_an_tot_nghiep.k28.practice.service.recommendation;

import static org.assertj.core.api.Assertions.assertThat;

import com.do_an_tot_nghiep.k28.practice.dto.RecommendationEvidenceResponse;
import com.do_an_tot_nghiep.k28.practice.dto.RecommendationResponse;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;

class RecommendationServiceTest {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-11-12T03:00:00Z"), ZoneOffset.UTC);
    private static final RecommendationProperties PROPERTIES = new RecommendationProperties(
            4, 2, 20,
            new RecommendationProperties.TienBo(30, 7, 5, 3, 0.5, 5, 0),
            new RecommendationProperties.PhatAmThap(false, 60));

    @Test
    void returnsEmptyListWhenNoRuleMatches() {
        RecommendationService service = new RecommendationService(
                List.of(rule(MaLyDoGoiY.QUEN_NHIEU), rule(MaLyDoGoiY.TIEN_BO)), PROPERTIES, CLOCK);
        assertThat(service.list(1L)).isEmpty();
    }

    @Test
    void ordersByReasonAndCapsEachReason() {
        RecommendationService service = new RecommendationService(List.of(
                rule(MaLyDoGoiY.TIEN_BO, card(MaLyDoGoiY.TIEN_BO, 9L)),
                rule(MaLyDoGoiY.QUEN_NHIEU,
                        card(MaLyDoGoiY.QUEN_NHIEU, 1L),
                        card(MaLyDoGoiY.QUEN_NHIEU, 2L),
                        card(MaLyDoGoiY.QUEN_NHIEU, 3L))), PROPERTIES, CLOCK);

        List<RecommendationResponse> result = service.list(1L);

        assertThat(result).extracting(RecommendationResponse::reasonCode)
                .containsExactly(MaLyDoGoiY.QUEN_NHIEU, MaLyDoGoiY.QUEN_NHIEU, MaLyDoGoiY.TIEN_BO);
        assertThat(result.get(0).cardIds()).containsExactly("1");
    }

    @Test
    void skipsCardsAlreadyUsedByHigherReason() {
        RecommendationService service = new RecommendationService(List.of(
                rule(MaLyDoGoiY.QUEN_NHIEU, card(MaLyDoGoiY.QUEN_NHIEU, 1L)),
                rule(MaLyDoGoiY.CAP_DE_NHAM, card(MaLyDoGoiY.CAP_DE_NHAM, 1L, 2L), card(MaLyDoGoiY.CAP_DE_NHAM, 3L, 4L)),
                rule(MaLyDoGoiY.TIEN_BO, card(MaLyDoGoiY.TIEN_BO, 1L), card(MaLyDoGoiY.TIEN_BO, 5L))),
                PROPERTIES, CLOCK);

        List<RecommendationResponse> result = service.list(1L);

        assertThat(result).extracting(response -> response.reasonCode() + ":" + response.cardIds())
                .containsExactly("QUEN_NHIEU:[1]", "CAP_DE_NHAM:[3, 4]", "TIEN_BO:[5]");
    }

    @Test
    void overdueNeitherConsumesNorSkipsCards() {
        RecommendationCandidate overdue = new RecommendationCandidate(
                MaLyDoGoiY.QUA_HAN_NHIEU, "quá hạn", List.of(1L, 2L), RecommendationEvidenceResponse.builder().build(), false);
        RecommendationService service = new RecommendationService(List.of(
                rule(MaLyDoGoiY.QUEN_NHIEU, card(MaLyDoGoiY.QUEN_NHIEU, 1L)),
                rule(MaLyDoGoiY.QUA_HAN_NHIEU, overdue),
                rule(MaLyDoGoiY.TIEN_BO, card(MaLyDoGoiY.TIEN_BO, 2L))), PROPERTIES, CLOCK);

        assertThat(service.list(1L)).extracting(RecommendationResponse::reasonCode)
                .containsExactly(MaLyDoGoiY.QUEN_NHIEU, MaLyDoGoiY.QUA_HAN_NHIEU, MaLyDoGoiY.TIEN_BO);
    }

    @Test
    void capsTotalRecommendations() {
        RecommendationService service = new RecommendationService(List.of(
                rule(MaLyDoGoiY.QUEN_NHIEU, card(MaLyDoGoiY.QUEN_NHIEU, 1L), card(MaLyDoGoiY.QUEN_NHIEU, 2L)),
                rule(MaLyDoGoiY.SAI_CHINH_TA, card(MaLyDoGoiY.SAI_CHINH_TA, 3L), card(MaLyDoGoiY.SAI_CHINH_TA, 4L)),
                rule(MaLyDoGoiY.TIEN_BO, card(MaLyDoGoiY.TIEN_BO, 5L))), PROPERTIES, CLOCK);

        assertThat(service.list(1L)).hasSize(4)
                .extracting(RecommendationResponse::reasonCode)
                .doesNotContain(MaLyDoGoiY.TIEN_BO);
    }

    private static RecommendationCandidate card(MaLyDoGoiY code, Long... ids) {
        return new RecommendationCandidate(code, code.name(), List.of(ids), RecommendationEvidenceResponse.builder().build(), true);
    }

    private static RecommendationRule rule(MaLyDoGoiY code, RecommendationCandidate... candidates) {
        return new RecommendationRule() {
            @Override
            public MaLyDoGoiY code() {
                return code;
            }

            @Override
            public List<RecommendationCandidate> evaluate(Long userId, Instant now) {
                return List.of(candidates);
            }
        };
    }
}
