package com.do_an_tot_nghiep.k28.practice.service.recommendation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.do_an_tot_nghiep.k28.learning.entity.enums.DanhGia;
import com.do_an_tot_nghiep.k28.learning.service.LearningPlanService;
import com.do_an_tot_nghiep.k28.learning.service.OverdueSummary;
import com.do_an_tot_nghiep.k28.practice.repository.LapseStatRow;
import com.do_an_tot_nghiep.k28.practice.repository.NotebookCardRow;
import com.do_an_tot_nghiep.k28.practice.repository.SoTayTuKhoRepository;
import com.do_an_tot_nghiep.k28.practice.repository.SoTayTuKhoRepository.PairStatRow;
import com.do_an_tot_nghiep.k28.practice.repository.SoTayTuKhoRepository.ProgressStatRow;
import com.do_an_tot_nghiep.k28.practice.repository.SoTayTuKhoRepository.SpellingStatRow;
import com.do_an_tot_nghiep.k28.practice.service.NotebookProperties;
import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.junit.jupiter.api.Test;

class RecommendationRulesTest {

    private static final Instant NOW = Instant.parse("2026-11-12T03:00:00Z");
    private static final Long USER = 7L;
    private static final NotebookProperties NOTEBOOK = new NotebookProperties(3, 30, 5, 2, 2);
    private static final RecommendationProperties PROPERTIES = new RecommendationProperties(
            10, 2, 20,
            new RecommendationProperties.TienBo(30, 7, 5, 3, 0.5, 5, 0),
            new RecommendationProperties.PhatAmThap(false, 60));

    private final SoTayTuKhoRepository notebook = mock(SoTayTuKhoRepository.class);
    private final RecommendationCards cards = mock(RecommendationCards.class);

    @Test
    void forgettingKeepsCardsAtThresholdAndSortsByCount() {
        when(notebook.lapseStats(eq(USER), eq(NOW.minus(Duration.ofDays(30))), eq(DanhGia.QUEN), eq("ON_TAP")))
                .thenReturn(List.of(
                        new LapseStatRow(1L, 2L, NOW),
                        new LapseStatRow(2L, 3L, NOW),
                        new LapseStatRow(3L, 5L, NOW.minusSeconds(60)),
                        new LapseStatRow(4L, 4L, NOW)));
        usable(2L, 3L);

        List<RecommendationCandidate> result = new ForgettingRule(notebook, cards, NOTEBOOK).evaluate(USER, NOW);

        assertThat(result).extracting(RecommendationCandidate::cardIds).containsExactly(List.of(3L), List.of(2L));
        assertThat(result.get(0).message()).isEqualTo("Ôn lại ‘w3’ và thêm mẹo nhớ: bạn quên 5 lần trong 30 ngày qua");
        assertThat(result.get(0).evidence().soLanQuen()).isEqualTo(5);
        assertThat(result.get(0).evidence().soNgay()).isEqualTo(30);
        assertThat(result.get(0).exclusive()).isTrue();
    }

    @Test
    void spellingUsesRepositoryCountsInMessage() {
        SpellingStatRow row = mock(SpellingStatRow.class);
        when(row.getTheId()).thenReturn(5L);
        when(row.getSoSai()).thenReturn(3L);
        when(row.getSoLuot()).thenReturn(5L);
        when(row.getLanCuoiAt()).thenReturn(NOW);
        when(notebook.spellingStats(USER, 5, 2)).thenReturn(List.of(row));
        usable(5L);

        List<RecommendationCandidate> result = new SpellingRule(notebook, cards, NOTEBOOK).evaluate(USER, NOW);

        assertThat(result).singleElement().satisfies(candidate -> {
            assertThat(candidate.reasonCode()).isEqualTo(MaLyDoGoiY.SAI_CHINH_TA);
            assertThat(candidate.message()).isEqualTo("Luyện viết ‘w5’ vì bạn viết sai 3 trong 5 lượt gần đây");
            assertThat(candidate.evidence().soSai()).isEqualTo(3);
            assertThat(candidate.evidence().soLuot()).isEqualTo(5);
        });
    }

    @Test
    void confusingPairNeedsThresholdAndBothUsableCards() {
        PairStatRow strong = pair(10L, 1L, 2L, 3);
        PairStatRow weak = pair(11L, 3L, 4L, 1);
        PairStatRow deleted = pair(12L, 1L, 9L, 4);
        when(notebook.pairStats(USER)).thenReturn(List.of(deleted, strong, weak));
        when(notebook.findByNguoiDungId(USER)).thenReturn(List.of());
        usable(1L, 2L, 3L, 4L);

        List<RecommendationCandidate> result = new ConfusingPairRule(notebook, cards, NOTEBOOK).evaluate(USER, NOW);

        assertThat(result).singleElement().satisfies(candidate -> {
            assertThat(candidate.cardIds()).containsExactly(1L, 2L);
            assertThat(candidate.message()).isEqualTo("Phân biệt ‘w1’ và ‘w2’: bạn chọn nhầm 3 lần");
            assertThat(candidate.evidence().capId()).isEqualTo("10");
        });
    }

    @Test
    void progressFiltersByPolicyAndBuildsEvidence() {
        ProgressStatRow passed = progress(6L, 5, 3, 5, 0);
        ProgressStatRow fewRecent = progress(7L, 5, 3, 4, 0);
        when(notebook.progressStats(USER, NOW.minus(Duration.ofDays(30)), NOW.minus(Duration.ofDays(7))))
                .thenReturn(List.of(passed, fewRecent));
        usable(6L, 7L);

        List<RecommendationCandidate> result = new ProgressRule(notebook, cards, PROPERTIES).evaluate(USER, NOW);

        assertThat(result).singleElement().satisfies(candidate -> {
            assertThat(candidate.reasonCode()).isEqualTo(MaLyDoGoiY.TIEN_BO);
            assertThat(candidate.message()).isEqualTo("‘w6’: sai 3/5 lượt trước đó, đúng 5/5 lượt trong 7 ngày gần đây");
            assertThat(candidate.evidence().soLuotCu()).isEqualTo(5);
            assertThat(candidate.evidence().soSaiCu()).isEqualTo(3);
            assertThat(candidate.evidence().soNgayCu()).isEqualTo(23);
            assertThat(candidate.evidence().soDungMoi()).isEqualTo(5);
            assertThat(candidate.evidence().soNgayMoi()).isEqualTo(7);
        });
    }

    @Test
    void overdueIsSharedAndEmptyWhenNoBacklog() {
        LearningPlanService plan = mock(LearningPlanService.class);
        when(plan.overdue(USER, 20)).thenReturn(Optional.empty());
        assertThat(new OverdueRule(plan, PROPERTIES).evaluate(USER, NOW)).isEmpty();

        when(plan.overdue(USER, 20)).thenReturn(Optional.of(new OverdueSummary(120, 10, 15, 45, 3, List.of(1L, 2L))));
        assertThat(new OverdueRule(plan, PROPERTIES).evaluate(USER, NOW)).singleElement().satisfies(candidate -> {
            assertThat(candidate.exclusive()).isFalse();
            assertThat(candidate.cardIds()).containsExactly(1L, 2L);
            assertThat(candidate.evidence().soQuaHan()).isEqualTo(120);
            assertThat(candidate.evidence().soNgayKeHoach()).isEqualTo(3);
            assertThat(candidate.message()).contains("120 lượt ôn quá hạn", "45 lượt mỗi ngày", "3 ngày");
        });
    }

    private void usable(Long... ids) {
        Map<Long, NotebookCardRow> rows = List.of(ids).stream()
                .collect(Collectors.toMap(Function.identity(),
                        id -> new NotebookCardRow(id, "w" + id, null, null, "nghĩa", null, 1L, "Bộ")));
        when(cards.usable(eq(USER), anyCollection())).thenAnswer(invocation -> {
            Collection<Long> asked = invocation.getArgument(1);
            return rows.entrySet().stream()
                    .filter(entry -> asked.contains(entry.getKey()))
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        });
    }

    private static PairStatRow pair(Long id, Long a, Long b, int count) {
        PairStatRow row = mock(PairStatRow.class);
        when(row.getId()).thenReturn(id);
        when(row.getThe1Id()).thenReturn(a);
        when(row.getThe2Id()).thenReturn(b);
        when(row.getSoLanNham()).thenReturn(count);
        when(row.getLanCuoiAt()).thenReturn(NOW);
        return row;
    }

    private static ProgressStatRow progress(Long id, long cu, long saiCu, long moi, long saiMoi) {
        ProgressStatRow row = mock(ProgressStatRow.class);
        when(row.getTheId()).thenReturn(id);
        when(row.getSoLuotCu()).thenReturn(cu);
        when(row.getSoSaiCu()).thenReturn(saiCu);
        when(row.getSoLuotMoi()).thenReturn(moi);
        when(row.getSoSaiMoi()).thenReturn(saiMoi);
        when(row.getLanCuoiAt()).thenReturn(NOW);
        return row;
    }
}
