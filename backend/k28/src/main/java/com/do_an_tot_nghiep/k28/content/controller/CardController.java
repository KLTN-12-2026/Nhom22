package com.do_an_tot_nghiep.k28.content.controller;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.CardResponse;
import com.do_an_tot_nghiep.k28.content.dto.CreateCardRequest;
import com.do_an_tot_nghiep.k28.content.dto.UpdateCardRequest;
import com.do_an_tot_nghiep.k28.content.service.CardService;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1")
public class CardController {

    private final CardService service;
    private final CurrentUser currentUser;

    @GetMapping("/decks/{id}/cards")
    public PageResponse<CardResponse> list(
            @PathVariable("id") Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.list(
                currentUser.id(), checkedId(id, "bộ thẻ"), page, size
        );
    }

    @PostMapping("/decks/{id}/cards")
    public ResponseEntity<CardResponse> create(
            @PathVariable("id") Long id,
            @Valid @RequestBody CreateCardRequest request
    ) {
        CardResponse response = service.create(
                currentUser.id(), checkedId(id, "bộ thẻ"), request
        );

        return ResponseEntity.created(
                URI.create("/api/v1/cards/" + response.id())
        ).body(response);
    }

    @PatchMapping("/cards/{id}")
    public CardResponse update(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateCardRequest request
    ) {
        return service.update(
                currentUser.id(), checkedId(id, "thẻ từ vựng"), request
        );
    }

    @DeleteMapping("/cards/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable("id") Long id,
            @RequestParam(value = "version", required = false) Long version
    ) {
        Long userId = currentUser.id();
        Long cardId = checkedId(id, "thẻ từ vựng");

        if (version == null || version < 0) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "version",
                    "Gửi phiên bản không âm của thẻ"
            );
        }

        service.delete(userId, cardId, version);
        return ResponseEntity.noContent().build();
    }

    private Long checkedId(Long id, String resource) {
        if (id == null || id <= 0) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "id",
                    "ID " + resource + " phải là số nguyên dương"
            );
        }

        return id;
    }
}
