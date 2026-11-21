package com.do_an_tot_nghiep.k28.engagement.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.engagement.dto.LeaderboardQuery;
import com.do_an_tot_nghiep.k28.engagement.dto.LeaderboardResponse;
import com.do_an_tot_nghiep.k28.engagement.dto.WeeklyHonorResponse;
import com.do_an_tot_nghiep.k28.engagement.service.LeaderboardService;
import com.do_an_tot_nghiep.k28.engagement.service.WeeklyHonorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class LeaderboardController {

    private final LeaderboardService leaderboardService;
    private final CurrentUser currentUser;
    private final WeeklyHonorService weeklyHonors;

    @GetMapping("/api/v1/leaderboard")
    public LeaderboardResponse leaderboard(@Valid @ModelAttribute LeaderboardQuery query) {
        return leaderboardService.leaderboard(currentUser.id(), query);
    }

    @GetMapping("/api/v1/leaderboard/weekly-honors")
    public WeeklyHonorResponse weeklyHonors() {
        return weeklyHonors.latest();
    }
}
