package com.do_an_tot_nghiep.k28.notification.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.common.web.PageResponse;
import com.do_an_tot_nghiep.k28.notification.dto.AnnouncementQuery;
import com.do_an_tot_nghiep.k28.notification.dto.SystemAnnouncementRequest;
import com.do_an_tot_nghiep.k28.notification.dto.SystemAnnouncementResponse;
import com.do_an_tot_nghiep.k28.notification.service.AnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/v1/admin/announcements")
public class AdminAnnouncementController {

    private final AnnouncementService service;
    private final CurrentUser currentUser;

    @GetMapping
    public PageResponse<SystemAnnouncementResponse> list(@Valid @ModelAttribute AnnouncementQuery query) {
        return service.page(query);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SystemAnnouncementResponse create(@Valid @RequestBody SystemAnnouncementRequest request) {
        return service.create(currentUser.id(), request);
    }

    @PutMapping("/{id}")
    public SystemAnnouncementResponse update(@PathVariable Long id,
                                             @Valid @RequestBody SystemAnnouncementRequest request) {
        return service.update(currentUser.id(), id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(currentUser.id(), id);
    }
}
