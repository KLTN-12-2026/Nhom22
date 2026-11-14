package com.do_an_tot_nghiep.k28.ai.controller;

import com.do_an_tot_nghiep.k28.ai.dto.AiRequestAcceptedResponse;
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

    @PostMapping("/card-drafts")
    public ResponseEntity<AiRequestAcceptedResponse> create(@Valid @RequestBody CreateCardDraftRequest request) {
        AiRequestAcceptedResponse response = cardDrafts.create(currentUser.id(), request);
        return ResponseEntity.accepted()
                .location(URI.create("/api/v1/ai/requests/" + response.requestId()))
                .body(response);
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
}
