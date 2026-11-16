package com.do_an_tot_nghiep.k28.moderation.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.moderation.dto.CreateReportRequest;
import com.do_an_tot_nghiep.k28.moderation.dto.ReportResponse;
import com.do_an_tot_nghiep.k28.moderation.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reports;
    private final CurrentUser currentUser;

    @PostMapping("/api/v1/reports")
    @ResponseStatus(HttpStatus.CREATED)
    public ReportResponse create(@Valid @RequestBody CreateReportRequest request) {
        return reports.create(currentUser.id(), request);
    }
}
