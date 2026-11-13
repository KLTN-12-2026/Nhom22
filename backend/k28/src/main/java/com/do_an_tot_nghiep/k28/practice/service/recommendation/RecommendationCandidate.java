package com.do_an_tot_nghiep.k28.practice.service.recommendation;

import com.do_an_tot_nghiep.k28.practice.dto.RecommendationEvidenceResponse;
import com.do_an_tot_nghiep.k28.practice.dto.RecommendationResponse;
import java.util.List;

public record RecommendationCandidate(
        MaLyDoGoiY reasonCode,
        String message,
        List<Long> cardIds,
        RecommendationEvidenceResponse evidence,
        boolean exclusive
) {

    public RecommendationResponse toResponse() {
        return new RecommendationResponse(
                reasonCode, message, cardIds.stream().map(String::valueOf).toList(), evidence);
    }
}
