package com.do_an_tot_nghiep.k28.engagement.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.engagement.dto.BadgeResponse;
import com.do_an_tot_nghiep.k28.engagement.dto.ChallengeResponse;
import com.do_an_tot_nghiep.k28.engagement.dto.RewardHistoryQuery;
import com.do_an_tot_nghiep.k28.engagement.dto.RewardHistoryResponse;
import com.do_an_tot_nghiep.k28.engagement.service.EngagementService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class EngagementController {

    private final EngagementService engagementService;
    private final CurrentUser currentUser;

    @GetMapping("/rewards/history")
    public RewardHistoryResponse history(@Valid @ModelAttribute RewardHistoryQuery query) {
        return engagementService.history(currentUser.id(), query);
    }

    @GetMapping("/badges")
    public List<BadgeResponse> badges() {
        return engagementService.badges(currentUser.id());
    }

    @GetMapping("/challenges")
    public List<ChallengeResponse> challenges() {
        return engagementService.challenges(currentUser.id());
    }
}
