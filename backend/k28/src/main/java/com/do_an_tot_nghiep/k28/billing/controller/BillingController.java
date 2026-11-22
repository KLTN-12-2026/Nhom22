package com.do_an_tot_nghiep.k28.billing.controller;

import com.do_an_tot_nghiep.k28.billing.dto.CheckoutRequest;
import com.do_an_tot_nghiep.k28.billing.dto.CancelSubscriptionRequest;
import com.do_an_tot_nghiep.k28.billing.dto.CheckoutResponse;
import com.do_an_tot_nghiep.k28.billing.dto.CurrentPlanResponse;
import com.do_an_tot_nghiep.k28.billing.dto.PlanResponse;
import com.do_an_tot_nghiep.k28.billing.dto.QuoteResponse;
import com.do_an_tot_nghiep.k28.billing.dto.StudentOfferResponse;
import com.do_an_tot_nghiep.k28.billing.dto.StudentVerificationRequest;
import com.do_an_tot_nghiep.k28.billing.dto.SubscriptionResponse;
import com.do_an_tot_nghiep.k28.billing.dto.TransactionQuery;
import com.do_an_tot_nghiep.k28.billing.dto.TransactionResponse;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import java.nio.charset.StandardCharsets;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.ModelAttribute;
import com.do_an_tot_nghiep.k28.billing.dto.VnpayIpnResponse;
import com.do_an_tot_nghiep.k28.billing.service.BillingService;
import com.do_an_tot_nghiep.k28.billing.service.PaymentConfirmationService;
import com.do_an_tot_nghiep.k28.billing.service.StudentOfferService;
import com.do_an_tot_nghiep.k28.billing.service.PaymentConfirmationService.KetQuaXacNhan;
import com.do_an_tot_nghiep.k28.billing.service.PaymentConfirmationService.XacNhan;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
public class BillingController {

    private final BillingService billing;
    private final PaymentConfirmationService confirmation;
    private final StudentOfferService students;
    private final CurrentUser currentUser;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @GetMapping("/api/v1/billing/plans")
    public List<PlanResponse> plans() {
        return billing.plans();
    }

    @GetMapping("/api/v1/me/subscription")
    public SubscriptionResponse subscription() {
        return billing.subscription(currentUser.id());
    }

    @GetMapping("/api/v1/me/plan")
    public CurrentPlanResponse currentPlan() {
        return billing.currentPlan(currentUser.id());
    }

    @PostMapping("/api/v1/me/subscription/cancel")
    public SubscriptionResponse cancelSubscription(@Valid @RequestBody CancelSubscriptionRequest request) {
        return billing.cancelSubscription(currentUser.id(), request);
    }

    @PostMapping("/api/v1/billing/quotes")
    public QuoteResponse quote(@Valid @RequestBody CheckoutRequest request) {
        return billing.quote(currentUser.id(), request);
    }

    @PostMapping("/api/v1/me/subscription/trial")
    @ResponseStatus(HttpStatus.CREATED)
    public SubscriptionResponse startTrial() {
        return billing.startTrial(currentUser.id());
    }

    @GetMapping("/api/v1/me/student-offer")
    public StudentOfferResponse studentOffer() {
        return students.status(currentUser.id());
    }

    @PostMapping("/api/v1/me/student-verifications")
    @ResponseStatus(HttpStatus.CREATED)
    public StudentOfferResponse submitStudentVerification(@Valid @RequestBody StudentVerificationRequest request) {
        return students.submit(currentUser.id(), request);
    }

    @PostMapping("/api/v1/me/student-offer/claim")
    public StudentOfferResponse claimStudentOffer() {
        return students.claim(currentUser.id());
    }

    @PostMapping("/api/v1/billing/checkouts")
    @ResponseStatus(HttpStatus.CREATED)
    public CheckoutResponse checkout(@Valid @RequestBody CheckoutRequest request, HttpServletRequest http) {
        return billing.checkout(currentUser.id(), request, http.getRemoteAddr());
    }

    @GetMapping("/api/v1/billing/transactions")
    public PageResponse<TransactionResponse> transactions(@Valid @ModelAttribute TransactionQuery query) {
        return billing.transactions(currentUser.id(), query);
    }

    @GetMapping("/api/v1/billing/transactions/{maDon}/receipt")
    public ResponseEntity<String> receipt(@PathVariable String maDon) {
        return ResponseEntity.ok()
                .contentType(new MediaType(MediaType.TEXT_HTML, StandardCharsets.UTF_8))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"bien-nhan-" + maDon + ".html\"")
                .header("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'")
                .cacheControl(CacheControl.noStore())
                .body(billing.receipt(currentUser.id(), maDon));
    }

    @GetMapping("/api/v1/billing/transactions/{maDon}")
    public TransactionResponse transaction(@PathVariable String maDon) {
        return billing.transaction(currentUser.id(), maDon);
    }

    @GetMapping("/api/v1/billing/vnpay/ipn")
    public VnpayIpnResponse ipn(@RequestParam Map<String, String> thamSo) {
        KetQuaXacNhan ketQua = confirmSafely(thamSo).ketQua();
        return new VnpayIpnResponse(ketQua.rspCode, ketQua.message);
    }

    @GetMapping("/api/v1/billing/vnpay/return")
    public ResponseEntity<Void> returnUrl(@RequestParam Map<String, String> thamSo) {
        XacNhan xacNhan = confirmSafely(thamSo);
        String query = xacNhan.maDon() != null ? "?maDon=" + xacNhan.maDon() : "?loi=" + xacNhan.ketQua().name();
        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(frontendUrl + "/thanh-toan-ket-qua" + query))
                .build();
    }

    private XacNhan confirmSafely(Map<String, String> thamSo) {
        try {
            return confirmation.confirm(thamSo);
        } catch (RuntimeException e) {
            log.error("Payment confirmation failed for order {}", thamSo.get("vnp_TxnRef"), e);
            return new XacNhan(KetQuaXacNhan.LOI_KHAC, null);
        }
    }
}
