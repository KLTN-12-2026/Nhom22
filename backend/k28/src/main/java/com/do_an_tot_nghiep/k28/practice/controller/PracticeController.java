package com.do_an_tot_nghiep.k28.practice.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.practice.dto.CreatePracticeRequest;
import com.do_an_tot_nghiep.k28.practice.dto.PracticeHistoryQuery;
import com.do_an_tot_nghiep.k28.practice.dto.PracticeHistoryResponse;
import com.do_an_tot_nghiep.k28.practice.dto.PracticeResultResponse;
import com.do_an_tot_nghiep.k28.practice.dto.PracticeSessionResponse;
import com.do_an_tot_nghiep.k28.practice.dto.RetryPracticeRequest;
import com.do_an_tot_nghiep.k28.practice.dto.SubmitPracticeRequest;
import com.do_an_tot_nghiep.k28.practice.service.PracticeHistoryService;
import com.do_an_tot_nghiep.k28.practice.service.PracticeService;
import com.do_an_tot_nghiep.k28.practice.service.PracticeSubmissionService;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/practice")
@RequiredArgsConstructor
public class PracticeController {

    private final PracticeService practiceService;
    private final PracticeSubmissionService submissionService;
    private final PracticeHistoryService historyService;
    private final CurrentUser currentUser;

    @PostMapping("/sessions")
    public ResponseEntity<PracticeSessionResponse> create(@Valid @RequestBody CreatePracticeRequest request) {
        PracticeSessionResponse response = practiceService.create(currentUser.id(), request);
        return ResponseEntity.created(URI.create("/api/v1/practice/sessions/" + response.id())).body(response);
    }

    @GetMapping("/sessions/{id}")
    public PracticeSessionResponse get(@PathVariable("id") Long id) {
        return practiceService.get(currentUser.id(), id);
    }

    @GetMapping("/sessions/{id}/questions/{questionId}/audio")
    public FileResponse audio(@PathVariable("id") Long id, @PathVariable("questionId") Long questionId) {
        return practiceService.audio(currentUser.id(), id, questionId);
    }

    @PostMapping("/sessions/{id}/submissions")
    public ResponseEntity<PracticeResultResponse> submit(
            @PathVariable("id") Long id,
            @Valid @RequestBody SubmitPracticeRequest request
    ) {
        PracticeSubmissionService.Outcome outcome = submissionService.submit(currentUser.id(), id, request);
        return ResponseEntity
                .status(outcome.replayed() ? HttpStatus.OK : HttpStatus.CREATED)
                .body(outcome.body());
    }

    @GetMapping("/history")
    public PageResponse<PracticeHistoryResponse> history(@Valid @ModelAttribute PracticeHistoryQuery query) {
        return historyService.list(currentUser.id(), query);
    }

    @PostMapping("/mistakes/retry")
    public ResponseEntity<PracticeSessionResponse> retry(@Valid @RequestBody RetryPracticeRequest request) {
        PracticeSessionResponse response = practiceService.retry(currentUser.id(), request);
        return ResponseEntity.created(URI.create("/api/v1/practice/sessions/" + response.id())).body(response);
    }
}
