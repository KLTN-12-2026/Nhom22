package com.do_an_tot_nghiep.k28.billing.controller;

import com.do_an_tot_nghiep.k28.billing.dto.AdminPaymentDetailResponse;
import com.do_an_tot_nghiep.k28.billing.dto.AdminPaymentQuery;
import com.do_an_tot_nghiep.k28.billing.dto.AdminPaymentResponse;
import com.do_an_tot_nghiep.k28.billing.dto.AdminPlanResponse;
import com.do_an_tot_nghiep.k28.billing.dto.AdminSubscriptionQuery;
import com.do_an_tot_nghiep.k28.billing.dto.AdminSubscriptionResponse;
import com.do_an_tot_nghiep.k28.billing.dto.ExpiryCheckRequest;
import com.do_an_tot_nghiep.k28.billing.dto.ExpiryCheckResponse;
import com.do_an_tot_nghiep.k28.billing.dto.RevenueQuery;
import com.do_an_tot_nghiep.k28.billing.dto.RevenueResponse;
import com.do_an_tot_nghiep.k28.billing.dto.UpdateExpiryRequest;
import com.do_an_tot_nghiep.k28.billing.dto.UpdatePlanRequest;
import com.do_an_tot_nghiep.k28.billing.service.AdminBillingService;
import com.do_an_tot_nghiep.k28.billing.service.RevenueService;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/v1/admin")
public class AdminBillingController {

    private final AdminBillingService billing;
    private final RevenueService revenue;
    private final CurrentUser currentUser;

    @GetMapping("/payments")
    public PageResponse<AdminPaymentResponse> payments(@Valid @ModelAttribute AdminPaymentQuery query) {
        return billing.payments(query);
    }

    @GetMapping("/payments/{maDon}")
    public AdminPaymentDetailResponse payment(@PathVariable String maDon) {
        return billing.payment(maDon);
    }

    @GetMapping("/subscriptions")
    public PageResponse<AdminSubscriptionResponse> subscriptions(@Valid @ModelAttribute AdminSubscriptionQuery query) {
        return billing.subscriptions(query);
    }

    @PatchMapping("/subscriptions/{id}/expiry")
    public AdminSubscriptionResponse updateExpiry(@PathVariable Long id, @Valid @RequestBody UpdateExpiryRequest request) {
        return billing.updateExpiry(currentUser.id(), id, request);
    }

    @PostMapping("/subscriptions/expiry-check")
    public ExpiryCheckResponse expiryCheck(@Valid @RequestBody ExpiryCheckRequest request) {
        return billing.runExpiryCheck(currentUser.id(), request);
    }

    @GetMapping("/plans")
    public List<AdminPlanResponse> plans() {
        return billing.plans();
    }

    @PutMapping("/plans/{ma}")
    public AdminPlanResponse updatePlan(@PathVariable String ma, @Valid @RequestBody UpdatePlanRequest request) {
        return billing.updatePlan(currentUser.id(), ma, request);
    }

    @GetMapping("/revenue")
    public RevenueResponse revenue(@Valid @ModelAttribute RevenueQuery query) {
        return revenue.revenue(query);
    }
}
