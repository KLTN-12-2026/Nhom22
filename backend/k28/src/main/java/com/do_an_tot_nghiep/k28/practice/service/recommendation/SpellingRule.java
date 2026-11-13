package com.do_an_tot_nghiep.k28.practice.service.recommendation;

import com.do_an_tot_nghiep.k28.practice.dto.RecommendationEvidenceResponse;
import com.do_an_tot_nghiep.k28.practice.repository.NotebookCardRow;
import com.do_an_tot_nghiep.k28.practice.repository.SoTayTuKhoRepository;
import com.do_an_tot_nghiep.k28.practice.repository.SoTayTuKhoRepository.SpellingStatRow;
import com.do_an_tot_nghiep.k28.practice.service.NotebookProperties;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SpellingRule implements RecommendationRule {

    private final SoTayTuKhoRepository notebook;
    private final RecommendationCards cards;
    private final NotebookProperties properties;

    @Override
    public MaLyDoGoiY code() {
        return MaLyDoGoiY.SAI_CHINH_TA;
    }

    @Override
    public List<RecommendationCandidate> evaluate(Long userId, Instant now) {
        List<SpellingStatRow> rows = notebook.spellingStats(userId, properties.chinhTaLuot(), properties.chinhTaSai());
        Map<Long, NotebookCardRow> usable = cards.usable(userId, rows.stream().map(SpellingStatRow::getTheId).toList());
        return rows.stream()
                .filter(row -> usable.containsKey(row.getTheId()))
                .map(row -> new RecommendationCandidate(
                        code(),
                        "Luyện viết ‘%s’ vì bạn viết sai %d trong %d lượt gần đây".formatted(
                                usable.get(row.getTheId()).tu(), row.getSoSai(), row.getSoLuot()),
                        List.of(row.getTheId()),
                        RecommendationEvidenceResponse.builder()
                                .soSai(row.getSoSai().intValue())
                                .soLuot(row.getSoLuot().intValue())
                                .lanCuoiAt(row.getLanCuoiAt())
                                .build(),
                        true))
                .toList();
    }
}
