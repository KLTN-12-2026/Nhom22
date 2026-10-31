package com.do_an_tot_nghiep.k28.practice.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.practice.dto.CreatePracticeRequest;
import com.do_an_tot_nghiep.k28.practice.dto.PracticeSessionResponse;
import com.do_an_tot_nghiep.k28.practice.service.PracticeService;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
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
}
