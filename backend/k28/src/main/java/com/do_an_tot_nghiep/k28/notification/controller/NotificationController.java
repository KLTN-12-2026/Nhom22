package com.do_an_tot_nghiep.k28.notification.controller;

import com.do_an_tot_nghiep.k28.common.security.CurrentUser;
import com.do_an_tot_nghiep.k28.notification.dto.NotificationListResponse;
import com.do_an_tot_nghiep.k28.notification.dto.NotificationQuery;
import com.do_an_tot_nghiep.k28.notification.dto.NotificationResponse;
import com.do_an_tot_nghiep.k28.notification.dto.NotificationUpdateRequest;
import com.do_an_tot_nghiep.k28.notification.service.NotificationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final CurrentUser currentUser;

    @GetMapping
    public NotificationListResponse list(@Valid @ModelAttribute NotificationQuery query) {
        return notificationService.list(currentUser.id(), query);
    }

    @PatchMapping("/{id}")
    public NotificationResponse update(@PathVariable Long id, @Valid @RequestBody NotificationUpdateRequest request) {
        return notificationService.update(currentUser.id(), id, request);
    }
}
