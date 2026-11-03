package com.do_an_tot_nghiep.k28.content.controller;

import com.do_an_tot_nghiep.k28.common.exception.ApiException;
import com.do_an_tot_nghiep.k28.common.exception.ErrorCode;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.CreateDeckRequest;
import com.do_an_tot_nghiep.k28.content.dto.DeckResponse;
import com.do_an_tot_nghiep.k28.content.dto.UpdateDeckRequest;
import com.do_an_tot_nghiep.k28.content.service.DeckService;
import com.do_an_tot_nghiep.k28.content.service.DeckCopyService;
import com.do_an_tot_nghiep.k28.content.service.DeckMediaService;
import com.do_an_tot_nghiep.k28.content.dto.FileResponse;
import com.do_an_tot_nghiep.k28.content.entity.enums.VaiTroTep;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/decks")
public class DeckController {

    private final DeckService service;
    private final CurrentUser currentUser;
    private final DeckCopyService copies;
    private final DeckMediaService media;

    @PostMapping("/{id}/copy")
    public ResponseEntity<DeckResponse> copy(
            @PathVariable("id") Long id,
            @RequestHeader(value = "Idempotency-Key", required = false) String key,
            @RequestBody(required = false) byte[] body
    ) {
        Long userId = currentUser.id();
        if (body != null && body.length > 0) {
            throw new ApiException(ErrorCode.VALIDATION_FAILED, "body", "API sao chép không nhận request body");
        }
        DeckResponse response = copies.copy(userId, checkedId(id), key);
        return ResponseEntity.created(URI.create("/api/v1/decks/" + response.id())).body(response);
    }

    @GetMapping("/{id}/cards/{cardId}/files/{role}")
    public FileResponse media(
            @PathVariable("id") Long id,
            @PathVariable("cardId") Long cardId,
            @PathVariable("role") VaiTroTep role
    ) {
        return media.get(currentUser.id(), checkedId(id), cardId, role);
    }

    @GetMapping
    public PageResponse<DeckResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.list(currentUser.id(), page, size);
    }

    @PostMapping
    public ResponseEntity<DeckResponse> create(
            @Valid @RequestBody CreateDeckRequest request
    ) {
        DeckResponse response = service.create(currentUser.id(), request);
        return ResponseEntity.created(
                URI.create("/api/v1/decks/" + response.id())
        ).body(response);
    }

    @GetMapping("/{id}")
    public DeckResponse get(@PathVariable("id") Long id) {
        return service.get(currentUser.id(), checkedId(id));
    }

    @PatchMapping("/{id}")
    public DeckResponse update(
            @PathVariable("id") Long id,
            @Valid @RequestBody UpdateDeckRequest request
    ) {
        return service.update(currentUser.id(), checkedId(id), request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable("id") Long id,
            @RequestParam(value = "version", required = false) Long version
    ) {
        Long userId = currentUser.id();
        Long deckId = checkedId(id);
        if (version == null || version < 0) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "version",
                    "Gửi phiên bản không âm của bộ thẻ"
            );
        }
        service.delete(userId, deckId, version);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/favorite")
    public ResponseEntity<Void> favorite(@PathVariable("id") Long id) {
        service.favorite(currentUser.id(), checkedId(id));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}/favorite")
    public ResponseEntity<Void> unfavorite(@PathVariable("id") Long id) {
        service.unfavorite(currentUser.id(), checkedId(id));
        return ResponseEntity.noContent().build();
    }

    private Long checkedId(Long id) {
        if (id == null || id <= 0) {
            throw new ApiException(
                    ErrorCode.VALIDATION_FAILED,
                    "id",
                    "ID bộ thẻ phải là số nguyên dương"
            );
        }
        return id;
    }
}
