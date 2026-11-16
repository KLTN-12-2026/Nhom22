package com.do_an_tot_nghiep.k28.admin.controller;

import com.do_an_tot_nghiep.k28.admin.dto.ServiceUsageResponse;
import com.do_an_tot_nghiep.k28.admin.dto.UpdateServiceQuotasRequest;
import com.do_an_tot_nghiep.k28.admin.service.AdminServiceOpsService;
import com.do_an_tot_nghiep.k28.common.quota.ServiceQuotaItem;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/v1/admin")
public class AdminServiceOpsController {

    private final AdminServiceOpsService service;
    private final CurrentUser currentUser;

    @GetMapping("/service-quotas")
    public List<ServiceQuotaItem> quotas() {
        return service.quotas();
    }

    @PutMapping("/service-quotas")
    public List<ServiceQuotaItem> updateQuotas(@Valid @RequestBody UpdateServiceQuotasRequest request) {
        return service.updateQuotas(currentUser.id(), request);
    }

    @GetMapping("/service-usage")
    public ServiceUsageResponse usage(
            @RequestParam(required = false) String tuNgay,
            @RequestParam(required = false) String denNgay
    ) {
        return service.usage(blankToNull(tuNgay), blankToNull(denNgay));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }
}
