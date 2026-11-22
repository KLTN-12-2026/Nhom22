package com.do_an_tot_nghiep.k28.content.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.content.dto.CardUsageResponse;
import com.do_an_tot_nghiep.k28.content.service.CardLimitService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class CardUsageController {

    private final CardLimitService cardLimits;
    private final CurrentUser currentUser;

    @GetMapping("/api/v1/me/card-usage")
    public CardUsageResponse usage() {
        return cardLimits.usage(currentUser.id());
    }
}
