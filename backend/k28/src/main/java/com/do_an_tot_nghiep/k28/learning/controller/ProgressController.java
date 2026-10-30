package com.do_an_tot_nghiep.k28.learning.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.learning.dto.CardProgressResponse;
import com.do_an_tot_nghiep.k28.learning.dto.DeckProgressQuery;
import com.do_an_tot_nghiep.k28.learning.dto.DeckProgressResponse;
import com.do_an_tot_nghiep.k28.learning.dto.ResetProgressRequest;
import com.do_an_tot_nghiep.k28.learning.dto.SuspendProgressRequest;
import com.do_an_tot_nghiep.k28.learning.service.CardProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ProgressController {

    private final CurrentUser currentUser;
    private final CardProgressService progressService;

    @GetMapping("/decks/{id}/progress")
    public DeckProgressResponse deck(
            @PathVariable("id") Long id,
            @Valid @ModelAttribute DeckProgressQuery query
    ) {
        return progressService.deck(currentUser.id(), id, query);
    }

    @PutMapping("/cards/{id}/progress/suspend")
    public CardProgressResponse suspend(
            @PathVariable("id") Long id,
            @Valid @RequestBody SuspendProgressRequest request
    ) {
        return progressService.suspend(currentUser.id(), id, request.tamNgung());
    }

    @PostMapping("/cards/{id}/progress/reset")
    public CardProgressResponse reset(
            @PathVariable("id") Long id,
            @Valid @RequestBody ResetProgressRequest request
    ) {
        return progressService.reset(currentUser.id(), id);
    }
}
