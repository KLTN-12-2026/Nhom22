package com.do_an_tot_nghiep.k28.learning.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.learning.dto.CreateSessionRequest;
import com.do_an_tot_nghiep.k28.learning.dto.StudySessionResponse;
import com.do_an_tot_nghiep.k28.learning.dto.TodayPlanResponse;
import com.do_an_tot_nghiep.k28.learning.service.LearningPlanService;
import com.do_an_tot_nghiep.k28.learning.service.StudySessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequestMapping("/api/v1/learning")
@RequiredArgsConstructor
public class LearningController {

    private final LearningPlanService planService;
    private final CurrentUser currentUser;
    private final StudySessionService sessionService;

    @GetMapping("/today")
    public TodayPlanResponse today() {
        return planService.today(currentUser.id());
    }

    @PostMapping("/sessions")
    public ResponseEntity<StudySessionResponse> create(
            @Valid @RequestBody CreateSessionRequest request
    ) {
        StudySessionResponse response = sessionService.create(currentUser.id(), request);
        return ResponseEntity.created(
                URI.create("/api/v1/learning/sessions/" + response.id())
        ).body(response);
    }

    @GetMapping("/sessions/{id}")
    public StudySessionResponse get(@PathVariable("id") Long id) {
        return sessionService.get(currentUser.id(), id);
    }
}
