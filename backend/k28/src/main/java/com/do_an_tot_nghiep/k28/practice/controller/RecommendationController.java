package com.do_an_tot_nghiep.k28.practice.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.practice.dto.RecommendationResponse;
import com.do_an_tot_nghiep.k28.practice.service.recommendation.RecommendationService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/learning")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;
    private final CurrentUser currentUser;

    @GetMapping("/recommendations")
    public List<RecommendationResponse> list() {
        return recommendationService.list(currentUser.id());
    }
}
