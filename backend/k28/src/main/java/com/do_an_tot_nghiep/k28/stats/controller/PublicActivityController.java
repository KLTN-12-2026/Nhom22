package com.do_an_tot_nghiep.k28.stats.controller;

import com.do_an_tot_nghiep.k28.stats.dto.PublicActivityResponse;
import com.do_an_tot_nghiep.k28.stats.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class PublicActivityController {

    private final ActivityService activityService;

    @GetMapping("/api/v1/library/authors/{id}/activity")
    public PublicActivityResponse activity(@PathVariable("id") Long id) {
        return activityService.publicActivity(id);
    }
}
