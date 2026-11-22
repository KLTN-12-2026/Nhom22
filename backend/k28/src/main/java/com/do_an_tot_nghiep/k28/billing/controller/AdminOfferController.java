package com.do_an_tot_nghiep.k28.billing.controller;

import com.do_an_tot_nghiep.k28.billing.dto.AdminStudentVerificationResponse;
import com.do_an_tot_nghiep.k28.billing.dto.OfferResponse;
import com.do_an_tot_nghiep.k28.billing.dto.PromotionQuery;
import com.do_an_tot_nghiep.k28.billing.dto.PromotionRequest;
import com.do_an_tot_nghiep.k28.billing.dto.PromotionResponse;
import com.do_an_tot_nghiep.k28.billing.dto.StudentDecisionRequest;
import com.do_an_tot_nghiep.k28.billing.dto.StudentVerificationQuery;
import com.do_an_tot_nghiep.k28.billing.dto.UpdateOfferRequest;
import com.do_an_tot_nghiep.k28.billing.entity.enums.MaUuDai;
import com.do_an_tot_nghiep.k28.billing.service.AdminOfferService;
import com.do_an_tot_nghiep.k28.billing.service.StudentOfferService;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/v1/admin")
public class AdminOfferController {

    private final AdminOfferService offers;
    private final StudentOfferService students;
    private final CurrentUser currentUser;

    @GetMapping("/promotions")
    public PageResponse<PromotionResponse> promotions(@Valid @ModelAttribute PromotionQuery query) {
        return offers.promotions(query);
    }

    @PostMapping("/promotions")
    @ResponseStatus(HttpStatus.CREATED)
    public PromotionResponse createPromotion(@Valid @RequestBody PromotionRequest request) {
        return offers.createPromotion(currentUser.id(), request);
    }

    @PutMapping("/promotions/{id}")
    public PromotionResponse updatePromotion(@PathVariable Long id, @Valid @RequestBody PromotionRequest request) {
        return offers.updatePromotion(currentUser.id(), id, request);
    }

    @GetMapping("/offers")
    public List<OfferResponse> offers() {
        return offers.offers();
    }

    @PutMapping("/offers/{ma}")
    public OfferResponse updateOffer(@PathVariable MaUuDai ma, @Valid @RequestBody UpdateOfferRequest request) {
        return offers.updateOffer(currentUser.id(), ma, request);
    }

    @GetMapping("/student-verifications")
    public PageResponse<AdminStudentVerificationResponse> studentVerifications(
            @Valid @ModelAttribute StudentVerificationQuery query) {
        return students.page(query);
    }

    @PostMapping("/student-verifications/{id}/decision")
    public AdminStudentVerificationResponse decide(@PathVariable Long id,
                                                   @Valid @RequestBody StudentDecisionRequest request) {
        return students.decide(currentUser.id(), id, request);
    }
}
