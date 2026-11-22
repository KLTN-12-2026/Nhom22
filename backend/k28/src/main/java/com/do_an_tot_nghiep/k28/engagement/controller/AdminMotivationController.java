package com.do_an_tot_nghiep.k28.engagement.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.engagement.dto.*;
import com.do_an_tot_nghiep.k28.engagement.service.AdminMotivationService;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/v1/admin")
public class AdminMotivationController {

    private final AdminMotivationService service;
    private final CurrentUser currentUser;

    @GetMapping("/badges")
    public PageResponse<AdminBadgeResponse> badges(@RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
        return service.badges(page, size);
    }

    @PostMapping("/badges")
    public ResponseEntity<AdminBadgeResponse> createBadge(@Valid @RequestBody BadgeWriteRequest request) {
        AdminBadgeResponse response = service.createBadge(currentUser.id(), request);
        return ResponseEntity.created(URI.create("/api/v1/admin/badges/" + response.id())).body(response);
    }

    @PutMapping("/badges/{id}")
    public AdminBadgeResponse updateBadge(@PathVariable Long id, @Valid @RequestBody BadgeWriteRequest request) {
        return service.updateBadge(currentUser.id(), id, request);
    }

    @GetMapping("/challenges")
    public PageResponse<AdminChallengeResponse> challenges(@RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "20") int size) {
        return service.challenges(page, size);
    }

    @PostMapping("/challenges")
    public ResponseEntity<AdminChallengeResponse> createChallenge(@Valid @RequestBody ChallengeWriteRequest request) {
        AdminChallengeResponse response = service.createChallenge(currentUser.id(), request);
        return ResponseEntity.created(URI.create("/api/v1/admin/challenges/" + response.id())).body(response);
    }

    @PutMapping("/challenges/{id}")
    public AdminChallengeResponse updateChallenge(@PathVariable Long id, @Valid @RequestBody ChallengeWriteRequest request) {
        return service.updateChallenge(currentUser.id(), id, request);
    }
}
