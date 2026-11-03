package com.do_an_tot_nghiep.k28.content.controller;

import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.CreateTagRequest;
import com.do_an_tot_nghiep.k28.content.dto.TagResponse;
import com.do_an_tot_nghiep.k28.content.dto.UpdateTagRequest;
import com.do_an_tot_nghiep.k28.content.service.TagService;
import jakarta.validation.Valid;
import java.net.URI;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("/api/v1/admin/tags")
public class AdminTagController {
    private final TagService service;

    @GetMapping
    public PageResponse<TagResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.list(page, size);
    }

    @GetMapping("/{id}")
    public TagResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<TagResponse> create(
            @Valid @RequestBody CreateTagRequest request
    ) {
        TagResponse response = service.create(request);
        return ResponseEntity.created(
                URI.create("/api/v1/admin/tags/" + response.id())
        ).body(response);
    }

    @PutMapping("/{id}")
    public TagResponse update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateTagRequest request
    ) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}