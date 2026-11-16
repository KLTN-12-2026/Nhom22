package com.do_an_tot_nghiep.k28.ai.controller;

import com.do_an_tot_nghiep.k28.ai.dto.AiHistoryItem;
import com.do_an_tot_nghiep.k28.ai.dto.AiHistoryQuery;
import com.do_an_tot_nghiep.k28.ai.dto.AiRequestAcceptedResponse;
import com.do_an_tot_nghiep.k28.ai.dto.CardImageRequest;
import com.do_an_tot_nghiep.k28.ai.dto.ContextExplanationRequest;
import com.do_an_tot_nghiep.k28.ai.dto.SentenceFeedbackRequest;
import com.do_an_tot_nghiep.k28.ai.service.AiTaskService;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.ai.dto.AiRequestResponse;
import com.do_an_tot_nghiep.k28.ai.dto.CardDraftCommitRequest;
import com.do_an_tot_nghiep.k28.ai.dto.CardDraftCommitResponse;
import com.do_an_tot_nghiep.k28.ai.dto.CreateCardDraftRequest;
import com.do_an_tot_nghiep.k28.ai.service.CardDraftCommitService;
import com.do_an_tot_nghiep.k28.ai.service.CardDraftService;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/ai")
public class AiController {

    private final CurrentUser currentUser;
    private final CardDraftService cardDrafts;
    private final CardDraftCommitService commits;
    private final AiTaskService tasks;

    @PostMapping("/card-drafts")
    public ResponseEntity<AiRequestAcceptedResponse> create(@Valid @RequestBody CreateCardDraftRequest request) {
        AiRequestAcceptedResponse response = cardDrafts.create(currentUser.id(), request);
        return ResponseEntity.accepted()
                .location(URI.create("/api/v1/ai/requests/" + response.requestId()))
                .body(response);
    }

    @PostMapping("/context-explanations")
    public ResponseEntity<AiRequestAcceptedResponse> explain(@Valid @RequestBody ContextExplanationRequest request) {
        return accepted(tasks.explain(currentUser.id(), request));
    }

    @PostMapping("/sentence-feedback")
    public ResponseEntity<AiRequestAcceptedResponse> feedback(@Valid @RequestBody SentenceFeedbackRequest request) {
        return accepted(tasks.feedback(currentUser.id(), request));
    }

    @PostMapping("/card-images")
    public ResponseEntity<AiRequestAcceptedResponse> image(@Valid @RequestBody CardImageRequest request) {
        return accepted(tasks.image(currentUser.id(), request));
    }

    @GetMapping("/history")
    public PageResponse<AiHistoryItem> history(@Valid @ModelAttribute AiHistoryQuery query) {
        return tasks.history(currentUser.id(), query);
    }

    @GetMapping("/requests/{id}")
    public AiRequestResponse get(@PathVariable Long id) {
        return cardDrafts.get(currentUser.id(), id);
    }

    @PostMapping("/card-drafts/{id}/commit")
    public CardDraftCommitResponse commit(@PathVariable Long id,
                                          @RequestHeader(value = "Idempotency-Key", required = false) String key,
                                          @Valid @RequestBody CardDraftCommitRequest request) {
        return commits.commit(currentUser.id(), id, key, request);
    }

    private static ResponseEntity<AiRequestAcceptedResponse> accepted(AiRequestAcceptedResponse response) {
        return ResponseEntity.accepted()
                .location(URI.create("/api/v1/ai/requests/" + response.requestId()))
                .body(response);
    }
}
