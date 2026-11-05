package com.do_an_tot_nghiep.k28.admin.controller;

import com.do_an_tot_nghiep.k28.admin.service.AdminDeckService;
import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.content.dto.CardResponse;
import com.do_an_tot_nghiep.k28.content.dto.UpdateCardRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/v1/admin/cards")
public class AdminCardController {

    private final AdminDeckService service;
    private final CurrentUser currentUser;

    @PatchMapping("/{id}")
    public CardResponse update(@PathVariable Long id, @Valid @RequestBody UpdateCardRequest request) {
        return service.updateCard(currentUser.id(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestParam(value = "version", required = false) Long version
    ) {
        if (version == null || version < 0) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "version", "Gửi phiên bản không âm của thẻ");
        }
        service.deleteCard(currentUser.id(), id, version);
        return ResponseEntity.noContent().build();
    }
}
