package com.do_an_tot_nghiep.k28.admin.controller;

import com.do_an_tot_nghiep.k28.admin.dto.CreateSampleDeckRequest;
import com.do_an_tot_nghiep.k28.admin.dto.DeleteSampleDeckRequest;
import com.do_an_tot_nghiep.k28.admin.dto.UpdateSampleDeckRequest;
import com.do_an_tot_nghiep.k28.admin.service.AdminDeckService;
import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.CardResponse;
import com.do_an_tot_nghiep.k28.content.dto.CreateCardRequest;
import com.do_an_tot_nghiep.k28.content.dto.SampleDeckResponse;
import com.do_an_tot_nghiep.k28.content.entity.enums.TrangThaiBoMau;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/v1/admin/decks")
public class AdminDeckController {

    private final AdminDeckService service;
    private final CurrentUser currentUser;

    @GetMapping
    public PageResponse<SampleDeckResponse> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) TrangThaiBoMau trangThai,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return service.list(q == null || q.isBlank() ? null : q.strip(), trangThai, page, size);
    }

    @GetMapping("/{id}")
    public SampleDeckResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<SampleDeckResponse> create(@Valid @RequestBody CreateSampleDeckRequest request) {
        SampleDeckResponse response = service.create(currentUser.id(), request);
        return ResponseEntity.created(URI.create("/api/v1/admin/decks/" + response.id())).body(response);
    }

    @PatchMapping("/{id}")
    public SampleDeckResponse update(@PathVariable Long id, @Valid @RequestBody UpdateSampleDeckRequest request) {
        return service.update(currentUser.id(), id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, @Valid @RequestBody DeleteSampleDeckRequest request) {
        service.delete(currentUser.id(), id, request);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/cards")
    public PageResponse<CardResponse> cards(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.cards(id, page, size);
    }

    @PostMapping("/{id}/cards")
    public ResponseEntity<CardResponse> createCard(@PathVariable Long id, @Valid @RequestBody CreateCardRequest request) {
        CardResponse response = service.createCard(currentUser.id(), id, request);
        return ResponseEntity.created(URI.create("/api/v1/admin/cards/" + response.id())).body(response);
    }
}
