package com.do_an_tot_nghiep.k28.practice.dto;

import com.do_an_tot_nghiep.k28.practice.service.recommendation.MaLyDoGoiY;
import java.util.List;

public record RecommendationResponse(
        MaLyDoGoiY reasonCode,
        String message,
        List<String> cardIds,
        RecommendationEvidenceResponse evidence
) {
}
