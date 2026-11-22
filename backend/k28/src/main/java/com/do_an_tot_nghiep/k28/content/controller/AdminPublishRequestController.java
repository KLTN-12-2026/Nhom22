package com.do_an_tot_nghiep.k28.content.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.CopyDiffResponse;
import com.do_an_tot_nghiep.k28.content.dto.LibraryCardResponse;
import com.do_an_tot_nghiep.k28.content.dto.PublishDecisionRequest;
import com.do_an_tot_nghiep.k28.content.dto.PublishRequestQuery;
import com.do_an_tot_nghiep.k28.content.dto.PublishRequestResponse;
import com.do_an_tot_nghiep.k28.content.service.PublishRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/publish-requests")
public class AdminPublishRequestController {

    private final PublishRequestService service;
    private final CurrentUser currentUser;

    @GetMapping
    public PageResponse<PublishRequestResponse> list(@Valid @ModelAttribute PublishRequestQuery query) {
        return service.adminQueue(query);
    }

    @GetMapping("/{id}/changes")
    public CopyDiffResponse changes(@PathVariable("id") Long id) {
        return service.requestChanges(currentUser.id(), PublishRequestController.checkedId(id), true);
    }

    @GetMapping("/{id}/cards")
    public PageResponse<LibraryCardResponse> cards(
            @PathVariable("id") Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.previewCards(currentUser.id(), PublishRequestController.checkedId(id), true, page, size);
    }

    @PostMapping("/{id}/decision")
    public PublishRequestResponse decide(
            @PathVariable("id") Long id,
            @Valid @RequestBody PublishDecisionRequest request
    ) {
        return service.decide(currentUser.id(), PublishRequestController.checkedId(id), request, true);
    }
}
