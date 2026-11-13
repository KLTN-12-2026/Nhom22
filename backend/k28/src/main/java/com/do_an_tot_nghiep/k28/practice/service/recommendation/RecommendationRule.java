package com.do_an_tot_nghiep.k28.practice.service.recommendation;

import java.time.Instant;
import java.util.List;

public interface RecommendationRule {

    MaLyDoGoiY code();

    List<RecommendationCandidate> evaluate(Long userId, Instant now);
}
