package com.do_an_tot_nghiep.k28.learning.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.learning.dto.TodayPlanResponse;
import com.do_an_tot_nghiep.k28.learning.service.LearningPlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/learning")
@RequiredArgsConstructor
public class LearningController {

    private final LearningPlanService planService;
    private final CurrentUser currentUser;

    @GetMapping("/today")
    public TodayPlanResponse today() {
        return planService.today(currentUser.id());
    }
}
