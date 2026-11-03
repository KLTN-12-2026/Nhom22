package com.do_an_tot_nghiep.k28.stats.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.stats.dto.OverviewQuery;
import com.do_an_tot_nghiep.k28.stats.dto.SkillStatResponse;
import com.do_an_tot_nghiep.k28.stats.dto.SkillsQuery;
import com.do_an_tot_nghiep.k28.stats.dto.StatisticsOverviewResponse;
import com.do_an_tot_nghiep.k28.stats.service.StatisticsService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;
    private final CurrentUser currentUser;

    @GetMapping("/overview")
    public StatisticsOverviewResponse overview(@Valid @ModelAttribute OverviewQuery query) {
        return statisticsService.overview(currentUser.id(), query);
    }

    @GetMapping("/skills")
    public List<SkillStatResponse> skills(@Valid @ModelAttribute SkillsQuery query) {
        return statisticsService.skills(currentUser.id(), query);
    }
}
