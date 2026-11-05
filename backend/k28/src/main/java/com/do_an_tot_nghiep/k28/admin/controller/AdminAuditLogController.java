package com.do_an_tot_nghiep.k28.admin.controller;

import com.do_an_tot_nghiep.k28.admin.dto.AuditLogQuery;
import com.do_an_tot_nghiep.k28.admin.dto.AuditLogResponse;
import com.do_an_tot_nghiep.k28.admin.service.AuditService;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/v1/admin/audit-logs")
public class AdminAuditLogController {

    private final AuditService service;
    private final CurrentUser currentUser;

    @GetMapping
    public PageResponse<AuditLogResponse> list(@Valid @ModelAttribute AuditLogQuery query) {
        return service.page(currentUser.id(), query);
    }
}
