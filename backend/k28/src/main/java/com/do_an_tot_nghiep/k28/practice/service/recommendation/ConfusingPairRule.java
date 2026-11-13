package com.do_an_tot_nghiep.k28.practice.service.recommendation;

import com.do_an_tot_nghiep.k28.practice.dto.RecommendationEvidenceResponse;
import com.do_an_tot_nghiep.k28.practice.entity.SoTayTuKho;
import com.do_an_tot_nghiep.k28.practice.repository.NotebookCardRow;
import com.do_an_tot_nghiep.k28.practice.repository.SoTayTuKhoRepository;
import com.do_an_tot_nghiep.k28.practice.repository.SoTayTuKhoRepository.PairStatRow;
import com.do_an_tot_nghiep.k28.practice.service.NotebookProperties;
import java.time.Instant;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ConfusingPairRule implements RecommendationRule {

    private final SoTayTuKhoRepository notebook;
    private final RecommendationCards cards;
    private final NotebookProperties properties;

    @Override
    public MaLyDoGoiY code() {
        return MaLyDoGoiY.CAP_DE_NHAM;
    }

    @Override
    public List<RecommendationCandidate> evaluate(Long userId, Instant now) {
        List<PairStatRow> pairs = notebook.pairStats(userId).stream()
                .filter(pair -> pair.getSoLanNham() >= properties.capNham())
                .toList();
        if (pairs.isEmpty()) {
            return List.of();
        }
        Map<Long, Instant> hidden = new HashMap<>();
        notebook.findByNguoiDungId(userId).stream()
                .filter(row -> row.getAnTuAt() != null)
                .forEach(row -> hidden.put(row.getTheId(), row.getAnTuAt()));
        Set<Long> ids = new HashSet<>();
        pairs.forEach(pair -> {
            ids.add(pair.getThe1Id());
            ids.add(pair.getThe2Id());
        });
        Map<Long, NotebookCardRow> usable = cards.usable(userId, ids);
        return pairs.stream()
                .filter(pair -> usable.containsKey(pair.getThe1Id()) && usable.containsKey(pair.getThe2Id()))
                .filter(pair -> visible(hidden, pair.getThe1Id(), pair) && visible(hidden, pair.getThe2Id(), pair))
                .map(pair -> new RecommendationCandidate(
                        code(),
                        "Phân biệt ‘%s’ và ‘%s’: bạn chọn nhầm %d lần".formatted(
                                usable.get(pair.getThe1Id()).tu(), usable.get(pair.getThe2Id()).tu(), pair.getSoLanNham()),
                        List.of(pair.getThe1Id(), pair.getThe2Id()),
                        RecommendationEvidenceResponse.builder()
                                .capId(String.valueOf(pair.getId()))
                                .soLanNham(pair.getSoLanNham())
                                .lanCuoiAt(pair.getLanCuoiAt())
                                .build(),
                        true))
                .toList();
    }

    private static boolean visible(Map<Long, Instant> hidden, Long theId, PairStatRow pair) {
        Instant anTuAt = hidden.get(theId);
        return anTuAt == null || pair.getLanCuoiAt().isAfter(anTuAt);
    }
}
