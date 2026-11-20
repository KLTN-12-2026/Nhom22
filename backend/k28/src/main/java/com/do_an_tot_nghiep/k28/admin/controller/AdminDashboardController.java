package com.do_an_tot_nghiep.k28.admin.controller;

import com.do_an_tot_nghiep.k28.admin.dto.AdminDashboardResponse;
import com.do_an_tot_nghiep.k28.admin.service.AdminDashboardService;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {

    private final AdminDashboardService service;
    private final CurrentUser currentUser;

    @GetMapping
    public AdminDashboardResponse dashboard(@RequestParam(required = false) Integer soNgay) {
        return service.dashboard(currentUser.id(), soNgay);
    }
}
