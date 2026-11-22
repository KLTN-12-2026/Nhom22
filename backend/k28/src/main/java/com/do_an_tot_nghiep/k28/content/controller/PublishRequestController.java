package com.do_an_tot_nghiep.k28.content.controller;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.CopyDiffResponse;
import com.do_an_tot_nghiep.k28.content.dto.DeckPublishStatusResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibraryCardResponse;
import com.do_an_tot_nghiep.k28.content.dto.PublishDecisionRequest;
import com.do_an_tot_nghiep.k28.content.dto.PublishRequestCreateRequest;
import com.do_an_tot_nghiep.k28.content.dto.PublishRequestQuery;
import com.do_an_tot_nghiep.k28.content.dto.PublishRequestResponse;
import com.do_an_tot_nghiep.k28.content.service.PublishRequestService;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class PublishRequestController {

    private final PublishRequestService service;
    private final CurrentUser currentUser;

    @PostMapping("/decks/{id}/publish-requests")
    public ResponseEntity<DeckPublishStatusResponse> submit(
            @PathVariable("id") Long id,
            @Valid @RequestBody(required = false) PublishRequestCreateRequest request
    ) {
        DeckPublishStatusResponse response = service.submit(currentUser.id(), checkedId(id),
                request == null ? null : request.loiNhan());
        return ResponseEntity.created(URI.create("/api/v1/publish-requests/" + response.id())).body(response);
    }

    @DeleteMapping("/publish-requests/{id}")
    public DeckPublishStatusResponse withdraw(@PathVariable("id") Long id) {
        return service.withdraw(currentUser.id(), checkedId(id));
    }

    @GetMapping("/me/publish-requests")
    public PageResponse<PublishRequestResponse> inbox(@Valid @ModelAttribute PublishRequestQuery query) {
        return service.inbox(currentUser.id(), query);
    }

    @PostMapping("/publish-requests/{id}/decision")
    public PublishRequestResponse decide(
            @PathVariable("id") Long id,
            @Valid @RequestBody PublishDecisionRequest request
    ) {
        return service.decide(currentUser.id(), checkedId(id), request, false);
    }

    @GetMapping("/decks/{id}/publish-changes")
    public CopyDiffResponse copyChanges(@PathVariable("id") Long id) {
        return service.copyChanges(currentUser.id(), checkedId(id));
    }

    @GetMapping("/publish-requests/{id}/changes")
    public CopyDiffResponse changes(@PathVariable("id") Long id) {
        return service.requestChanges(currentUser.id(), checkedId(id), false);
    }

    @GetMapping("/publish-requests/{id}/cards")
    public PageResponse<LibraryCardResponse> cards(
            @PathVariable("id") Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.previewCards(currentUser.id(), checkedId(id), false, page, size);
    }

    static Long checkedId(Long id) {
        if (id == null || id <= 0) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "id", "ID phải là số nguyên dương");
        }
        return id;
    }
}
