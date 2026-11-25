package com.do_an_tot_nghiep.k28.support.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.support.dto.CreateTicketRequest;
import com.do_an_tot_nghiep.k28.support.dto.TicketResponse;
import com.do_an_tot_nghiep.k28.support.service.SupportTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/support-tickets")
public class SupportTicketController {

    private final SupportTicketService service;
    private final CurrentUser currentUser;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TicketResponse create(@Valid @RequestBody CreateTicketRequest request) {
        return service.create(currentUser.id(), request);
    }

    @GetMapping
    public PageResponse<TicketResponse> list(@RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return service.list(currentUser.id(), page, size);
    }
}
