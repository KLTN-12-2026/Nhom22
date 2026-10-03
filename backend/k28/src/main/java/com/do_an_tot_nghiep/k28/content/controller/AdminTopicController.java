package com.do_an_tot_nghiep.k28.content.controller;

import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.content.dto.CreateTopicRequest;
import com.do_an_tot_nghiep.k28.content.dto.TopicResponse;
import com.do_an_tot_nghiep.k28.content.dto.UpdateTopicRequest;
import com.do_an_tot_nghiep.k28.content.service.TopicService;
import com.nimbusds.oauth2.sdk.TokenRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;

@RestController
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@RequestMapping("api/v1/admin/topics")
public class AdminTopicController {

    private final TopicService service;

    @GetMapping
    public PageResponse<TopicResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return service.list(page, size);
    }

    @GetMapping("/{id}")
    public TopicResponse get(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping
    public ResponseEntity<TopicResponse> create(@Valid @RequestBody CreateTopicRequest request) {
        TopicResponse response = service.create(request);

        return ResponseEntity.created(
                URI.create("/api/v1/admin/topics/" + response.id())
        ).body(response);
    }

    @PutMapping("/{id}")
    public TopicResponse update(@PathVariable Long id, @Valid @RequestBody UpdateTopicRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
