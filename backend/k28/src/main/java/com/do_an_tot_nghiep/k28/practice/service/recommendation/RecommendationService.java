package com.do_an_tot_nghiep.k28.practice.service.recommendation;

import com.do_an_tot_nghiep.k28.practice.dto.RecommendationResponse;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final List<RecommendationRule> rules;
    private final RecommendationProperties properties;
    private final Clock clock;

    @Transactional
    public List<RecommendationResponse> list(Long userId) {
        Instant now = clock.instant();
        Set<Long> used = new HashSet<>();
        List<RecommendationResponse> result = new ArrayList<>();
        List<RecommendationRule> ordered = rules.stream()
                .sorted(Comparator.comparing(RecommendationRule::code))
                .toList();
        for (RecommendationRule rule : ordered) {
            if (result.size() >= properties.toiDaGoiY()) {
                break;
            }
            int taken = 0;
            for (RecommendationCandidate candidate : rule.evaluate(userId, now)) {
                if (taken >= properties.toiDaMoiLyDo() || result.size() >= properties.toiDaGoiY()) {
                    break;
                }
                if (candidate.exclusive()) {
                    if (candidate.cardIds().stream().anyMatch(used::contains)) {
                        continue;
                    }
                    used.addAll(candidate.cardIds());
                }
                result.add(candidate.toResponse());
                taken++;
            }
        }
        return result;
    }
}
